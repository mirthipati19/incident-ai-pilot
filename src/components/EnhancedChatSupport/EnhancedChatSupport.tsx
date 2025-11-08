import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Bot, 
  User, 
  X, 
  Loader2, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Clock
} from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { enhancedChatService, type ChatMessage, type ChatSession } from '@/services/enhancedChatService';
import { useToast } from '@/hooks/use-toast';

interface EnhancedChatSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedChatSupport: React.FC<EnhancedChatSupportProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useImprovedAuth();
  const { toast } = useToast();

  // Initialize chat session
  const initializeChat = useCallback(async () => {
    if (!user?.id || isInitialized) return;

    try {
      setIsLoading(true);
      const session = await enhancedChatService.getOrCreateSession(user.id);
      setCurrentSession(session);
      
      // Load existing messages
      const existingMessages = await enhancedChatService.getMessages(session.id);
      
      // Add welcome message if no existing messages
      if (existingMessages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          user_id: user.id,
          message_text: "👋 Hello! I'm your enhanced AI assistant. I can help you with technical support, account issues, creating tickets, and much more. I now have improved reliability and real-time capabilities. What can I help you with today?",
          is_bot: true,
          message_type: 'text',
          metadata: {
            actions: [
              { text: "Reset Password", action: "password_reset" },
              { text: "Create Support Ticket", action: "create_ticket" },
              { text: "Account Issues", action: "account_help" },
              { text: "Technical Problem", action: "tech_support" }
            ]
          },
          session_id: session.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(existingMessages);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize chat. Working in offline mode.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isInitialized, toast]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const status = enhancedChatService.getConnectionStatus();
      setConnectionStatus(status);
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  // Listen for real-time messages
  useEffect(() => {
    const handleRealtimeMessage = (event: CustomEvent) => {
      const newMessage = event.detail as ChatMessage;
      
      // Only add if it's for current session and not from current user
      if (newMessage.session_id === currentSession?.id && newMessage.user_id !== user?.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMessage.id);
          if (!exists) {
            if (isMinimized) {
              setUnreadCount(prev => prev + 1);
            }
            return [...prev, newMessage];
          }
          return prev;
        });
      }
    };

    window.addEventListener('chatMessageReceived', handleRealtimeMessage as EventListener);
    return () => window.removeEventListener('chatMessageReceived', handleRealtimeMessage as EventListener);
  }, [currentSession?.id, user?.id, isMinimized]);

  // Initialize when opened
  useEffect(() => {
    if (isOpen && user?.id && !isInitialized) {
      initializeChat();
    }
  }, [isOpen, user?.id, isInitialized, initializeChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Reset unread count when expanded
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend || isLoading || !user?.id || !currentSession) return;

    const optimisticUserMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      user_id: user.id,
      message_text: messageToSend,
      is_bot: false,
      message_type: 'text',
      metadata: {},
      session_id: currentSession.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, optimisticUserMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const { userMessage, aiResponse } = await enhancedChatService.sendMessage(
        user.id,
        messageToSend,
        currentSession.id
      );

      // Replace optimistic message with real one and add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== optimisticUserMessage.id);
        return [...filtered, userMessage, aiResponse];
      });

      setIsTyping(false);
      setIsLoading(false);

    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
      setIsLoading(false);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        user_id: user.id,
        message_text: "I apologize, but I'm having trouble responding right now. Please try again or contact support directly.",
        is_bot: true,
        message_type: 'error',
        metadata: {},
        session_id: currentSession.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Message Failed",
        description: "Unable to send message. Please try again.",
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
      privacy_settings: "Help me with privacy settings"
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

  const retryConnection = async () => {
    if (!user?.id) return;
    
    setIsInitialized(false);
    await enhancedChatService.disconnect();
    await initializeChat();
    
    toast({
      title: "Reconnecting",
      description: "Attempting to reconnect...",
    });
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-3 h-3 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Offline Mode';
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 w-80 shadow-2xl z-[9999] bg-primary border-primary-foreground/20 text-primary-foreground">
        <CardHeader 
          className="p-4 cursor-pointer hover:bg-primary-foreground/10 transition-colors"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">AI Assistant</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[400px] h-[650px] max-h-[90vh] shadow-2xl z-[9999] flex flex-col bg-card border-border">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
              <p className="text-primary-foreground/80 text-sm flex items-center gap-2">
                {getConnectionIcon()}
                {getConnectionText()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMinimized(true)}
              className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0"
            >
              <span className="text-sm">−</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {connectionStatus === 'disconnected' && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={retryConnection}
              className="text-primary-foreground hover:bg-primary-foreground/10 h-7 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry Connection
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-0 bg-background overflow-hidden">
        {connectionStatus === 'disconnected' && (
          <Alert className="m-4 mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Working in offline mode. Messages will sync when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1 p-4 h-full">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex gap-3 ${message.is_bot ? 'justify-start' : 'justify-end'}`}>
                  {message.is_bot && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                  )}
                  
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                    message.is_bot
                      ? message.message_type === 'error'
                        ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                        : 'bg-muted border border-border text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs opacity-70 ${
                        message.is_bot ? 'text-muted-foreground' : 'text-primary-foreground/80'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.is_bot && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">AI</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!message.is_bot && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                  )}
                </div>

                {message.is_bot && message.metadata?.actions && message.metadata.actions.length > 0 && (
                  <div className="ml-11 mt-2 flex flex-wrap gap-2">
                    {message.metadata.actions.map((action: any, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.action)}
                        className="text-xs bg-background hover:bg-muted border-border text-foreground rounded-full px-3 py-1 h-auto"
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
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4 flex-shrink-0 bg-background">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your account, tech issues, or support..."
                  disabled={isLoading || !user?.id}
                  className="rounded-2xl border-border focus:border-primary focus:ring-primary bg-background px-4 py-3 text-sm"
                />
              </div>
              <Button 
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim() || !user?.id}
                className="rounded-2xl bg-primary hover:bg-primary/90 h-12 w-12 p-0 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {!user?.id && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-xs text-destructive">
                  Please sign in to use AI chat support
                </p>
              </div>
            )}
            
            {user?.id && (
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span>Enhanced AI • Real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Session: {currentSession?.id.slice(-8)}</span>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedChatSupport;