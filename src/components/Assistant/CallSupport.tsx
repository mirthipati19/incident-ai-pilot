
import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff } from 'lucide-react';
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

  // Your API credentials
  const VAPI_API_KEY = "2474c624-2391-475a-a306-71d6c4642924";
  const ASSISTANT_ID = "8352c787-40ac-44e6-b77e-b8a903b3f2d9";

  useEffect(() => {
    // Initialize Vapi instance
    const vapiInstance = new Vapi(VAPI_API_KEY);
    setVapi(vapiInstance);

    // Set up event listeners
    vapiInstance.on('call-start', () => {
      console.log('Call started');
      setIsConnected(true);
      setConnectionStatus('Connected to Mouritech Support');
      setCallDuration(0);
      
      // Start call duration counter
      const durationInterval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Store interval to clear it later
      (vapiInstance as any).durationInterval = durationInterval;
    });

    vapiInstance.on('call-end', () => {
      console.log('Call ended');
      setIsConnected(false);
      setTranscript('');
      setConnectionStatus('Call ended');
      setCallDuration(0);
      
      // Clear duration interval
      if ((vapiInstance as any).durationInterval) {
        clearInterval((vapiInstance as any).durationInterval);
      }
      
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 2000);
    });

    vapiInstance.on('message', (message) => {
      console.log('Message received:', message);
      
      if (message.type === 'transcript') {
        console.log(`${message.role}: ${message.transcript}`);
        
        if (message.role === 'user') {
          setTranscript(message.transcript);
          onCallResult?.(message.transcript);
        }
      }
      
      // Handle other message types that might indicate issues
      if (message.type === 'function-call') {
        console.log('Function call:', message);
      }
      
      if (message.type === 'hang') {
        console.log('Call hang detected, but keeping connection alive');
        // Don't automatically end the call on hang
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
      setConnectionStatus('Connection error - please try again');
      setIsConnected(false);
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
      setIsConnected(false);
      setTranscript('');
      setConnectionStatus('Call ended');
      
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 2000);
    } catch (error) {
      console.error('Failed to end call:', error);
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
