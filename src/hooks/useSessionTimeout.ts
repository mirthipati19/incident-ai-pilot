
import { useEffect, useRef, useState } from 'react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { cookieUtils } from '@/utils/cookieUtils';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before timeout

export const useSessionTimeout = () => {
  const { user, signOut } = useImprovedAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    setShowWarning(false);

    if (user) {
      // Update session expiry in cookie
      cookieUtils.updateSessionExpiry();
      
      // Set warning timer
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        toast({
          title: "Session Warning",
          description: "Your session will expire in 2 minutes due to inactivity.",
          variant: "default",
        });
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      // Set logout timer
      timeoutRef.current = setTimeout(() => {
        signOut();
        toast({
          title: "Session Expired",
          description: "You have been signed out due to inactivity.",
          variant: "destructive",
        });
      }, INACTIVITY_TIMEOUT);
    }
  };

  const extendSession = () => {
    resetTimer();
    toast({
      title: "Session Extended",
      description: "Your session has been extended for another 30 minutes.",
      variant: "default",
    });
  };

  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      setShowWarning(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user]);

  return {
    showWarning,
    extendSession,
    timeRemaining: INACTIVITY_TIMEOUT
  };
};
