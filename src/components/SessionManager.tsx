
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

const SessionManager = () => {
  useSessionTimeout(30); // 30 minutes timeout
  return null; // This component doesn't render anything
};

export default SessionManager;
