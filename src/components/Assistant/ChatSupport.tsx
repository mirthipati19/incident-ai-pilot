
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatSupportProps {
  onClose: () => void;
  onMessageSent?: (message: string) => void;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ onClose, onMessageSent }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your Authexa support assistant. Describe any issues you're experiencing and I'll help you resolve them.",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: inputValue,
        isBot: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      
      // Call the callback if provided
      if (onMessageSent) {
        onMessageSent(inputValue);
      }

      setInputValue('');

      // Simulate bot response
      setTimeout(() => {
        const botResponse: Message = {
          id: messages.length + 2,
          text: `I understand you're experiencing: "${inputValue}". I'm analyzing this issue and will create a support ticket for you right away.`,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSupport;
