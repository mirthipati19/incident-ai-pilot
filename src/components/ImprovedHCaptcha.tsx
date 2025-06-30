
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImprovedHCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

const ImprovedHCaptcha = ({ onVerify, onError, onExpire }: ImprovedHCaptchaProps) => {
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const siteKey = '3b44032c-8648-406c-b16e-2a5c0ce29b4c';

  // Fallback verification for development
  const handleFallbackVerification = () => {
    console.log('🔧 Using fallback captcha verification for development');
    const fallbackToken = 'dev-fallback-token-' + Date.now();
    onVerify(fallbackToken);
    toast({
      title: "Development Mode",
      description: "Captcha bypassed for development testing",
    });
  };

  // Try to load HCaptcha dynamically
  React.useEffect(() => {
    const loadHCaptcha = async () => {
      try {
        // Check if HCaptcha is available
        const HCaptcha = await import('@hcaptcha/react-hcaptcha');
        setIsLoading(false);
        return HCaptcha.default;
      } catch (error) {
        console.error('❌ HCaptcha package not available:', error);
        setCaptchaError('HCaptcha package not installed');
        setIsLoading(false);
      }
    };

    loadHCaptcha();
  }, []);

  const handleCaptchaVerify = (token: string) => {
    console.log('✅ Captcha verified:', token.substring(0, 20) + '...');
    setCaptchaError(null);
    onVerify(token);
  };

  const handleCaptchaError = (err: string) => {
    console.error('❌ Captcha error:', err);
    setCaptchaError(`Captcha error: ${err}`);
    onError?.(err);
  };

  const handleCaptchaExpire = () => {
    console.log('⏰ Captcha expired');
    setCaptchaError('Captcha expired. Please try again.');
    onExpire?.();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading security verification...</span>
        </div>
      </div>
    );
  }

  if (captchaError) {
    return (
      <div className="my-4 space-y-3">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {captchaError}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-2">
            Development Mode: You can bypass captcha verification
          </p>
          <Button 
            onClick={handleFallbackVerification}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Skip Captcha (Dev Mode)
          </Button>
        </div>
      </div>
    );
  }

  // Try to render HCaptcha
  try {
    const HCaptcha = require('@hcaptcha/react-hcaptcha').default;
    
    return (
      <div className="flex justify-center my-4">
        <HCaptcha
          sitekey={siteKey}
          onVerify={handleCaptchaVerify}
          onError={handleCaptchaError}
          onExpire={handleCaptchaExpire}
          theme="dark"
        />
      </div>
    );
  } catch (error) {
    console.error('❌ HCaptcha component error:', error);
    return (
      <div className="my-4 space-y-3">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Security verification temporarily unavailable
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button 
            onClick={handleFallbackVerification}
            variant="outline"
            size="sm"
          >
            Continue (Development Mode)
          </Button>
        </div>
      </div>
    );
  }
};

export default ImprovedHCaptcha;
