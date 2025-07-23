import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: string;
  metadata: any;
  created_at: string;
}

interface VisionAssistChatProps {
  sessionId: string;
}

export const VisionAssistChat = ({ sessionId }: VisionAssistChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time message updates
    const channel = supabase
      .channel(`vision-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vision_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      // Fix the type issue by ensuring role is properly typed
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant' | 'system'
      }));
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isProcessing) return;

    const messageText = newMessage;
    setNewMessage('');
    setIsProcessing(true);

    try {
      // Add user message to database
      const { error: messageError } = await supabase
        .from('vision_chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: messageText,
          message_type: 'text'
        });

      if (messageError) throw messageError;

      // Add processing indicator
      setMessages(prev => [...prev, {
        id: 'processing',
        role: 'assistant',
        content: 'AI is analyzing your request...',
        message_type: 'processing',
        metadata: {},
        created_at: new Date().toISOString()
      }]);

      toast({
        title: "Message Sent",
        description: "VisionAssist is processing your request",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (role: string, messageType: string) => {
    if (role === 'user') return <User className="w-4 h-4" />;
    if (messageType === 'instruction') return <Eye className="w-4 h-4" />;
    if (messageType === 'processing') return <AlertCircle className="w-4 h-4 animate-spin" />;
    return <Bot className="w-4 h-4" />;
  };

  const getMessageBadge = (messageType: string, metadata: any) => {
    if (messageType === 'instruction') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Eye className="w-3 h-3 mr-1" />
          Step {metadata?.step || '?'}
        </Badge>
      );
    }
    if (messageType === 'processing') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Processing...
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">VisionAssist Chat</h3>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {getMessageIcon(message.role, message.message_type)}
            </div>
            
            <div className={`flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${
              message.role === 'user' ? 'text-right' : ''
            }`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.message_type === 'instruction'
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  {getMessageBadge(message.message_type, message.metadata)}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.metadata?.analysis?.confidence && (
                  <div className="mt-2 text-xs opacity-75">
                    Confidence: {Math.round(message.metadata.analysis.confidence * 100)}%
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formatTimestamp(message.created_at)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-slate-50 dark:bg-slate-800">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask VisionAssist for help or clarification..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isProcessing}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Ask questions, request clarification, or describe what you see on your screen.
        </p>
      </div>
    </Card>
  );
};