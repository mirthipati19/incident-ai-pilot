import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Clock, 
  User, 
  Headphones, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Timer,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RemoteSessionChatProps {
  sessionId: string;
  userType: 'support_engineer' | 'target_user';
  sessionStatus: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'support_engineer' | 'target_user' | 'system';
  message_content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  metadata: any;
}

interface QuickResponse {
  id: string;
  title: string;
  content: string;
  category: string;
}

export const RemoteSessionChat = ({ sessionId, userType, sessionStatus }: RemoteSessionChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lastResponseTime, setLastResponseTime] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    loadQuickResponses();
    startSessionTimer();

    // Subscribe to real-time message updates
    const channel = supabase
      .channel(`remote-session-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remote_session_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
          
          // Update unread count if message is from other user
          if (newMsg.sender_type !== userType && !newMsg.is_read) {
            setUnreadCount(prev => prev + 1);
          }

          // Track response times
          if (newMsg.sender_type !== 'system') {
            setLastResponseTime(new Date());
            recordTimingEvent(
              newMsg.sender_type === 'support_engineer' ? 'engineer_response' : 'user_response'
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sessionId, userType]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('remote_session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      // Type assertion to fix the sender_type compatibility
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'support_engineer' | 'target_user' | 'system'
      }));
      setMessages(typedMessages);
      
      // Count unread messages from other users
      const unread = typedMessages.filter(msg => 
        msg.sender_type !== userType && !msg.is_read
      ).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  const loadQuickResponses = async () => {
    if (userType !== 'support_engineer') return;

    try {
      const { data, error } = await supabase
        .from('quick_response_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setQuickResponses(data || []);
    } catch (error) {
      console.error('Error loading quick responses:', error);
    }
  };

  const sendMessage = async (content: string, messageType: string = 'text') => {
    if (!content.trim()) return;

    try {
      const { error } = await supabase
        .from('remote_session_messages')
        .insert({
          session_id: sessionId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          sender_type: userType,
          message_content: content,
          message_type: messageType
        });

      if (error) throw error;

      setNewMessage('');
      setShowQuickResponses(false);

      // Record timing event
      await recordTimingEvent(
        userType === 'support_engineer' ? 'engineer_response' : 'user_response'
      );

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const recordTimingEvent = async (eventType: string) => {
    try {
      const now = new Date();
      const responseTime = lastResponseTime 
        ? Math.floor((now.getTime() - lastResponseTime.getTime()) / 1000)
        : null;

      await supabase
        .from('remote_session_timing')
        .insert({
          session_id: sessionId,
          event_type: eventType,
          response_time_seconds: responseTime,
          total_session_duration_seconds: sessionDuration,
          triggered_by: (await supabase.auth.getUser()).data.user?.id
        });
    } catch (error) {
      console.error('Error recording timing event:', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const unreadMessageIds = messages
        .filter(msg => msg.sender_type !== userType && !msg.is_read)
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('remote_session_messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds);

        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const startSessionTimer = () => {
    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageIcon = (senderType: string, messageType: string) => {
    if (messageType === 'system_notification') return <AlertTriangle className="w-4 h-4" />;
    if (messageType === 'quick_response') return <Zap className="w-4 h-4" />;
    if (senderType === 'support_engineer') return <Headphones className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  const sendQuickResponse = (template: QuickResponse) => {
    sendMessage(template.content, 'quick_response');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const isSessionActive = sessionStatus === 'active' || sessionStatus === 'in_progress';

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold">Remote Session Chat</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {userType === 'support_engineer' ? 'Supporting User' : 'Support Engineer'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Timer className="w-3 h-3 mr-1" />
              {formatDuration(sessionDuration)}
            </Badge>
            {isSessionActive && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {unreadCount} New
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.sender_type === userType ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.sender_type === userType
                ? 'bg-blue-600 text-white'
                : message.sender_type === 'system'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {getMessageIcon(message.sender_type, message.message_type)}
            </div>
            
            <div className={`flex-1 max-w-sm ${
              message.sender_type === userType ? 'text-right' : ''
            }`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.sender_type === userType
                  ? 'bg-blue-600 text-white'
                  : message.sender_type === 'system'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : message.message_type === 'quick_response'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}>
                {message.message_type === 'quick_response' && (
                  <div className="flex items-center space-x-1 mb-1">
                    <Zap className="w-3 h-3" />
                    <span className="text-xs font-medium">Quick Response</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.message_content}</p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {new Date(message.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {!message.is_read && message.sender_type === userType && (
                  <span className="ml-2 text-blue-600">●</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Responses (Support Engineer Only) */}
      {userType === 'support_engineer' && showQuickResponses && (
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-800">
          <h4 className="text-sm font-medium mb-2">Quick Responses</h4>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {quickResponses.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => sendQuickResponse(template)}
                className="text-left justify-start h-auto p-2"
              >
                <div>
                  <div className="font-medium text-xs">{template.title}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {template.content.substring(0, 40)}...
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-slate-50 dark:bg-slate-800">
        {isSessionActive ? (
          <>
            <div className="flex space-x-2 mb-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Type your message...${userType === 'support_engineer' ? ' (Enter to send, Shift+Enter for new line)' : ''}`}
                className="flex-1 min-h-[40px] max-h-24"
                rows={2}
              />
              <Button 
                onClick={() => sendMessage(newMessage)}
                disabled={!newMessage.trim()}
                size="sm"
                className="px-3 self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {userType === 'support_engineer' && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickResponses(!showQuickResponses)}
                  className="flex items-center space-x-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Quick Responses</span>
                </Button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Press Enter to send, Shift+Enter for new line
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Session is {sessionStatus}. Chat is disabled.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};