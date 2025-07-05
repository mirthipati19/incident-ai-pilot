
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X, Trash2 } from 'lucide-react';
import { persistentChatService, ChatMessage } from '@/services/persistentChatService';

interface PersistentChatSupportProps {
  onClose: () => void;
  onMessageSent?: (message: string) => void;
}

const PersistentChatSupport: React.FC<PersistentChatSupportProps> = ({ onClose, onMessageSent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages
    setMessages(persistentChatService.getMessages());

    // Subscribe to message updates
    const unsubscribe = persistentChatService.subscribe((updatedMessages) => {
      setMessages(updatedMessages);
    });

    return unsubscribe;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      // Add user message
      persistentChatService.addMessage(inputValue, false);
      
      // Call the callback if provided
      if (onMessageSent) {
        onMessageSent(inputValue);
      }

      setInputValue('');

      // Simulate bot response after a delay
      setTimeout(() => {
        const responses = [
          `I understand you're experiencing: "${inputValue}". Let me help you with that.`,
          "I'm analyzing your request and will provide assistance shortly.",
          "Thank you for reaching out. I'm creating a support ticket for this issue.",
          "I'll help you resolve this. Let me gather some information first."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        persistentChatService.addMessage(randomResponse, true);
      }, 1000 + Math.random() * 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClearChat = () => {
    persistentChatService.clearMessages();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-slate-800 rounded-2xl w-full max-w-md h-[600px] flex flex-col border border-white/20">
        <div className="flex items-center justify-between p-4">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={handleClearChat}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Header */}
        <div className="bg-slate-800 text-white px-4 pb-4 flex items-center gap-2">
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

export default PersistentChatSupport;
