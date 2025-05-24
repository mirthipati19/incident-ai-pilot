
import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff } from 'lucide-react';

interface CallSupportProps {
  onCallResult?: (text: string) => void;
}

const CallSupport = ({ onCallResult }: CallSupportProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showRing, setShowRing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Ready to connect');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (isConnected) {
      setShowRing(true);
      setConnectionStatus('Connected to Mouritech Support');
    } else {
      const timer = setTimeout(() => {
        setShowRing(false);
        setConnectionStatus('Ready to connect');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleStartCall = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    setIsConnected(true);
    setIsMuted(false);
    setTranscript('');
    setConnectionStatus('Connecting...');
    
    // Voice greeting
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        "Hello! You're now connected to Mouritech Support. How can I assist you today?"
      );
      speechSynthesis.speak(utterance);
    }
    
    const recognitionInstance = new (window as any).webkitSpeechRecognition();
    recognitionInstance.lang = 'en-US';
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    
    recognitionInstance.start();
    setRecognition(recognitionInstance);

    recognitionInstance.onresult = (event: any) => {
      if (isMuted) return; // Don't process if muted
      
      const current = event.resultIndex;
      const voiceText = event.results[current][0].transcript;
      setTranscript(voiceText);
      
      if (event.results[current].isFinal) {
        console.log("Call transcript:", voiceText);
        onCallResult?.(voiceText);
        
        // Generate response based on input
        setTimeout(() => {
          handleAIResponse(voiceText);
        }, 1000);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setConnectionStatus('Connection error - please try again');
      setIsConnected(false);
    };

    recognitionInstance.onend = () => {
      if (isConnected && !isMuted) {
        recognitionInstance.start(); // Keep listening during call if not muted
      }
    };

    setTimeout(() => {
      setConnectionStatus('Connected to Mouritech Support');
    }, 1500);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    
    if (recognition) {
      if (!isMuted) {
        // Muting - stop recognition
        recognition.stop();
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance("Microphone muted");
          speechSynthesis.speak(utterance);
        }
      } else {
        // Unmuting - restart recognition
        recognition.start();
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance("Microphone unmuted");
          speechSynthesis.speak(utterance);
        }
      }
    }
  };

  const handleAIResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    let response = '';

    if (lowerInput.includes('incident') || lowerInput.includes('ticket') || lowerInput.includes('issue')) {
      response = 'I understand you need to create an incident ticket. Let me help you with that. Please describe the issue you\'re experiencing.';
    } else if (lowerInput.includes('password') || lowerInput.includes('reset')) {
      response = 'I can help you reset your password. I\'ll initiate the password reset process for your account.';
    } else if (lowerInput.includes('software') || lowerInput.includes('install')) {
      response = 'I can help you install approved software. Would you like me to connect to your device to install the required applications?';
    } else if (lowerInput.includes('status') || lowerInput.includes('check')) {
      response = 'Let me check the status of your current tickets and system health for you.';
    } else {
      response = 'I understand. Let me transfer you to the appropriate support specialist who can assist you further.';
    }

    if ('speechSynthesis' in window && !isMuted) {
      const utterance = new SpeechSynthesisUtterance(response);
      speechSynthesis.speak(utterance);
    }
  };

  const handleEndCall = () => {
    setIsConnected(false);
    setIsMuted(false);
    setTranscript('');
    
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Call ended. Thank you for contacting Mouritech Support. Have a great day!"
      );
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="relative flex justify-center items-center">
        {/* Siri-like pulsing rings when connected */}
        {showRing && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-40"></div>
            <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping opacity-30" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-20" style={{ animationDelay: '0.6s' }}></div>
          </div>
        )}
        
        {/* Main gradient ring - Siri inspired */}
        <div className="relative w-48 h-48">
          <div className={`absolute inset-0 rounded-full ${isConnected ? 'animate-pulse' : ''} overflow-hidden`}>
            <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-cyan-500 opacity-90 shadow-2xl"></div>
          </div>
          
          {/* Inner circle with phone icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center shadow-xl">
              {isConnected && (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-60"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
              {isConnected ? (
                <PhoneCall className="w-12 h-12 text-cyan-400 animate-pulse" />
              ) : (
                <Phone className="w-12 h-12 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="text-center">
        <p className="text-white/90 font-medium mb-4">{connectionStatus}</p>
        
        {!isConnected ? (
          <button 
            onClick={handleStartCall}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-medium"
          >
            📞 Call Support
          </button>
        ) : (
          <div className="flex gap-4">
            {/* Mute/Unmute Button */}
            <button 
              onClick={handleMuteToggle}
              className={`${
                isMuted 
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              } text-white px-6 py-3 rounded-xl transition-all shadow-lg font-medium flex items-center gap-2`}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Unmute
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Mute
                </>
              )}
            </button>
            
            {/* End Call Button */}
            <button 
              onClick={handleEndCall}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg font-medium flex items-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </button>
          </div>
        )}
      </div>
      
      {/* Mute Status */}
      {isConnected && isMuted && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 backdrop-blur-sm rounded-lg border border-yellow-500/30">
          <MicOff className="w-4 h-4 text-yellow-300" />
          <span className="text-yellow-200 text-sm font-medium">Microphone Muted</span>
        </div>
      )}
      
      {/* Live Transcript */}
      {transcript && isConnected && !isMuted && (
        <div className="mt-4 p-4 bg-slate-800/60 backdrop-blur-sm rounded-xl max-w-md text-center border border-cyan-500/30 shadow-lg">
          <p className="text-sm text-cyan-100 font-medium">Live Transcript:</p>
          <p className="text-cyan-200 mt-2">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default CallSupport;
