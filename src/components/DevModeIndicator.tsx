
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Settings } from 'lucide-react';
import { authConfig } from '@/utils/authConfig';

const DevModeIndicator = () => {
  if (!authConfig.isDevelopment) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="flex items-center gap-2">
            <Settings className="h-3 w-3" />
            <span className="font-semibold">Development Mode</span>
          </div>
          <div className="text-xs mt-1 space-y-1">
            <div>• Captcha bypassed</div>
            <div>• MFA codes in console</div>
            <div>• Extended session timeout</div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DevModeIndicator;
