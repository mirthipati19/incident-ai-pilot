
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, MessageCircle, X, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { ChatMessage } from '@/services/chatHistoryService';
import { sessionChatService, ChatSession } from '@/services/sessionChatService';
import { getWebhookUrl } from '@/utils/authexaConfig';

interface ImprovedChatSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImprovedChatSupport: React.FC<ImprovedChatSupportProps> = ({ isOpen, onClose }) => {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useImprovedAuth();

  // Initialize chat session when component mounts and user is available
  useEffect(() => {
    const initializeChatSession = async () => {
      if (!user?.id || isInitialized) return;
      
      setIsChatHistoryLoading(true);
      console.log('🔄 Initializing chat session for user:', user.id);
      
      try {
        const session = await sessionChatService.initializeSession(user.id);
        console.log('📚 Chat session initialized:', session.messages.length, 'messages');
        
        // If no messages exist, add welcome message
        if (session.messages.length === 0) {
          const welcomeMessage: ChatMessage = {
            id: Date.now(),
            text: "Hello! I'm here to help you with any questions or issues you might have. How can I assist you today?",
            isBot: true,
            timestamp: new Date(),
            userId: user.id
          };
          
          const updatedSession = await sessionChatService.addMessage(session, welcomeMessage);
          setChatSession(updatedSession);
          console.log('👋 Added welcome message for new conversation');
        } else {
          setChatSession(session);
          console.log('✅ Chat session restored with history');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize chat session:', error);
        // Create minimal session with welcome message on error
        const welcomeMessage: ChatMessage = {
          id: Date.now(),
          text: "Hello! I'm here to help you with any questions or issues you might have. How can I assist you today?",
          isBot: true,
          timestamp: new Date(),
          userId: user.id
        };
        
        const fallbackSession: ChatSession = {
          sessionId: `fallback_${user.id}_${Date.now()}`,
          userId: user.id,
          messages: [welcomeMessage],
          lastActivity: new Date(),
          isActive: true
        };
        
        setChatSession(fallbackSession);
        setIsInitialized(true);
      } finally {
        setIsChatHistoryLoading(false);
      }
    };

    if (isOpen && user?.id) {
      initializeChatSession();
    }
  }, [isOpen, user?.id, isInitialized]);

  // Update session activity when messages change
  useEffect(() => {
    if (chatSession && chatSession.messages.length > 0) {
      sessionChatService.updateActivity();
    }
  }, [chatSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession?.messages, streamingMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user?.id || !chatSession) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date(),
      userId: user.id
    };

    // Add user message to session
    const updatedSession = await sessionChatService.addMessage(chatSession, userMessage);
    setChatSession(updatedSession);
    
    const currentMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      console.log('📤 Sending message to webhook:', getWebhookUrl('chat'));
      
      const response = await fetch(getWebhookUrl('chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          userId: user.id,
          userName: user.name || user.email || 'User',
          timestamp: new Date().toISOString(),
          sessionId: updatedSession.sessionId,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response supports streaming
      if (response.body && response.headers.get('content-type')?.includes('text/plain')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;
            setStreamingMessage(accumulatedText);
          }

          // Create final bot message
          const botMessage: ChatMessage = {
            id: Date.now() + 1,
            text: accumulatedText || "I received your message and I'm working on a response.",
            isBot: true,
            timestamp: new Date(),
            userId: user.id
          };

          // Add bot message to session
          const finalSession = await sessionChatService.addMessage(updatedSession, botMessage);
          setChatSession(finalSession);
        } catch (streamError) {
          console.error('❌ Streaming error:', streamError);
          throw streamError;
        }
      } else {
        // Fallback to regular JSON response
        const data = await response.json();
        console.log('📥 Webhook response:', data);

        const botMessage: ChatMessage = {
          id: Date.now() + 1,
          text: data.response || data.message || "I received your message and I'm working on a response.",
          isBot: true,
          timestamp: new Date(),
          userId: user.id
        };

        // Add bot message to session
        const finalSession = await sessionChatService.addMessage(updatedSession, botMessage);
        setChatSession(finalSession);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact support directly.",
        isBot: true,
        timestamp: new Date(),
        userId: user.id
      };
      
      // Add error message to session
      const errorSession = await sessionChatService.addMessage(updatedSession, errorMessage);
      setChatSession(errorSession);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
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
    <Card className={`fixed bottom-4 right-4 shadow-2xl z-50 flex flex-col transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Chat Support</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-100">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col flex-1 p-0">
          <ScrollArea className="flex-1 p-4">
            {isChatHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading chat history...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {chatSession?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    {message.isBot && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.isBot
                          ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      <span className="text-xs opacity-70 mt-2 block">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    {!message.isBot && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Streaming message display */}
                {isStreaming && streamingMessage && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[80%] p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-sm">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamingMessage}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading indicator */}
                {isLoading && !isStreaming && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-xs text-gray-500">Typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4 flex-shrink-0 bg-gray-50">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading || !user?.id}
                className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || !user?.id}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4"
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
      )}
    </Card>
  );
};

export default ImprovedChatSupport;
