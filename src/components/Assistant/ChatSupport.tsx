
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

interface ChatSupportProps {
  onMessageSent?: (message: string) => void;
}

const ChatSupport = ({ onMessageSent }: ChatSupportProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Mouritech support assistant. How can I help you today?',
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
    
    if (lowerMessage.includes('incident') || lowerMessage.includes('ticket')) {
      return 'I can help you create a new incident ticket. Please provide details about the issue you\'re experiencing.';
    } else if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
      return 'For password reset requests, I can guide you through the process. Would you like me to send a password reset link to your registered email?';
    } else if (lowerMessage.includes('status') || lowerMessage.includes('check')) {
      return 'I can help you check the status of your existing tickets or incidents. Do you have a ticket number you\'d like me to look up?';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m here to assist you with any IT support needs. What can I help you with today?';
    } else {
      return 'I understand you need assistance. Could you please provide more details about your issue so I can better help you?';
    }
  };

  const typeMessage = (text: string, messageId: string) => {
    let index = 0;
    const interval = setInterval(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: text.slice(0, index + 1) }
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

    // Generate bot response
    const botResponseText = generateBotResponse(inputMessage);
    const botMessageId = (Date.now() + 1).toString();
    
    const botMessage: Message = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date().toISOString()
    };

    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
      typeMessage(botResponseText, botMessageId);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-white/20 bg-white/5 rounded-t-lg">
        <Bot className="w-6 h-6 text-blue-300 mr-2" />
        <h3 className="font-semibold text-white">Mouritech Support Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500/80 text-white'
                  : 'bg-white/20 text-white border border-white/30'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.sender === 'bot' && (
                  <Bot className="w-4 h-4 mt-1 text-blue-300 flex-shrink-0" />
                )}
                {message.sender === 'user' && (
                  <User className="w-4 h-4 mt-1 text-white flex-shrink-0" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/20 text-white border border-white/30 px-4 py-2 rounded-lg max-w-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-300" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/20 bg-white/5 rounded-b-lg">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[40px] max-h-32 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:ring-blue-300/50"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-500/80 hover:bg-blue-600/80 text-white border-none"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
