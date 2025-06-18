import React, { useState, useEffect } from 'react';
import { PhoneCall } from 'lucide-react';

interface VoiceAssistantProps {
  onVoiceResult?: (text: string) => void;
}

const VoiceAssistant = ({ onVoiceResult }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showRing, setShowRing] = useState(false);

  useEffect(() => {
    if (isListening) {
      setShowRing(true);
    } else {
      // Keep the ring visible for a moment after listening stops
      const timer = setTimeout(() => {
        setShowRing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    setIsListening(true);
    setTranscript('');
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.start();

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const voiceText = event.results[current][0].transcript;
      setTranscript(voiceText);
      
      if (event.results[current].isFinal) {
        console.log("Recognized:", voiceText);
        onVoiceResult?.(voiceText);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="relative flex justify-center items-center">
        {/* Siri-like pulsing ring */}
        {showRing && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-300 animate-ping opacity-30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
          </div>
        )}
        
        {/* Main gradient ring - inspired by Siri */}
        <div className="relative w-40 h-40">
          <div className={`absolute inset-0 rounded-full ${isListening ? 'animate-pulse' : ''} overflow-hidden`}>
            <div className="w-full h-full bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 opacity-80"></div>
          </div>
          
          {/* Inner circle with hole */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center">
              {isListening && (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50"></div>
                </div>
              )}
              <PhoneCall className={`w-10 h-10 ${isListening ? 'text-cyan-400 animate-pulse' : 'text-white'}`} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        {isListening ? (
          <button 
            onClick={stopListening}
            className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
          >
            End Call
          </button>
        ) : (
          <button 
            onClick={handleVoice}
            className="bg-cyan-500 text-white px-6 py-2 rounded-xl hover:bg-cyan-600 transition-colors"
          >
            Call Assistant
          </button>
        )}
      </div>
      
      {transcript && (
        <div className="mt-4 p-3 bg-slate-800/50 backdrop-blur-sm rounded-lg max-w-md text-center border border-cyan-500/30">
          <p className="text-sm text-cyan-100">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
