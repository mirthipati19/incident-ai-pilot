
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isTicketCreated?: boolean;
}

interface ChatSupportProps {
  onMessageSent?: (message: string) => void;
}

const ChatSupport = ({ onMessageSent }: ChatSupportProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Mouritech support assistant. Describe any issues you\'re experiencing and I\'ll automatically create and manage tickets for you.',
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'broken', 'help', 'trouble', 'cant', "can't", 'unable', 'need'];
    const containsProblemKeyword = problemKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (containsProblemKeyword && userMessage.length > 10) {
      const ticketId = Date.now().toString();
      return `I've automatically created incident ticket #${ticketId} for your issue. I'm analyzing: "${userMessage}" and will provide a solution shortly. You can track this ticket in the Incidents tab.`;
    } else if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
      return 'I can help you reset your password. I\'ll initiate the password reset process for your account and create a ticket to track this request.';
    } else if (lowerMessage.includes('software') || lowerMessage.includes('install')) {
      return 'I can assist with software installation and configuration. What software do you need help with? I\'ll create a ticket and can connect to your device if needed.';
    } else if (lowerMessage.includes('status') || lowerMessage.includes('check')) {
      return 'I can help you check the status of your existing tickets or incidents. Do you have a ticket number you\'d like me to look up?';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m here to assist you with any IT support needs. Just describe your problem and I\'ll automatically create and manage tickets for you.';
    } else {
      return 'I understand. Please provide more details about your issue so I can create an appropriate support ticket and help resolve your problem.';
    }
  };

  const typeMessage = (text: string, messageId: string, isTicketMessage = false) => {
    let index = 0;
    const interval = setInterval(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: text.slice(0, index + 1), isTicketCreated: isTicketMessage }
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

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(inputMessage);

    // Check if this is a problem description for ticket creation
    const lowerMessage = inputMessage.toLowerCase();
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'broken', 'help', 'trouble', 'cant', "can't", 'unable', 'need'];
    const containsProblemKeyword = problemKeywords.some(keyword => lowerMessage.includes(keyword));
    const isTicketMessage = containsProblemKeyword && inputMessage.length > 10;

    // Generate bot response
    const botResponseText = generateBotResponse(inputMessage);
    const botMessageId = (Date.now() + 1).toString();
    
    const botMessage: Message = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isTicketCreated: isTicketMessage
    };

    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
      typeMessage(botResponseText, botMessageId, isTicketMessage);
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
                  : 'bg-slate-800/90 text-white border border-slate-600/50 mr-4'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.sender === 'bot' && (
                  message.isTicketCreated ? (
                    <AlertCircle className="w-4 h-4 mt-1 text-green-300 flex-shrink-0" />
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
            placeholder="Describe your issue and I'll create a ticket..."
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
