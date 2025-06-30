
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSessionTimeout = (timeoutMinutes: number = 2) => {
  const { signOut, user } = useAuth();
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
      // Warning at 30 seconds before timeout
      const warningTime = (timeoutMinutes * 60 - 30) * 1000;
      warningTimeoutRef.current = setTimeout(() => {
        toast({
          title: "Session Warning",
          description: "Your session will expire in 30 seconds due to inactivity.",
          variant: "destructive"
        });
      }, warningTime);

      // Actual timeout
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
