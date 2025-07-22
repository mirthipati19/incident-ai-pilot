
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ImprovedHCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

export interface ImprovedHCaptchaRef {
  resetCaptcha: () => void;
}

const ImprovedHCaptcha = forwardRef<ImprovedHCaptchaRef, ImprovedHCaptchaProps>(
  ({ onVerify, onError, onExpire }, ref) => {
    const [captchaError, setCaptchaError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [HCaptchaComponent, setHCaptchaComponent] = useState<any>(null);
    const [hcaptchaRef, setHcaptchaRef] = useState<any>(null);
    const [captchaKey, setCaptchaKey] = useState(0); // Force re-render
    const [isExpired, setIsExpired] = useState(false);
    const { toast } = useToast();
    
    const siteKey = '3772ca70-f05a-4270-bac8-9c4ae950872a';

    // Expose reset function to parent
    useImperativeHandle(ref, () => ({
      resetCaptcha: () => {
        console.log('🔄 Resetting captcha...');
        setCaptchaError(null);
        setIsExpired(false);
        setCaptchaKey(prev => prev + 1); // Force component re-render
        
        if (hcaptchaRef && hcaptchaRef.resetCaptcha) {
          try {
            hcaptchaRef.resetCaptcha();
            console.log('✅ hCaptcha reset successfully');
          } catch (error) {
            console.warn('⚠️ Could not reset hCaptcha via ref:', error);
          }
        }
      }
    }));

    // Load HCaptcha dynamically
    useEffect(() => {
      const loadHCaptcha = async () => {
        try {
          const HCaptcha = await import('@hcaptcha/react-hcaptcha');
          setHCaptchaComponent(() => HCaptcha.default);
          setIsLoading(false);
          console.log('✅ HCaptcha loaded successfully');
        } catch (error) {
          console.error('❌ HCaptcha package not available:', error);
          setCaptchaError('Security verification temporarily unavailable');
          setIsLoading(false);
        }
      };

      loadHCaptcha();
    }, []);

    const handleCaptchaVerify = (token: string) => {
      console.log('✅ Captcha verified successfully with token:', token.substring(0, 20) + '...');
      setCaptchaError(null);
      setIsExpired(false);
      onVerify(token);
    };

    const handleCaptchaError = (err: string) => {
      console.error('❌ Captcha error:', err);
      const errorMessage = `Security verification error: ${err}`;
      setCaptchaError(errorMessage);
      setIsExpired(false);
      onError?.(err);
      
      toast({
        title: "Security Verification Error",
        description: "Please try refreshing the captcha.",
        variant: "destructive",
      });
    };

    const handleCaptchaExpire = () => {
      console.log('⏰ Captcha expired');
      setIsExpired(true);
      setCaptchaError('Security verification expired. Please complete it again.');
      onExpire?.();
      
      toast({
        title: "Captcha Expired",
        description: "Please complete the security verification again.",
        variant: "destructive",
      });
    };

    const handleCaptchaLoad = () => {
      console.log('📥 Captcha loaded and ready');
      setCaptchaError(null);
      setIsExpired(false);
    };

    const handleRetryClick = () => {
      console.log('🔄 User clicked retry button');
      setCaptchaError(null);
      setIsExpired(false);
      setCaptchaKey(prev => prev + 1);
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

    if (captchaError || isExpired) {
      return (
        <div className="my-4 space-y-3">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {captchaError}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <button
              onClick={handleRetryClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Security Verification
            </button>
          </div>
        </div>
      );
    }

    // Render HCaptcha if available
    if (HCaptchaComponent) {
      return (
        <div className="flex justify-center my-4">
          <div className="w-full max-w-sm">
            <HCaptchaComponent
              key={captchaKey} // Force re-render on reset
              ref={setHcaptchaRef}
              sitekey={siteKey}
              onVerify={handleCaptchaVerify}
              onError={handleCaptchaError}
              onExpire={handleCaptchaExpire}
              onLoad={handleCaptchaLoad}
              theme="light"
              size="normal"
              // Increase expiration time to 10 minutes (600 seconds)
              expiry={600}
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
  }
);

ImprovedHCaptcha.displayName = 'ImprovedHCaptcha';

export default ImprovedHCaptcha;
