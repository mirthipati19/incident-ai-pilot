
import { useEffect, useRef } from 'react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const { signOut, user } = useImprovedAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    if (user) {
      lastActivityRef.current = Date.now();
      
      // Warning at 2 minutes before timeout
      const warningTime = (timeoutMinutes - 2) * 60 * 1000;
      warningTimeoutRef.current = setTimeout(() => {
        toast({
          title: "Session Warning",
          description: "Your session will expire in 2 minutes due to inactivity.",
          variant: "destructive"
        });
      }, warningTime);

      // Actual timeout
      timeoutRef.current = setTimeout(async () => {
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity.",
          variant: "destructive"
        });
        await signOut();
        navigate('/signin');
      }, timeoutMinutes * 60 * 1000);
    }
  };

  const checkSession = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // If more than timeout period has passed, force logout
    if (timeSinceLastActivity > timeoutMinutes * 60 * 1000) {
      signOut();
      navigate('/signin');
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'keydown', 'wheel'
    ];
    
    const resetTimeoutHandler = () => resetTimeout();
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    // Check session validity every minute
    const sessionCheckInterval = setInterval(checkSession, 60000);

    resetTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
      clearInterval(sessionCheckInterval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [user, timeoutMinutes]);

  return { resetTimeout };
};
