
import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff } from 'lucide-react';
import Vapi from '@vapi-ai/web';

interface CallSupportProps {
  onCallResult?: (text: string) => void;
}

const CallSupport = ({ onCallResult }: CallSupportProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showRing, setShowRing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Ready to connect');
  const [vapi, setVapi] = useState<Vapi | null>(null);

  useEffect(() => {
    // Initialize Vapi instance
    const vapiInstance = new Vapi('2474c624-2391-475a-a306-71d6c4642924');
    setVapi(vapiInstance);

    // Set up event listeners
    vapiInstance.on('call-start', () => {
      console.log('Vapi call started');
      setIsConnected(true);
      setConnectionStatus('Connected to Mouritech Support');
    });

    vapiInstance.on('call-end', () => {
      console.log('Vapi call ended');
      setIsConnected(false);
      setIsMuted(false);
      setTranscript('');
      setConnectionStatus('Call ended');
      
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 2000);
    });

    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        console.log(`${message.role}: ${message.transcript}`);
        
        if (message.role === 'user') {
          setTranscript(message.transcript);
          onCallResult?.(message.transcript);
        }
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
      setConnectionStatus('Connection error - please try again');
      setIsConnected(false);
    });

    return () => {
      // Cleanup on unmount
      if (vapiInstance) {
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
      
      // Start the voice conversation with the assistant ID
      await vapi.start('8352c787-40ac-44e6-b77e-b8a903b3f2d9');
      
    } catch (error) {
      console.error('Failed to start Vapi call:', error);
      setConnectionStatus('Failed to connect - please try again');
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 3000);
    }
  };

  const handleMuteToggle = () => {
    if (!vapi || !isConnected) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    try {
      // Use Vapi's mute functionality
      vapi.setMuted(newMutedState);
      
      if (newMutedState) {
        setConnectionStatus('Microphone muted');
      } else {
        setConnectionStatus('Connected to Mouritech Support');
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleEndCall = async () => {
    if (!vapi) return;

    try {
      await vapi.stop();
      setIsConnected(false);
      setIsMuted(false);
      setTranscript('');
      setConnectionStatus('Call ended');
      
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 2000);
    } catch (error) {
      console.error('Failed to end call:', error);
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
