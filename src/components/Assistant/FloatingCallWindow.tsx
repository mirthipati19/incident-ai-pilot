
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Minimize2, Maximize2, X, Mic, MicOff } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface FloatingCallWindowProps {
  isActive: boolean;
  onEndCall: () => void;
  callDuration: number;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const FloatingCallWindow: React.FC<FloatingCallWindowProps> = ({
  isActive,
  onEndCall,
  callDuration,
  isMinimized = false,
  onToggleMinimize,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isActive) return null;

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? '200px' : '300px',
      }}
    >
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-2xl">
        <CardHeader
          className="pb-2 cursor-move bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">Active Call</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-4 text-white">
            <div className="text-center mb-4">
              <div className="text-2xl font-mono font-bold mb-2">
                {formatDuration(callDuration)}
              </div>
              <div className="text-sm text-slate-300">
                Authexa Support Assistant
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full border-2 ${
                  isMuted 
                    ? 'bg-red-600 border-red-500 text-white hover:bg-red-700' 
                    : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                }`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={onEndCall}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 border-2 border-red-500"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 text-xs text-center text-slate-400">
              Drag to move • Click minimize to reduce
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default FloatingCallWindow;
