
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
  }, []);

  const handleCaptchaVerify = (token: string) => {
    console.log('✅ Captcha verified');
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

  if (isLoading) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading security verification...</span>
        </div>
      </div>
    );
  }

  if (captchaError) {
    return (
      <div className="my-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {captchaError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render HCaptcha if available
  if (HCaptchaComponent) {
    return (
      <div className="flex justify-center my-4">
        <div className="w-full max-w-sm">
          <HCaptchaComponent
            sitekey={siteKey}
            onVerify={handleCaptchaVerify}
            onError={handleCaptchaError}
            onExpire={handleCaptchaExpire}
            theme="light"
            size="normal"
          />
        </div>
      </div>
    );
  }

  // Fallback when HCaptcha fails to load
  return (
    <div className="my-4">
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
