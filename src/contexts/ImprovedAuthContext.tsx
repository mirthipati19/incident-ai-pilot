
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { unifiedAuthService, AuthResult } from '@/services/unifiedAuthService';
import { getAuthConfig, DEV_HELPERS } from '@/config/authConfig';

interface AuthUser extends User {
  user_id?: string;
  name?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signIn: (email: string, password: string, isAdmin?: boolean, captchaToken?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  verifyMFA: (email: string, code: string, password: string, captchaToken?: string) => Promise<AuthResult>;
  developerMode: boolean;
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
  const config = getAuthConfig();

  useEffect(() => {
    DEV_HELPERS.logAuthFlow('AUTH_CONTEXT_INIT', { developerMode: config.developerMode });
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await updateUserFromSession(session.user);
        }
      } catch (error) {
        DEV_HELPERS.logAuthFlow('SESSION_RETRIEVAL_ERROR', error);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      DEV_HELPERS.logAuthFlow('AUTH_STATE_CHANGE', { event, userEmail: session?.user?.email });
      
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
      
      const updatedUser: AuthUser = { 
        ...authUser, 
        user_id: profile?.user_id || undefined,
        name: profile?.name || authUser.user_metadata?.name || undefined,
        isAdmin
      };

      setUser(updatedUser);
      DEV_HELPERS.logAuthFlow('USER_SESSION_UPDATED', { 
        email: authUser.email, 
        isAdmin,
        userId: profile?.user_id 
      });
    } catch (error) {
      DEV_HELPERS.logAuthFlow('USER_SESSION_UPDATE_ERROR', error);
      setUser({ ...authUser, isAdmin: false });
    }
  };

  const checkAdminStatus = async (userId: string, email?: string): Promise<boolean> => {
    try {
      // Check hardcoded admin email
      if (email === 'murari.mirthipati@authexa.me') {
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
      DEV_HELPERS.logAuthFlow('ADMIN_CHECK_ERROR', error);
      return email === 'murari.mirthipati@authexa.me';
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
    return unifiedAuthService.signUp(email, password, name);
  };

  const signIn = async (email: string, password: string, isAdmin = false, captchaToken?: string): Promise<AuthResult> => {
    return unifiedAuthService.signIn(email, password, isAdmin, captchaToken);
  };

  const verifyMFA = async (email: string, code: string, password: string, captchaToken?: string): Promise<AuthResult> => {
    return unifiedAuthService.verifyMFA(email, code, password, captchaToken);
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
      DEV_HELPERS.logAuthFlow('SIGNOUT_SUCCESS', {});
    } catch (error) {
      DEV_HELPERS.logAuthFlow('SIGNOUT_ERROR', error);
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
      developerMode: config.developerMode,
    }}>
      {children}
    </ImprovedAuthContext.Provider>
  );
};
