
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

    if (lowerInput.includes('incident') || lowerInput.includes('ticket') || lowerInput.includes('issue') || lowerInput.includes('problem')) {
      response = 'I understand you need help with an issue. I\'ve automatically created an incident ticket for you. Let me help you resolve this problem step by step.';
    } else if (lowerInput.includes('password') || lowerInput.includes('reset')) {
      response = 'I can help you reset your password. I\'ll guide you through the password reset process. First, go to the login page and click "Forgot Password". Then check your email for reset instructions.';
    } else if (lowerInput.includes('software') || lowerInput.includes('install')) {
      response = 'I can help you install approved software. I\'ve created a ticket to track this request. Would you like me to connect to your device to install the required applications remotely?';
    } else if (lowerInput.includes('network') || lowerInput.includes('internet') || lowerInput.includes('connection')) {
      response = 'I see you\'re having network connectivity issues. Let me help you troubleshoot this. First, try restarting your network adapter. I\'ve created a ticket to track this issue.';
    } else if (lowerInput.includes('status') || lowerInput.includes('check')) {
      response = 'Let me check the status of your current tickets and system health for you. I can see your open incidents and provide updates on their progress.';
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      response = 'Hello! I\'m your Mouritech AI support assistant. I can help you with technical issues, create tickets automatically, and guide you through solutions. What problem can I help you solve today?';
    } else {
      response = 'I understand your concern. I\'ve created a support ticket to track this issue. Let me connect you with the appropriate specialist who can provide detailed assistance for your specific problem.';
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
        "Call ended. Thank you for contacting Mouritech Support. Your tickets have been created and our team will follow up. Have a great day!"
      );
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="relative flex justify-center items-center">
        {/* Pulsing rings when connected */}
        {showRing && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-40"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-30" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-20" style={{ animationDelay: '0.6s' }}></div>
          </div>
        )}
        
        {/* Main gradient ring */}
        <div className="relative w-32 h-32">
          <div className={`absolute inset-0 rounded-full ${isConnected ? 'animate-pulse' : ''} overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg`}>
          </div>
          
          {/* Inner circle with phone icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md">
              {isConnected && (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-60"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-40" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
              {isConnected ? (
                <PhoneCall className="w-8 h-8 text-blue-600 animate-pulse" />
              ) : (
                <Phone className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="text-center">
        <p className="text-gray-700 font-medium mb-4">{connectionStatus}</p>
        
        {!isConnected ? (
          <button 
            onClick={handleStartCall}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-md font-medium"
          >
            📞 Call Support
          </button>
        ) : (
          <div className="flex gap-3">
            {/* Mute/Unmute Button */}
            <button 
              onClick={handleMuteToggle}
              className={`${
                isMuted 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white px-4 py-2 rounded-lg transition-colors shadow-md font-medium flex items-center gap-2`}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Unmute
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Mute
                </>
              )}
            </button>
            
            {/* End Call Button */}
            <button 
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md font-medium flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          </div>
        )}
      </div>
      
      {/* Mute Status */}
      {isConnected && isMuted && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 rounded-lg border border-yellow-300">
          <MicOff className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700 text-sm font-medium">Microphone Muted</span>
        </div>
      )}
      
      {/* Live Transcript */}
      {transcript && isConnected && !isMuted && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg max-w-md text-center border border-gray-300">
          <p className="text-sm text-gray-600 font-medium">Live Transcript:</p>
          <p className="text-gray-800 mt-2">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default CallSupport;
