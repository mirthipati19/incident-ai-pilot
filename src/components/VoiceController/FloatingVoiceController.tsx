
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Minimize2, Maximize2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FloatingVoiceControllerProps {
  isActive: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const FloatingVoiceController: React.FC<FloatingVoiceControllerProps> = ({
  isActive,
  onToggle,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`bg-slate-800 text-white border-none shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-80 h-32'
      }`}>
        {isMinimized ? (
          <div className="flex items-center justify-center h-full">
            <Button
              onClick={() => setIsMinimized(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-700 p-0 w-full h-full"
            >
              <Phone className="w-6 h-6 text-green-400" />
            </Button>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Voice Assistant Active</span>
              </div>
              <div className="flex space-x-1">
                <Button
                  onClick={() => setIsMinimized(true)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-slate-700 p-1 h-6 w-6"
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-lg font-mono text-green-400">
                {formatDuration(callDuration)}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={onToggle}
                  variant="ghost"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-8 rounded-full bg-green-400 ${
                      i < 3 ? 'animate-pulse' : 'opacity-30'
                    }`}
                    style={{
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FloatingVoiceController;
