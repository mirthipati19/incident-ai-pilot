
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, MessageCircle, X, Loader2 } from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { chatHistoryService, ChatMessage } from '@/services/chatHistoryService';
import { getWebhookUrl } from '@/utils/authexaConfig';

interface ChatSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useImprovedAuth();

  // Load chat history when component mounts and user is available
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id || isInitialized) return;
      
      setIsChatHistoryLoading(true);
      console.log('🔄 Loading chat history for user:', user.id);
      
      try {
        const history = await chatHistoryService.getChatHistory(user.id);
        console.log('📚 Chat history loaded:', history.length, 'messages');
        
        if (history.length > 0) {
          setMessages(history);
          console.log('✅ Chat history set in state');
        } else {
          // Add welcome message if no history
          const welcomeMessage: ChatMessage = {
            id: Date.now(),
            text: "Hello! I'm here to help you with any questions or issues you might have. How can I assist you today?",
            isBot: true,
            timestamp: new Date(),
            userId: user.id
          };
          setMessages([welcomeMessage]);
          console.log('👋 Added welcome message for new conversation');
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to load chat history:', error);
        // Add welcome message on error
        const welcomeMessage: ChatMessage = {
          id: Date.now(),
          text: "Hello! I'm here to help you with any questions or issues you might have. How can I assist you today?",
          isBot: true,
          timestamp: new Date(),
          userId: user.id
        };
        setMessages([welcomeMessage]);
        setIsInitialized(true);
      } finally {
        setIsChatHistoryLoading(false);
      }
    };

    if (isOpen && user?.id) {
      loadChatHistory();
    }
  }, [isOpen, user?.id, isInitialized]);

  // Save chat history whenever messages change
  useEffect(() => {
    const saveChatHistory = async () => {
      if (!user?.id || messages.length === 0 || !isInitialized) return;
      
      try {
        console.log('💾 Saving chat history:', messages.length, 'messages');
        await chatHistoryService.saveChatHistory(user.id, messages);
        console.log('✅ Chat history saved successfully');
      } catch (error) {
        console.error('❌ Failed to save chat history:', error);
      }
    };

    saveChatHistory();
  }, [messages, user?.id, isInitialized]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user?.id) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date(),
      userId: user.id
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('📤 Sending message to webhook:', getWebhookUrl('chat'));
      
      const response = await fetch(getWebhookUrl('chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          userId: user.id,
          userName: user.name || user.email || 'User',
          timestamp: new Date().toISOString(),
          sessionId: `chat_${user.id}_${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Webhook response:', data);

      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        text: data.response || data.message || "I received your message and I'm working on a response. Please give me a moment.",
        isBot: true,
        timestamp: new Date(),
        userId: user.id
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact support directly.",
        isBot: true,
        timestamp: new Date(),
        userId: user.id
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <CardTitle className="text-lg">Chat Support</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-0">
        <ScrollArea className="flex-1 p-4">
          {isChatHistoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading chat history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {message.isBot && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>

                  {!message.isBot && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading || !user?.id}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim() || !user?.id}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {!user?.id && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please sign in to use chat support
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSupport;
