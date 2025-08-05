
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, MessageCircle, X, Loader2, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { AIChatService, AIMessage } from '@/services/aiChatService';
import { chatHistoryService } from '@/services/chatHistoryService';
import { useToast } from '@/hooks/use-toast';

interface ChatSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage extends AIMessage {
  actions?: Array<{
    text: string;
    action: string;
  }>;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useImprovedAuth();
  const { toast } = useToast();
  const aiService = AIChatService.getInstance();

  // Load chat history and initialize session
  useEffect(() => {
    if (isOpen && user?.id && !sessionStarted) {
      initializeChat();
      setSessionStarted(true);
    }
  }, [isOpen, user?.id, sessionStarted]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Load previous chat history
      const history = await chatHistoryService.getChatHistory(user!.id);
      
      // Add welcome message if no history
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        text: "👋 Hello! I'm your AI assistant. I can help you with technical support, account issues, creating tickets, and much more. What can I help you with today?",
        isBot: true,
        timestamp: new Date(),
        actions: [
          { text: "Reset Password", action: "password_reset" },
          { text: "Create Support Ticket", action: "create_ticket" },
          { text: "Account Issues", action: "account_help" },
          { text: "Technical Problem", action: "tech_support" }
        ]
      };

      if (history.length === 0) {
        setMessages([welcomeMessage]);
      } else {
        // Convert history format and add welcome
        const convertedHistory = history.map(msg => ({
          ...msg,
          id: msg.id.toString()
        }));
        setMessages([welcomeMessage, ...convertedHistory]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setMessages([{
        id: 'error',
        text: "Hello! I'm ready to help you. How can I assist you today?",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend || isLoading || !user?.id) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageToSend,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get AI response
      const aiResponse = await aiService.sendMessage(messageToSend, user.id);
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
        setIsLoading(false);

        // Save updated chat history
        const updatedMessages = [...messages, userMessage, aiResponse];
        chatHistoryService.saveChatHistory(user.id, updatedMessages.map(msg => ({
          ...msg,
          id: typeof msg.id === 'string' ? parseInt(msg.id) || Date.now() : msg.id
        })));
      }, 1500);

    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
      setIsLoading(false);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "I apologize, but I'm having trouble responding right now. Please try again or contact support directly.",
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to reach AI assistant. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      password_reset: "I need help resetting my password",
      create_ticket: "I want to create a support ticket",
      account_help: "I'm having issues with my account",
      tech_support: "I'm experiencing a technical problem",
      human_agent: "I'd like to speak with a human agent",
      account_settings: "Help me with account settings"
    };

    const message = actionMessages[action] || `Help me with: ${action}`;
    sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-[420px] h-[600px] shadow-2xl z-50 flex flex-col bg-gradient-to-br from-white to-slate-50 border border-slate-200">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-6 h-6" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
              <p className="text-white/80 text-sm">Powered by advanced AI</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/90 text-xs">Online & Ready</span>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
            AI Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-0 bg-gradient-to-b from-slate-50 to-white">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex gap-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {message.isBot && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                      message.isBot
                        ? 'bg-white border border-slate-200 text-slate-700'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs opacity-70 ${message.isBot ? 'text-slate-500' : 'text-white/80'}`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.isBot && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">AI</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!message.isBot && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Quick action buttons for bot messages */}
                {message.isBot && message.actions && message.actions.length > 0 && (
                  <div className="ml-11 mt-2 flex flex-wrap gap-2">
                    {message.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.action)}
                        className="text-xs bg-white hover:bg-slate-50 border-slate-300 text-slate-700 rounded-full px-3 py-1 h-auto"
                      >
                        {action.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-slate-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-slate-200 p-4 flex-shrink-0 bg-white">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your account, tech issues, or support..."
                disabled={isLoading || !user?.id}
                className="rounded-2xl border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>
            <Button 
              onClick={() => sendMessage()}
              disabled={isLoading || !inputMessage.trim() || !user?.id}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 w-12 p-0 shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {!user?.id && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-orange-700">
                Please sign in to use AI chat support
              </p>
            </div>
          )}
          
          {user?.id && (
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Powered by AI</span>
              </div>
              <span>•</span>
              <span>Responses in ~2 seconds</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSupport;
