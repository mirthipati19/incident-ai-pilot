import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Camera, 
  Upload, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw,
  Shield,
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ScreenCaptureProps {
  sessionId: string;
}

export const ScreenCapture = ({ sessionId }: ScreenCaptureProps) => {
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startScreenShare = async () => {
    try {
      setCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        setCapturing(false);
        toast({
          title: "Screen Sharing Stopped",
          description: "Screen sharing has been disconnected",
        });
      };

      toast({
        title: "Screen Sharing Started",
        description: "VisionAssist can now see your screen",
      });

    } catch (error) {
      console.error('Error starting screen share:', error);
      setCapturing(false);
      toast({
        title: "Screen Share Failed",
        description: "Unable to start screen sharing. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScreenShare = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCapturing(false);
    setAutoMode(false);
    toast({
      title: "Screen Sharing Stopped",
      description: "Screen sharing has been disconnected",
    });
  };

  const captureScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to base64
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setCurrentScreenshot(dataURL);
    
    return dataURL;
  }, []);

  const analyzeCurrentScreen = async () => {
    if (!currentScreenshot && capturing) {
      const screenshot = await captureScreenshot();
      if (!screenshot) return;
    }

    if (!currentScreenshot) {
      toast({
        title: "No Screenshot",
        description: "Please capture a screenshot first",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('vision-assist', {
        body: {
          action: 'analyzeScreen',
          sessionId,
          screenshot: currentScreenshot,
          intent: 'Continue with the current task',
          currentStep
        }
      });

      if (error) throw error;

      if (data.success) {
        setCurrentStep(currentStep + 1);
        toast({
          title: "Screen Analyzed",
          description: "VisionAssist has provided new guidance",
        });
      }
    } catch (error) {
      console.error('Error analyzing screen:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the screenshot",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      setCurrentScreenshot(dataURL);
      toast({
        title: "Screenshot Uploaded",
        description: "Ready for analysis",
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleAutoMode = () => {
    if (!autoMode) {
      setAutoMode(true);
      toast({
        title: "Auto Mode Enabled",
        description: "VisionAssist will continuously analyze your screen",
      });
      // Start auto-capture every 3 seconds
      autoModeInterval();
    } else {
      setAutoMode(false);
      toast({
        title: "Auto Mode Disabled",
        description: "Switched to manual capture mode",
      });
    }
  };

  const autoModeInterval = () => {
    if (autoMode && capturing) {
      setTimeout(async () => {
        await captureScreenshot();
        await analyzeCurrentScreen();
        if (autoMode) autoModeInterval();
      }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Screen Capture Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>Screen Capture</span>
          </h2>
          <div className="flex items-center space-x-2">
            {privacyMode && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Shield className="w-3 h-3 mr-1" />
                Privacy Mode
              </Badge>
            )}
            {capturing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Eye className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative mb-4">
          <video
            ref={videoRef}
            className={`w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg object-contain ${
              !capturing ? 'hidden' : ''
            }`}
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!capturing && (
            <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-3">
                <Camera className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400">
                  Start screen sharing or upload a screenshot to begin
                </p>
              </div>
            </div>
          )}

          {capturing && autoMode && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Auto Mode</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {!capturing ? (
              <Button
                onClick={startScreenShare}
                className="flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Screen Share</span>
              </Button>
            ) : (
              <Button
                onClick={stopScreenShare}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Sharing</span>
              </Button>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Screenshot</span>
            </Button>

            {capturing && (
              <Button
                onClick={toggleAutoMode}
                variant={autoMode ? "default" : "outline"}
                className="flex items-center space-x-2"
              >
                {autoMode ? <Pause className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                <span>{autoMode ? 'Stop Auto' : 'Auto Mode'}</span>
              </Button>
            )}
          </div>

          <Button
            onClick={analyzeCurrentScreen}
            disabled={!currentScreenshot || analyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {analyzing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Screen...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Analyze Current Screen</span>
              </div>
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Card>

      {/* Privacy Notice */}
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Privacy & Security Notice
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              Screenshots are processed securely and are not permanently stored. 
              Sensitive information like passwords will be automatically redacted.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};