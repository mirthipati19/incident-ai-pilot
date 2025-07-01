
import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSmartAgent } from '@/hooks/useSmartAgent';

interface ConnectPermissionPromptProps {
  onApproval?: (approved: boolean) => void;
}

const ConnectPermissionPrompt = ({ onApproval }: ConnectPermissionPromptProps) => {
  const { approved, isConnecting, requestApproval, sendCommand } = useSmartAgent();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installOutput, setInstallOutput] = useState('');

  const handleApprove = async () => {
    await requestApproval();
    onApproval?.(true);
    
    // Voice prompt
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        "Connection approved! I can now help you install approved software and manage your system."
      );
      speechSynthesis.speak(utterance);
    }
  };

  const handleDeny = () => {
    onApproval?.(false);
    
    // Voice prompt
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        "Connection denied. I'll work with limited capabilities."
      );
      speechSynthesis.speak(utterance);
    }
  };

  const handleInstallSoftware = async (software: string, command: string) => {
    setIsInstalling(true);
    try {
      const output = await sendCommand(command);
      setInstallOutput(output);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `${software} installation completed successfully.`
        );
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setInstallOutput(`❌ Error: ${error}`);
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 max-w-lg mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-300" />
          🔐 Smart Assistant Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!approved ? (
          <>
            <p className="text-white/90">
              The assistant wants to connect to your device to install approved software and manage incidents. Do you allow this connection?
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleApprove}
                disabled={isConnecting}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Allow Connection
              </Button>
              <Button 
                onClick={handleDeny}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircle className="w-5 h-5" />
              <span>Connection Approved - Smart Agent Active</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-white font-medium">Quick Actions:</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => handleInstallSoftware('VS Code', 'winget install Microsoft.VisualStudioCode')}
                  disabled={isInstalling}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isInstalling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  🚀 Install VS Code
                </Button>
                <Button 
                  onClick={() => handleInstallSoftware('Chrome', 'winget install Google.Chrome')}
                  disabled={isInstalling}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  {isInstalling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  🌐 Install Chrome
                </Button>
              </div>
            </div>

            {installOutput && (
              <div className="mt-4 p-3 bg-black/30 rounded-lg">
                <pre className="text-xs text-green-300 whitespace-pre-wrap">{installOutput}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectPermissionPrompt;
