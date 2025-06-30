
import { getAuthConfig } from '@/config/authConfig';
import { Badge } from '@/components/ui/badge';
import { Terminal, Shield, Zap } from 'lucide-react';

const DeveloperModeIndicator = () => {
  const config = getAuthConfig();

  if (!config.developerMode) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
        <Terminal className="w-3 h-3 mr-1" />
        Developer Mode
      </Badge>
      
      {config.bypassMFA && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
          <Shield className="w-3 h-3 mr-1" />
          MFA Bypassed
        </Badge>
      )}
      
      {config.bypassCaptcha && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Captcha Bypassed
        </Badge>
      )}
    </div>
  );
};

export default DeveloperModeIndicator;
