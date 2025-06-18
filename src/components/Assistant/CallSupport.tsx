
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VoiceAssistant from './VoiceAssistant';

interface CallSupportProps {
  onCallResult?: (text: string) => void;
}

const CallSupport = ({ onCallResult }: CallSupportProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isCallActive) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    setIsConnecting(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsCallActive(true);
      setIsConnecting(false);
      toast({
        title: "Call Connected",
        description: "You're now connected to Mouritech Support",
      });
    }, 2000);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsMuted(false);
    toast({
      title: "Call Ended",
      description: "Thank you for contacting Mouritech Support",
    });
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
      description: isMuted ? "You can now speak" : "Your microphone is muted",
    });
  };

  const handleVoiceResult = (text: string) => {
    if (onCallResult) {
      onCallResult(text);
    }
  };

  if (!isCallActive && !isConnecting) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" />
            Call Support
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Speak directly with our AI support assistant for immediate help.
          </p>
          <Button 
            onClick={handleStartCall}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Phone className="w-4 h-4 mr-2" />
            Start Call
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isConnecting) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Phone className="w-5 h-5 animate-pulse" />
            Connecting...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-green-200 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to Mouritech Support...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <Phone className="w-5 h-5" />
            Call Active
          </CardTitle>
          <div className="text-2xl font-mono text-gray-700">
            {formatDuration(callDuration)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleToggleMute}
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              className="rounded-full w-16 h-16"
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
            
            <Button
              onClick={handleEndCall}
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {isMuted ? "Microphone muted" : "Microphone active"}
            </p>
          </div>
        </CardContent>
      </Card>

      <VoiceAssistant 
        isCallActive={isCallActive} 
        isMuted={isMuted} 
        onVoiceResult={handleVoiceResult}
      />
    </div>
  );
};

export default CallSupport;
