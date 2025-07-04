
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatContextType {
  messages: Message[];
  addMessage: (text: string, isBot: boolean) => void;
  clearMessages: () => void;
  isCallActive: boolean;
  callDuration: number;
  startCall: () => void;
  endCall: () => void;
  isCallMinimized: boolean;
  toggleCallMinimized: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your Authexa support assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [callInterval, setCallInterval] = useState<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((text: string, isBot: boolean) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      isBot,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your Authexa support assistant. How can I help you today?",
        isBot: true,
        timestamp: new Date()
      }
    ]);
  }, []);

  const startCall = useCallback(() => {
    setIsCallActive(true);
    setCallDuration(0);
    setIsCallMinimized(false);
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    setCallInterval(interval);
  }, []);

  const endCall = useCallback(() => {
    setIsCallActive(false);
    setCallDuration(0);
    setIsCallMinimized(false);
    
    if (callInterval) {
      clearInterval(callInterval);
      setCallInterval(null);
    }
  }, [callInterval]);

  const toggleCallMinimized = useCallback(() => {
    setIsCallMinimized(prev => !prev);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      addMessage,
      clearMessages,
      isCallActive,
      callDuration,
      startCall,
      endCall,
      isCallMinimized,
      toggleCallMinimized,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
