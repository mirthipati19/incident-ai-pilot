
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Shield } from 'lucide-react';

interface HCaptchaVerificationProps {
  onVerified: (token: string) => void;
  onError: (error: string) => void;
  siteKey?: string;
}

const HCaptchaVerification = ({ onVerified, onError, siteKey = "10000000-ffff-ffff-ffff-000000000001" }: HCaptchaVerificationProps) => {
  const [loading, setLoading] = useState(false);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);

  useEffect(() => {
    // Load hCaptcha script
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setCaptchaLoaded(true);
      renderCaptcha();
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://js.hcaptcha.com/1/api.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const renderCaptcha = () => {
    if (window.hcaptcha && captchaLoaded) {
      try {
        window.hcaptcha.render('hcaptcha-container', {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log('hCaptcha verification successful');
            onVerified(token);
          },
          'error-callback': (error: string) => {
            console.error('hCaptcha error:', error);
            onError('Captcha verification failed. Please try again.');
          },
          'expired-callback': () => {
            console.log('hCaptcha expired');
            onError('Captcha expired. Please try again.');
          }
        });
      } catch (error) {
        console.error('Error rendering hCaptcha:', error);
        onError('Failed to load captcha. Please refresh the page.');
      }
    }
  };

  const refreshCaptcha = () => {
    if (window.hcaptcha) {
      window.hcaptcha.reset();
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          Security Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div id="hcaptcha-container" className="h-20 w-full flex items-center justify-center">
            {!captchaLoaded && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading security verification...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={refreshCaptcha}
            disabled={!captchaLoaded}
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Complete the security check to proceed
        </p>
      </CardContent>
    </Card>
  );
};

// Extend window object to include hcaptcha
declare global {
  interface Window {
    hcaptcha: any;
  }
}

export default HCaptchaVerification;
