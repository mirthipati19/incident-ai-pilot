
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';
import PersistentChatSupport from '@/components/Assistant/PersistentChatSupport';
import FloatingVoiceController from './FloatingVoiceController';

const ITSMVoiceController: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
  };

  const handleVoiceClose = () => {
    setIsVoiceActive(false);
  };

  const handleChatMessageSent = (message: string) => {
    console.log('Message sent to chat:', message);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col space-y-4 z-40">
        {/* Chat Button */}
        <Button
          onClick={() => setShowChat(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center group"
          title="Open Chat Support"
        >
          <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </Button>

        {/* Voice Call Button */}
        <Button
          onClick={handleVoiceToggle}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center group transition-all ${
            isVoiceActive 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          title={isVoiceActive ? "End Voice Call" : "Start Voice Call"}
        >
          <Phone className={`w-6 h-6 text-white group-hover:scale-110 transition-transform ${
            isVoiceActive ? 'animate-bounce' : ''
          }`} />
        </Button>
      </div>

      {/* Persistent Chat Modal */}
      {showChat && (
        <PersistentChatSupport
          onClose={() => setShowChat(false)}
          onMessageSent={handleChatMessageSent}
        />
      )}

      {/* Floating Voice Controller */}
      <FloatingVoiceController
        isActive={isVoiceActive}
        onToggle={handleVoiceToggle}
        onClose={handleVoiceClose}
      />
    </>
  );
};

export default ITSMVoiceController;
