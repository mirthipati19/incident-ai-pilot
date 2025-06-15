import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, AlertCircle } from 'lucide-react';
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
  const [callDuration, setCallDuration] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Refs for intervals
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLogs(prev => [...prev.slice(-9), logMessage]); // Keep last 10 logs
  };

  useEffect(() => {
    // Initialize Vapi instance
    const vapiInstance = new Vapi('2474c624-2391-475a-a306-71d6c4642924');
    setVapi(vapiInstance);
    addDebugLog('Vapi instance initialized');

    // Set up event listeners
    vapiInstance.on('call-start', () => {
      addDebugLog('Vapi call started - connection established');
      setIsConnected(true);
      setConnectionStatus('Connected to Mouritech Support');
      setCallDuration(0);
      setLastActivity(new Date());
      
      // Start call duration counter
      durationInterval.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Start keep-alive mechanism - send periodic activity
      keepAliveInterval.current = setInterval(() => {
        if (vapiInstance && vapiInstance.isMuted !== undefined) {
          addDebugLog('Keep-alive: Checking connection status');
          // Small activity to prevent timeout - just check mute status
          const currentMuted = vapiInstance.isMuted;
          setLastActivity(new Date());
        }
      }, 10000); // Every 10 seconds
    });

    vapiInstance.on('call-end', () => {
      addDebugLog('Vapi call ended - cleaning up');
      setIsConnected(false);
      setIsMuted(false);
      setTranscript('');
      setConnectionStatus('Call ended');
      setCallDuration(0);
      
      // Clear intervals
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
        keepAliveInterval.current = null;
      }
      
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 2000);
    });

    vapiInstance.on('message', (message) => {
      setLastActivity(new Date());
      
      if (message.type === 'transcript') {
        addDebugLog(`Transcript received - ${message.role}: ${message.transcript}`);
        
        if (message.role === 'user') {
          setTranscript(message.transcript);
          onCallResult?.(message.transcript);
        }
      } else {
        addDebugLog(`Message received - type: ${message.type}`);
      }
    });

    vapiInstance.on('error', (error) => {
      addDebugLog(`Vapi error occurred: ${error.message || error}`);
      console.error('Vapi error:', error);
      setConnectionStatus('Connection error - please try again');
      setIsConnected(false);
    });

    vapiInstance.on('speech-start', () => {
      addDebugLog('Speech started - user is speaking');
      setLastActivity(new Date());
    });

    vapiInstance.on('speech-end', () => {
      addDebugLog('Speech ended - user stopped speaking');
      setLastActivity(new Date());
    });

    return () => {
      // Cleanup on unmount
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
      }
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
      addDebugLog('ERROR: Vapi not initialized');
      console.error('Vapi not initialized');
      return;
    }

    try {
      addDebugLog('Starting call - requesting microphone permissions');
      setConnectionStatus('Connecting...');
      setTranscript('');
      setDebugLogs([]); // Clear previous logs
      
      // Start the voice conversation with the assistant ID
      await vapi.start('8352c787-40ac-44e6-b77e-b8a903b3f2d9');
      addDebugLog('Call start request sent to Vapi');
      
    } catch (error) {
      addDebugLog(`Failed to start call: ${error}`);
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
      addDebugLog(`Microphone ${newMutedState ? 'muted' : 'unmuted'}`);
      
      if (newMutedState) {
        setConnectionStatus('Microphone muted');
      } else {
        setConnectionStatus('Connected to Mouritech Support');
      }
    } catch (error) {
      addDebugLog(`Failed to toggle mute: ${error}`);
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleEndCall = async () => {
    if (!vapi) return;

    try {
      addDebugLog('User manually ending call');
      await vapi.stop();
      setIsConnected(false);
      setIsMuted(false);
      setTranscript('');
      setConnectionStatus('Call ended');
      
      setTimeout(() => {
        setConnectionStatus('Ready to connect');
      }, 2000);
    } catch (error) {
      addDebugLog(`Failed to end call: ${error}`);
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
      
      {/* Debug Information */}
      {isConnected && debugLogs.length > 0 && (
        <div className="mt-4 p-4 bg-slate-800/60 backdrop-blur-sm rounded-xl max-w-md border border-blue-500/30 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-300" />
            <p className="text-sm text-blue-100 font-medium">Connection Debug:</p>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {debugLogs.slice(-5).map((log, index) => (
              <p key={index} className="text-xs text-blue-200 font-mono">{log}</p>
            ))}
          </div>
          {lastActivity && (
            <p className="text-xs text-blue-300 mt-2">
              Last activity: {lastActivity.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CallSupport;
