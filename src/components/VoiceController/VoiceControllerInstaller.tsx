
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Settings } from 'lucide-react';
import PersistentChatSupport from '@/components/Assistant/PersistentChatSupport';
import CallSupport from '@/components/Assistant/CallSupport';
import ConnectPermissionPrompt from '@/components/Assistant/ConnectPermissionPrompt';

const VoiceControllerInstaller: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showInstaller, setShowInstaller] = useState(false);

  const handleChatMessageSent = (message: string) => {
    console.log('Message sent to chat:', message);
  };

  const handleCallResult = (text: string) => {
    console.log('Call result:', text);
  };

  const handlePermissionApproval = (approved: boolean) => {
    console.log('Permission approval:', approved);
    if (approved) {
      setShowInstaller(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col space-y-4 z-40">
        {/* Voice Installer Button */}
        <Button
          onClick={() => setShowInstaller(true)}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg flex items-center justify-center group"
          title="Voice Controller Installer"
        >
          <Settings className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </Button>

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
          onClick={() => setShowCall(true)}
          className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg flex items-center justify-center group"
          title="Start Voice Call"
        >
          <Phone className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </Button>
      </div>

      {/* Voice Controller Installer Modal */}
      {showInstaller && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative">
            <Button
              onClick={() => setShowInstaller(false)}
              variant="ghost"
              className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-10"
            >
              ✕
            </Button>
            <ConnectPermissionPrompt onApproval={handlePermissionApproval} />
          </div>
        </div>
      )}

      {/* Persistent Chat Modal */}
      {showChat && (
        <PersistentChatSupport
          onClose={() => setShowChat(false)}
          onMessageSent={handleChatMessageSent}
        />
      )}

      {/* Call Support Modal */}
      {showCall && (
        <CallSupport
          onClose={() => setShowCall(false)}
          onCallResult={handleCallResult}
        />
      )}
    </>
  );
};

export default VoiceControllerInstaller;
