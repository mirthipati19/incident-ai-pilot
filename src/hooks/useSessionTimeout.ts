
import { useEffect, useRef } from 'react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSessionTimeout = (timeoutMinutes: number = 1.67) => { // 100 seconds = 1.67 minutes
  const { signOut, user } = useImprovedAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    if (user) {
      // Warning at 20 seconds before timeout (80 seconds)
      const warningTime = (timeoutMinutes * 60 - 20) * 1000;
      warningTimeoutRef.current = setTimeout(() => {
        toast({
          title: "Session Warning",
          description: "Your session will expire in 20 seconds due to inactivity.",
          variant: "destructive"
        });
      }, warningTime);

      // Actual timeout at 100 seconds
      timeoutRef.current = setTimeout(() => {
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity.",
          variant: "destructive"
        });
        signOut();
      }, timeoutMinutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimeoutHandler = () => resetTimeout();
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    resetTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [user, timeoutMinutes]);

  return { resetTimeout };
};
