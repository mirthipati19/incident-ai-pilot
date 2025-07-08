
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Hello! I'm your Authexa support assistant. Describe any issues you're experiencing and I'll help you resolve them.",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (user?.id && !historyLoaded) {
        try {
          const history = await chatHistoryService.getChatHistory(user.id);
          if (history.length > 0) {
            setMessages(history);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        } finally {
          setHistoryLoaded(true);
        }
      }
    };

    loadChatHistory();
  }, [user?.id, historyLoaded]);

  // Save chat history whenever messages change (but only after history is loaded)
  useEffect(() => {
    const saveChatHistory = async () => {
      if (user?.id && historyLoaded && messages.length > 1) {
        try {
          await chatHistoryService.saveChatHistory(user.id, messages);
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
      }
    };

    saveChatHistory();
  }, [messages, user?.id, historyLoaded]);

  const handleSend = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage: ChatMessage = {
        id: Date.now(),
        text: inputValue,
        isBot: false,
        timestamp: new Date()
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
            userId: user?.id || null,
            userEmail: user?.email || null,
            timestamp: new Date().toISOString(),
            source: 'authexa_chat_support'
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Webhook response:', data);
          
          // Extract the response from the webhook - handle both direct strings and output field
          let botResponseText = '';
          
          if (data.output) {
            // If there's an output field, use that
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
            // Fallback to stringify if no recognized field
            botResponseText = JSON.stringify(data);
          }
          
          const botResponse: ChatMessage = {
            id: Date.now() + 1,
            text: botResponseText || `I've received your message: "${messageText}" and I'm processing it. Our support team will get back to you shortly.`,
            isBot: true,
            timestamp: new Date()
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
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

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
            placeholder="Describe your IT issue..."
            className="bg-slate-700 border-slate-500 text-white placeholder-slate-400 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
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
