import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isTicketCreated?: boolean;
  isTicketClosed?: boolean;
  ticketId?: string;
}

interface ChatSupportProps {
  onMessageSent?: (message: string) => void;
  onTicketCreated?: (ticketId: string, message: string) => void;
  onTicketResolved?: (ticketId: string) => void;
}

const ChatSupport = ({ onMessageSent, onTicketCreated, onTicketResolved }: ChatSupportProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Mouritech support assistant. Describe any issues you\'re experiencing and I\'ll help you resolve them.',
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTickets, setActiveTickets] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useImprovedAuth();

  // Your webhook URL
  const WEBHOOK_URL = "http://localhost:5678/webhook-test/64d38da4-3add-46d8-a8d2-88eea11f29b6";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendToWebhook = async (userMessage: string): Promise<string> => {
    try {
      console.log('Sending message to webhook:', userMessage);
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          timestamp: new Date().toISOString(),
          user_id: user?.user_id || user?.id || 'anonymous',
          session_id: Date.now().toString(),
          user_email: user?.email || null,
          user_name: user?.name || null
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Full webhook response:', data);
      
      // Handle different possible response structures from n8n
      let botResponse = '';
      if (typeof data === 'string') {
        botResponse = data;
      } else if (data.response) {
        botResponse = data.response;
      } else if (data.message) {
        botResponse = data.message;
      } else if (data.text) {
        botResponse = data.text;
      } else if (data.output) {
        botResponse = data.output;
      } else if (data.result) {
        botResponse = data.result;
      } else if (Array.isArray(data) && data.length > 0) {
        botResponse = data[0].response || data[0].message || data[0].text || JSON.stringify(data[0]);
      } else {
        console.log('Unexpected response structure:', data);
        botResponse = 'I received your message and I\'m processing it.';
      }
      
      return botResponse || 'I received your message and I\'m processing it.';
      
    } catch (error) {
      console.error('Detailed webhook error:', error);
      return 'I\'m having trouble connecting to the support system right now. Please try again in a moment.';
    }
  };

  const checkForTicketKeywords = (message: string): { shouldCreateTicket: boolean, ticketId?: string } => {
    const lowerMessage = message.toLowerCase();
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'broken', 'help', 'trouble', 'cant', "can't", 'unable', 'need'];
    const containsProblemKeyword = problemKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (containsProblemKeyword && message.length > 10) {
      const ticketId = Date.now().toString();
      setActiveTickets(prev => new Set(prev).add(ticketId));
      onTicketCreated?.(ticketId, message);
      return { shouldCreateTicket: true, ticketId };
    }
    
    return { shouldCreateTicket: false };
  };

  const checkForResolutionKeywords = (message: string): 'resolved' | 'escalated' | 'none' => {
    const lowerMessage = message.toLowerCase();
    const resolvedKeywords = ['thank you', 'thanks', 'resolved', 'fixed', 'solved', 'working now', 'all good', 'perfect'];
    const escalatedKeywords = ['escalate', 'escalated', 'manager', 'supervisor', 'higher level'];
    
    if (resolvedKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'resolved';
    }
    if (escalatedKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'escalated';
    }
    return 'none';
  };

  const typeMessage = (text: string, messageId: string, isTicketMessage = false, ticketId?: string, isResolved = false) => {
    let index = 0;
    const interval = setInterval(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                text: text.slice(0, index + 1), 
                isTicketCreated: isTicketMessage,
                isTicketClosed: isResolved,
                ticketId: ticketId
              }
            : msg
        )
      );
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(inputMessage);

    // Check for resolution keywords
    const resolutionStatus = checkForResolutionKeywords(inputMessage);
    
    // Check if we should create a ticket
    const { shouldCreateTicket, ticketId } = checkForTicketKeywords(inputMessage);

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isTicketCreated: shouldCreateTicket,
      isTicketClosed: resolutionStatus === 'resolved',
      ticketId: ticketId
    };

    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Add empty bot message first
    setTimeout(async () => {
      setMessages(prev => [...prev, botMessage]);
      
      // Get response from webhook
      const webhookResponse = await sendToWebhook(currentInput);
      
      // Handle different resolution statuses
      let finalResponse = webhookResponse;
      
      if (resolutionStatus === 'resolved') {
        finalResponse = `Great! I'm glad your issue has been resolved. ${webhookResponse} I'll mark any related tickets as resolved.`;
        // Notify parent component about ticket resolution
        if (activeTickets.size > 0) {
          activeTickets.forEach(id => onTicketResolved?.(id));
          setActiveTickets(new Set());
        }
      } else if (resolutionStatus === 'escalated') {
        finalResponse = `I understand you'd like to escalate this issue. ${webhookResponse} I'll mark this ticket for escalation to our senior support team.`;
      } else if (shouldCreateTicket && ticketId) {
        finalResponse = `I've created ticket #${ticketId} for your issue. ${webhookResponse}`;
      }
      
      // Type the response
      typeMessage(finalResponse, botMessageId, shouldCreateTicket, ticketId, resolutionStatus === 'resolved');
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-slate-700/50 bg-slate-800/80 rounded-t-xl">
        <Bot className="w-6 h-6 text-white mr-3" />
        <h3 className="font-bold text-white text-lg">Mouritech Support Chat</h3>
        <div className="ml-auto">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600/90 text-white ml-4 border border-blue-500/50'
                  : message.isTicketCreated
                  ? 'bg-green-800/90 text-white border border-green-500/50 mr-4'
                  : message.isTicketClosed
                  ? 'bg-purple-800/90 text-white border border-purple-500/50 mr-4'
                  : 'bg-slate-800/90 text-white border border-slate-600/50 mr-4'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.sender === 'bot' && (
                  message.isTicketCreated ? (
                    <AlertCircle className="w-4 h-4 mt-1 text-green-300 flex-shrink-0" />
                  ) : message.isTicketClosed ? (
                    <CheckCircle className="w-4 h-4 mt-1 text-purple-300 flex-shrink-0" />
                  ) : (
                    <Bot className="w-4 h-4 mt-1 text-white flex-shrink-0" />
                  )
                )}
                {message.sender === 'user' && (
                  <User className="w-4 h-4 mt-1 text-white flex-shrink-0" />
                )}
                <p className="text-sm font-medium text-white">{message.text}</p>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800/90 text-white border border-slate-600/50 px-4 py-3 rounded-xl max-w-xs mr-4 shadow-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-white" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/80 rounded-b-xl">
        <div className="flex gap-3">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your issue and I'll help you resolve it..."
            className="flex-1 min-h-[45px] max-h-32 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/70 focus:ring-blue-500/50 focus:border-blue-500/50 rounded-lg font-medium"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600/90 hover:bg-blue-700/90 text-white border-none px-4 py-2 rounded-lg shadow-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
