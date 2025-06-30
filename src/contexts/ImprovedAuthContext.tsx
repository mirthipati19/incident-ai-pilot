
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { adminDirectLogin, regularUserLogin, completeMFALogin, createAdminUserIfNeeded } from '@/services/authService';
import { generateSessionToken } from '@/utils/urlEncryption';
import { authConfig, logAuthEvent, shouldBypassCaptcha } from '@/utils/authConfig';

interface AuthUser extends User {
  user_id?: string;
  name?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, captchaToken?: string) => Promise<{ success: boolean; error?: string; userId?: string }>;
  signIn: (email: string, password: string, isAdmin?: boolean, captchaToken?: string) => Promise<{ success: boolean; error?: string; requiresMFA?: boolean; isAdmin?: boolean }>;
  signOut: () => Promise<void>;
  verifyMFA: (email: string, code: string, password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
  isDevelopmentMode: boolean;
}

const ImprovedAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useImprovedAuth = () => {
  const context = useContext(ImprovedAuthContext);
  if (!context) {
    throw new Error('useImprovedAuth must be used within an ImprovedAuthProvider');
  }
  return context;
};

export const ImprovedAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAuthEvent('Initializing improved auth context');
    
    // Show development mode indicator
    if (authConfig.isDevelopment) {
      console.log('🔧 DEVELOPMENT MODE ACTIVE');
      console.log('  - Captcha bypass:', shouldBypassCaptcha());
      console.log('  - Extended session timeout:', authConfig.sessionSettings.timeoutMinutes, 'minutes');
      console.log('  - Verbose logging enabled');
    }
    
    // Initialize admin user on startup
    createAdminUserIfNeeded();
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await updateUserFromSession(session.user);
        }
      } catch (error) {
        console.error('❌ Session retrieval error:', error);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logAuthEvent('Auth state changed', { event, email: session?.user?.email });
      
      if (session?.user) {
        await updateUserFromSession(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserFromSession = async (authUser: User) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('user_id, name')
        .eq('id', authUser.id)
        .single();
      
      // Check admin status
      const isAdmin = await checkAdminStatus(authUser.id, authUser.email);
      
      setUser({ 
        ...authUser, 
        user_id: profile?.user_id || undefined,
        name: profile?.name || authUser.user_metadata?.name || undefined,
        isAdmin
      });
      
      logAuthEvent('User session updated', { 
        email: authUser.email, 
        isAdmin: isAdmin ? '(Admin)' : '(User)' 
      });
    } catch (error) {
      console.error('❌ Error updating user session:', error);
      setUser({ ...authUser, isAdmin: false });
    }
  };

  const checkAdminStatus = async (userId: string, email?: string): Promise<boolean> => {
    try {
      // First check for hardcoded admin email
      if (email === authConfig.adminEmail) {
        logAuthEvent('Admin detected by email', { email });
        return true;
      }

      // Check admin_users table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .single();

      return adminData?.role === 'admin';
    } catch (error) {
      console.error('❌ Admin check error:', error);
      return email === authConfig.adminEmail;
    }
  };

  const signUp = async (email: string, password: string, name: string, captchaToken?: string) => {
    try {
      logAuthEvent('Sign up attempt', { email });
      
      const signUpOptions: any = {
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/itsm`
        }
      };

      // Only include captcha token if not bypassed in development
      if (captchaToken && !shouldBypassCaptcha()) {
        signUpOptions.options.captchaToken = captchaToken;
      }

      const { data, error } = await supabase.auth.signUp(signUpOptions);

      if (error) {
        logAuthEvent('Sign up failed', { error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        let userId = Math.floor(100000 + Math.random() * 100000).toString();
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            user_id: userId,
            name,
            email,
            password_hash: 'handled_by_supabase'
          });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          return { success: false, error: 'Failed to create user profile' };
        }

        logAuthEvent('Sign up successful', { userId });
        return { success: true, userId };
      }

      return { success: false, error: 'User creation failed' };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string, isAdmin = false, captchaToken?: string) => {
    try {
      logAuthEvent('Sign in attempt', { email, isAdmin: isAdmin ? '(Admin)' : '(User)' });
      
      if (isAdmin) {
        // Use direct admin login
        const result = await adminDirectLogin(email, password, captchaToken);
        return result;
      } else {
        // Use regular user login with MFA
        const result = await regularUserLogin(email, password, captchaToken);
        return result;
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { success: false, error: 'Sign in failed' };
    }
  };

  const verifyMFA = async (email: string, code: string, password: string, captchaToken?: string) => {
    try {
      const result = await completeMFALogin(email, password, code, captchaToken);
      return result;
    } catch (error) {
      console.error('❌ MFA verification error:', error);
      return { success: false, error: 'MFA verification failed' };
    }
  };

  const signOut = async () => {
    try {
      if (user?.id) {
        // Mark current session as inactive
        await supabase
          .from('user_sessions')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }
      
      await supabase.auth.signOut();
      logAuthEvent('User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  return (
    <ImprovedAuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      verifyMFA,
      isDevelopmentMode: authConfig.isDevelopment,
    }}>
      {children}
    </ImprovedAuthContext.Provider>
  );
};
