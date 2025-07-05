
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Mic, Download, CheckCircle } from 'lucide-react';

interface VoiceControllerInstallerProps {
  onClose: () => void;
}

const VoiceControllerInstaller: React.FC<VoiceControllerInstallerProps> = ({ onClose }) => {
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  const handleInstall = () => {
    setIsInstalling(true);
    // Simulate installation process
    setTimeout(() => {
      setIsInstalling(false);
      setIsInstalled(true);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-white/20 text-white w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mic className="h-6 w-6 text-purple-400" />
              Voice Controller Installer
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              {!isInstalled ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Download className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-blue-200 text-sm">
                    Install the voice controller software to enable hands-free interaction with your support system.
                  </p>
                  
                  {!isInstalling ? (
                    <Button 
                      onClick={handleInstall}
                      className="bg-purple-600 hover:bg-purple-700 w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Install Voice Controller
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                      <p className="text-sm text-blue-200">Installing voice controller...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <p className="text-green-200 text-sm">
                    Voice controller installed successfully! You can now use voice commands to interact with the support system.
                  </p>
                  <Button 
                    onClick={onClose}
                    className="bg-green-600 hover:bg-green-700 w-full"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-white/20 pt-4">
              <h3 className="text-sm font-medium mb-2">Features:</h3>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• Voice-activated ticket creation</li>
                <li>• Hands-free navigation</li>
                <li>• Voice-to-text transcription</li>
                <li>• Audio feedback system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceControllerInstaller;
