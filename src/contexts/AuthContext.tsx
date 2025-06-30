
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { sendMFACode, verifyMFACode } from '@/services/mfaService';
import { generateSessionToken } from '@/utils/urlEncryption';

interface AuthUser extends User {
  user_id?: string;
  name?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean; requiresMFA?: boolean }>;
  signOut: () => Promise<void>;
  sendMFA: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyMFA: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  completeMFALogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async (userId: string, email?: string) => {
    try {
      if (email === 'murari.mirthipati@authexa.me') {
        console.log('Admin email detected:', email);
        return true;
      }

      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      return !!data;
    } catch (error) {
      if (email === 'murari.mirthipati@authexa.me') {
        return true;
      }
      return false;
    }
  };

  const createUserSession = async (userId: string) => {
    try {
      const sessionToken = generateSessionToken();
      
      // End any existing active sessions for this user
      await supabase
        .from('user_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Create new session
      await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          is_active: true
        });

      return sessionToken;
    } catch (error) {
      console.error('Session creation error:', error);
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('user_id, name')
          .eq('id', session.user.id)
          .single();
        
        const isAdmin = await checkAdminStatus(session.user.id, session.user.email);
        
        setUser({ 
          ...session.user, 
          user_id: profile?.user_id || undefined,
          name: profile?.name || session.user.user_metadata?.name || undefined,
          isAdmin
        });
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (session?.user) {
        if (event === 'SIGNED_IN' && session.user.app_metadata?.provider !== 'email') {
          const { data: existingProfile } = await supabase
            .from('users')
            .select('user_id, name')
            .eq('id', session.user.id)
            .single();

          if (!existingProfile) {
            const userId = generateUserId();
            await supabase
              .from('users')
              .insert({
                id: session.user.id,
                user_id: userId,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
                email: session.user.email || '',
                password_hash: 'social_auth'
              });

            const isAdmin = await checkAdminStatus(session.user.id, session.user.email);
            
            setUser({ 
              ...session.user, 
              user_id: userId,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
              isAdmin
            });
          } else {
            const isAdmin = await checkAdminStatus(session.user.id, session.user.email);
            
            setUser({ 
              ...session.user, 
              user_id: existingProfile.user_id,
              name: existingProfile.name,
              isAdmin
            });
          }
        } else {
          const { data: profile } = await supabase
            .from('users')
            .select('user_id, name')
            .eq('id', session.user.id)
            .single();
          
          const isAdmin = await checkAdminStatus(session.user.id, session.user.email);
          
          setUser({ 
            ...session.user, 
            user_id: profile?.user_id || undefined,
            name: profile?.name || session.user.user_metadata?.name || undefined,
            isAdmin
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const generateUserId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendMFA = async (email: string) => {
    return await sendMFACode(email);
  };

  const verifyMFA = async (email: string, code: string) => {
    return await verifyMFACode(email, code);
  };

  const completeMFALogin = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const isAdmin = email === 'murari.mirthipati@authexa.me';
      return { success: true, isAdmin };
    } catch (error) {
      console.error('Complete MFA login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/itsm`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        let userId = generateUserId();
        let attempts = 0;
        
        while (attempts < 10) {
          const { data: existing } = await supabase
            .from('users')
            .select('user_id')
            .eq('user_id', userId)
            .single();
          
          if (!existing) break;
          userId = generateUserId();
          attempts++;
        }

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
          console.error('Profile creation error:', profileError);
          return { success: false, error: 'Failed to create user profile' };
        }

        return { success: true, userId };
      }

      return { success: false, error: 'User creation failed' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Sign in attempt for:', email);
      
      // For admin, handle special login
      if (email === 'murari.mirthipati@authexa.me' && password === 'Qwertyuiop@0987654321') {
        // Send MFA first
        const mfaResult = await sendMFA(email);
        if (!mfaResult.success) {
          return { success: false, error: 'Failed to send MFA code' };
        }
        return { success: true, requiresMFA: true };
      }

      // For regular users, also require MFA
      const mfaResult = await sendMFA(email);
      if (!mfaResult.success) {
        return { success: false, error: 'Failed to send MFA code' };
      }

      return { success: true, requiresMFA: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    if (user?.id) {
      // Mark current session as inactive
      await supabase
        .from('user_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true);
    }
    
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      sendMFA,
      verifyMFA,
      completeMFALogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
