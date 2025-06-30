
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authConfig, shouldBypassCaptcha } from '@/utils/authConfig';

interface ImprovedHCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

const ImprovedHCaptcha = ({ onVerify, onError, onExpire }: ImprovedHCaptchaProps) => {
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [HCaptchaComponent, setHCaptchaComponent] = useState<any>(null);
  const { toast } = useToast();
  
  const siteKey = '3b44032c-8648-406c-b16e-2a5c0ce29b4c';

  // Load HCaptcha dynamically
  useEffect(() => {
    const loadHCaptcha = async () => {
      try {
        if (shouldBypassCaptcha()) {
          console.log('🔧 Captcha bypassed in development mode');
          setIsLoading(false);
          // Auto-verify in development mode
          setTimeout(() => {
            const devToken = 'dev-bypass-token-' + Date.now();
            onVerify(devToken);
          }, 100);
          return;
        }

        const HCaptcha = await import('@hcaptcha/react-hcaptcha');
        setHCaptchaComponent(() => HCaptcha.default);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ HCaptcha package not available:', error);
        setCaptchaError('Security verification temporarily unavailable');
        setIsLoading(false);
      }
    };

    loadHCaptcha();
  }, [onVerify]);

  const handleFallbackVerification = () => {
    console.log('🔧 Using fallback captcha verification');
    const fallbackToken = 'dev-fallback-token-' + Date.now();
    onVerify(fallbackToken);
    toast({
      title: "Development Mode",
      description: "Captcha bypassed for development testing",
    });
  };

  const handleCaptchaVerify = (token: string) => {
    console.log('✅ Captcha verified:', token.substring(0, 20) + '...');
    setCaptchaError(null);
    onVerify(token);
  };

  const handleCaptchaError = (err: string) => {
    console.error('❌ Captcha error:', err);
    setCaptchaError(`Security verification error: ${err}`);
    onError?.(err);
  };

  const handleCaptchaExpire = () => {
    console.log('⏰ Captcha expired');
    setCaptchaError('Security verification expired. Please try again.');
    onExpire?.();
  };

  // Show bypass option in development
  if (shouldBypassCaptcha()) {
    return (
      <div className="my-4 space-y-3">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Development Mode: Security verification bypassed
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
        {authConfig.isDevelopment && (
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">
              Development Mode: You can bypass security verification
            </p>
            <Button 
              onClick={handleFallbackVerification}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Skip Verification (Dev Mode)
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render HCaptcha if available
  if (HCaptchaComponent) {
    return (
      <div className="flex justify-center my-4">
        <HCaptchaComponent
          sitekey={siteKey}
          onVerify={handleCaptchaVerify}
          onError={handleCaptchaError}
          onExpire={handleCaptchaExpire}
          theme="light"
        />
      </div>
    );
  }

  // Fallback for production when HCaptcha fails to load
  return (
    <div className="my-4 space-y-3">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Security verification is required but temporarily unavailable. Please try again later.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ImprovedHCaptcha;
