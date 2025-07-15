
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X } from 'lucide-react';
import { AUTHEXA_CONFIG } from '@/utils/authexaConfig';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { chatHistoryService, ChatMessage } from '@/services/chatHistoryService';

interface ChatSupportProps {
  onClose: () => void;
  onMessageSent?: (message: string) => void;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ onClose, onMessageSent }) => {
  const { user } = useImprovedAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component mounts and user is available
  useEffect(() => {
    const loadChatHistory = async () => {
      // Only load if user is authenticated and history hasn't been loaded yet
      if (user?.id && !historyLoaded) {
        console.log('Loading chat history for authenticated user:', user.id);
        setIsLoadingHistory(true);
        
        try {
          const history = await chatHistoryService.getChatHistory(user.id);
          console.log('Loaded chat history:', history);
          
          if (history.length > 0) {
            setMessages(history);
            console.log('Set messages from history:', history.length);
          } else {
            // Set default welcome message if no history exists
            const welcomeMessage: ChatMessage = {
              id: Date.now(),
              text: "Hello! I'm your Authexa support assistant. Describe any issues you're experiencing and I'll help you resolve them.",
              isBot: true,
              timestamp: new Date(),
              userId: user.id
            };
            setMessages([welcomeMessage]);
            console.log('No history found, set welcome message');
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          // Set default welcome message on error
          const welcomeMessage: ChatMessage = {
            id: Date.now(),
            text: "Hello! I'm your Authexa support assistant. Describe any issues you're experiencing and I'll help you resolve them.",
            isBot: true,
            timestamp: new Date(),
            userId: user.id
          };
          setMessages([welcomeMessage]);
        } finally {
          setHistoryLoaded(true);
          setIsLoadingHistory(false);
        }
      } else if (!user?.id) {
        console.log('No authenticated user, showing unauthenticated message');
        setIsLoadingHistory(false);
        const unauthenticatedMessage: ChatMessage = {
          id: Date.now(),
          text: "Please sign in to access chat support and view your conversation history.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages([unauthenticatedMessage]);
        setHistoryLoaded(true);
      }
    };

    loadChatHistory();
  }, [user?.id, historyLoaded]);

  // Save chat history whenever messages change (but only after history is loaded and user is authenticated)
  useEffect(() => {
    const saveChatHistory = async () => {
      if (user?.id && historyLoaded && messages.length > 0) {
        console.log('Attempting to save chat history, messages count:', messages.length);
        try {
          // Add userId to all messages before saving
          const messagesWithUserId = messages.map(msg => ({
            ...msg,
            userId: user.id
          }));
          await chatHistoryService.saveChatHistory(user.id, messagesWithUserId);
          console.log('Chat history saved successfully');
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
      }
    };

    // Add a small delay to avoid saving too frequently
    const timeoutId = setTimeout(saveChatHistory, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, user?.id, historyLoaded]);

  const handleSend = async () => {
    if (inputValue.trim() && !isLoading) {
      // Check if user is authenticated
      if (!user?.id) {
        console.warn('User not authenticated, cannot send message');
        return;
      }

      const userMessage: ChatMessage = {
        id: Date.now(),
        text: inputValue,
        isBot: false,
        timestamp: new Date(),
        userId: user.id
      };

      setMessages(prev => [...prev, userMessage]);
      
      // Call the callback if provided
      if (onMessageSent) {
        onMessageSent(inputValue);
      }

      const messageText = inputValue;
      setInputValue('');
      setIsLoading(true);

      try {
        // Send message to n8n webhook
        const response = await fetch(AUTHEXA_CONFIG.CHAT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            userId: user.id,
            userEmail: user.email || null,
            timestamp: new Date().toISOString(),
            source: 'authexa_chat_support'
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Webhook response:', data);
          
          // Extract the response from the webhook - prioritize 'output' field
          let botResponseText = '';
          
          if (data.output) {
            botResponseText = data.output;
          } else if (data.response) {
            botResponseText = data.response;
          } else if (data.message) {
            botResponseText = data.message;
          } else if (data.reply) {
            botResponseText = data.reply;
          } else if (data.answer) {
            botResponseText = data.answer;
          } else if (typeof data === 'string') {
            botResponseText = data;
          } else {
            botResponseText = `I've received your message: "${messageText}" and I'm processing it. Our support team will get back to you shortly.`;
          }
          
          const botResponse: ChatMessage = {
            id: Date.now() + 1,
            text: botResponseText,
            isBot: true,
            timestamp: new Date(),
            userId: user.id
          };
          
          setMessages(prev => [...prev, botResponse]);
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message to webhook:', error);
        
        // Fallback response in case of error
        const errorResponse: ChatMessage = {
          id: Date.now() + 1,
          text: `I understand you're experiencing: "${messageText}". I'm having trouble connecting to our support system right now, but I've logged your message and our team will respond as soon as possible.`,
          isBot: true,
          timestamp: new Date(),
          userId: user.id
        };
        
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && user?.id) {
      handleSend();
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative bg-slate-800 rounded-2xl w-full max-w-md h-[600px] flex flex-col border border-white/20">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading chat history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-slate-800 rounded-2xl w-full max-w-md h-[600px] flex flex-col border border-white/20">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-10"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Chat Header */}
        <div className="bg-slate-800 text-white p-4 rounded-t-2xl flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">Authexa Support Chat</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto"></div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 bg-slate-700 p-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${message.isBot ? 'text-left' : 'text-right'}`}
            >
              <div
                className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                  message.isBot
                    ? 'bg-slate-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {message.text}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4 text-left">
              <div className="inline-block max-w-[80%] p-3 rounded-lg text-sm bg-slate-600 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-xs">Typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-slate-600 p-4 rounded-b-2xl flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={user?.id ? "Describe your IT issue..." : "Please sign in to chat"}
            className="bg-slate-700 border-slate-500 text-white placeholder-slate-400 text-sm"
            disabled={isLoading || !user?.id}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || !user?.id}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
