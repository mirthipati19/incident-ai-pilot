
import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff } from 'lucide-react';
import Vapi from '@vapi-ai/web';

interface CallSupportProps {
  onCallResult?: (text: string) => void;
}

const CallSupport = ({ onCallResult }: CallSupportProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showRing, setShowRing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Ready to connect');
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callSession, setCallSession] = useState<{
    startTime: Date;
    endTime?: Date;
    transcript: string;
    duration: number;
  } | null>(null);

  // Updated webhook URL for Authexa
  const VAPI_API_KEY = "2474c624-2391-475a-a306-71d6c4642924";
  const ASSISTANT_ID = "8352c787-40ac-44e6-b77e-b8a903b3f2d9";

  useEffect(() => {
    // Initialize Vapi instance
    const vapiInstance = new Vapi(VAPI_API_KEY);
    setVapi(vapiInstance);

    // Set up event listeners
    vapiInstance.on('call-start', () => {
      console.log('Call started');
      const startTime = new Date();
      setIsConnected(true);
      setConnectionStatus('Connected to Authexa Support');
      setCallDuration(0);
      setCallSession({
        startTime,
        transcript: '',
        duration: 0
      });
      
      // Start call duration counter
      const durationInterval = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          setCallSession(prevSession => prevSession ? {
            ...prevSession,
            duration: newDuration
          } : null);
          return newDuration;
        });
      }, 1000);

      // Store interval to clear it later
      (vapiInstance as any).durationInterval = durationInterval;
    });

    vapiInstance.on('call-end', () => {
      console.log('Call ended');
      handleCallEnd();
    });

    vapiInstance.on('message', (message) => {
      console.log('Message received:', message);
      
      if (message.type === 'transcript') {
        console.log(`${message.role}: ${message.transcript}`);
        
        if (message.role === 'user') {
          setTranscript(message.transcript);
          setCallSession(prev => prev ? {
            ...prev,
            transcript: prev.transcript + ' ' + message.transcript
          } : null);
          onCallResult?.(message.transcript);
        }
      }
      
      // Handle other message types that might indicate issues
      if (message.type === 'function-call') {
        console.log('Function call:', message);
      }
      
      if (message.type === 'hang') {
        console.log('Call hang detected, ending call gracefully');
        handleEndCall();
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
      setConnectionStatus('Connection error - please try again');
      setIsConnected(false);
      handleCallEnd();
    });

    // Add speech events to monitor call activity
    vapiInstance.on('speech-start', () => {
      console.log('Speech started');
    });

    vapiInstance.on('speech-end', () => {
      console.log('Speech ended');
    });

    return () => {
      // Cleanup on unmount
      if ((vapiInstance as any).durationInterval) {
        clearInterval((vapiInstance as any).durationInterval);
      }
      if (vapiInstance && isConnected) {
        vapiInstance.stop();
      }
    };
  }, [onCallResult]);

  useEffect(() => {
    if (isConnected) {
      setShowRing(true);
    } else {
      const timer = setTimeout(() => {
        setShowRing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleCallEnd = () => {
    if (callSession) {
      const endTime = new Date();
      setCallSession(prev => prev ? {
        ...prev,
        endTime
      } : null);
      
      // Log session info
      console.log('Call session ended:', {
        duration: callDuration,
        transcript: callSession.transcript,
        startTime: callSession.startTime,
        endTime
      });
    }

    setIsConnected(false);
    setTranscript('');
    setConnectionStatus('Call ended');
    setCallDuration(0);
    setIsMuted(false);
    
    // Clear duration interval
    if (vapi && (vapi as any).durationInterval) {
      clearInterval((vapi as any).durationInterval);
    }
    
    setTimeout(() => {
      setConnectionStatus('Ready to connect');
    }, 2000);
  };

  const handleStartCall = async () => {
    if (!vapi) {
      console.error('Vapi not initialized');
      return;
    }

    try {
      setConnectionStatus('Connecting...');
      setTranscript('');
      
      // Request microphone permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permissions granted');
        
        // Stop the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop());
      } catch (micError) {
        console.error('Microphone access failed:', micError);
        setConnectionStatus('Microphone access required');
        return;
      }
      
      // Start the voice conversation with the assistant ID
      console.log('Starting call with assistant:', ASSISTANT_ID);
      await vapi.start(ASSISTANT_ID);
      console.log('Call start request sent successfully');
      
    } catch (error) {
      console.error('Failed to start call:', error);
      setConnectionStatus('Failed to connect - please try again');
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 3000);
    }
  };

  const handleEndCall = async () => {
    if (!vapi) return;

    try {
      console.log('Manually ending call');
      await vapi.stop();
      
      // Force immediate cleanup
      setTimeout(() => {
        handleCallEnd();
      }, 100);
      
    } catch (error) {
      console.error('Failed to end call:', error);
      // Force cleanup even if stop fails
      handleCallEnd();
    }
  };

  const handleToggleMute = async () => {
    if (!vapi || !isConnected) return;

    try {
      if (isMuted) {
        // Unmute by starting microphone again
        await vapi.setMuted(false);
        setIsMuted(false);
        console.log('Microphone unmuted');
      } else {
        // Mute microphone
        await vapi.setMuted(true);
        setIsMuted(true);
        console.log('Microphone muted');
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      
      {/* Connection Status with Duration */}
      <div className="text-center">
        <p className="text-white/90 font-medium mb-2">{connectionStatus}</p>
        
        {isConnected && (
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-200 text-sm font-medium">
                Live • {formatDuration(callDuration)}
              </span>
            </div>
            {isMuted && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded-full border border-red-500/30">
                <MicOff className="w-3 h-3 text-red-400" />
                <span className="text-red-200 text-xs">Muted</span>
              </div>
            )}
          </div>
        )}
        
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
              onClick={handleToggleMute}
              className={`${
                isMuted 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
              } text-white px-6 py-3 rounded-xl transition-all shadow-lg font-medium flex items-center gap-2`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? 'Unmute' : 'Mute'}
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
      
      {/* Live Transcript */}
      {transcript && isConnected && (
        <div className="mt-4 p-4 bg-slate-800/60 backdrop-blur-sm rounded-xl max-w-md text-center border border-cyan-500/30 shadow-lg">
          <p className="text-sm text-cyan-100 font-medium">Live Transcript:</p>
          <p className="text-cyan-200 mt-2">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default CallSupport;
