import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { adminDirectLogin, regularUserLogin, completeMFALogin, createAdminUserIfNeeded } from '@/services/authService';
import { authConfig, logAuthEvent } from '@/utils/authConfig';
import { generateSessionToken, validateSessionToken } from '@/utils/urlEncryption';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    logAuthEvent('Initializing production auth context with enhanced security');
    
    // Initialize admin user on startup
    createAdminUserIfNeeded();
    
    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logAuthEvent('Auth state changed with enhanced security', { event, email: session?.user?.email });
      
      if (session?.user) {
        // Generate and store session token for additional security
        const sessionToken = generateSessionToken();
        localStorage.setItem('auth_session_token', sessionToken);
        
        await updateUserFromSession(session.user);
      } else {
        localStorage.removeItem('auth_session_token');
        setUser(null);
      }
      setLoading(false);
    });

    // Then get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session retrieval error:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Validate session token if it exists
          const sessionToken = localStorage.getItem('auth_session_token');
          if (sessionToken && !validateSessionToken(sessionToken)) {
            logAuthEvent('Invalid session token detected, signing out');
            await supabase.auth.signOut();
            localStorage.removeItem('auth_session_token');
            setLoading(false);
            return;
          }
          
          await updateUserFromSession(session.user);
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Session initialization error:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Security: Clear sensitive data on page unload
    const handleBeforeUnload = () => {
      if (performance.navigation?.type === 1) {
        localStorage.removeItem('temp_auth_data');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const updateUserFromSession = async (authUser: User) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('user_id, name')
        .eq('id', authUser.id)
        .single();
      
      // Check admin status - FIXED: More comprehensive admin check
      const isAdmin = await checkAdminStatus(authUser.id, authUser.email);
      
      setUser({ 
        ...authUser, 
        user_id: profile?.user_id || undefined,
        name: profile?.name || authUser.user_metadata?.name || undefined,
        isAdmin
      });
      
      logAuthEvent('User session updated with security validation', { 
        email: authUser.email, 
        isAdmin: isAdmin ? '(Admin)' : '(User)' 
      });
    } catch (error) {
      console.error('❌ Error updating user session:', error);
      // Set basic user data with admin check fallback
      const isAdmin = authUser.email === authConfig.adminEmail;
      setUser({ ...authUser, isAdmin });
    }
  };

  const checkAdminStatus = async (userId: string, email?: string): Promise<boolean> => {
    try {
      // First check for hardcoded admin email - PRIORITY CHECK
      if (email && email.toLowerCase() === authConfig.adminEmail.toLowerCase()) {
        logAuthEvent('Admin detected by email', { email });
        
        // Ensure admin user exists in admin_users table
        try {
          const { data: existingAdmin } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', userId)
            .single();
            
          if (!existingAdmin) {
            // Create admin record if it doesn't exist
            await supabase
              .from('admin_users')
              .insert({
                user_id: userId,
                role: 'admin',
                permissions: ['view_tickets', 'manage_users', 'view_stats', 'manage_system']
              });
            logAuthEvent('Admin user record created');
          }
        } catch (adminTableError) {
          console.log('Admin table operation:', adminTableError);
        }
        
        return true;
      }

      // Check admin_users table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .single();

      const isAdminFromTable = adminData?.role === 'admin';
      logAuthEvent('Admin check from table', { isAdmin: isAdminFromTable });
      
      return isAdminFromTable;
    } catch (error) {
      console.error('❌ Admin check error:', error);
      // Fallback to email check
      return email?.toLowerCase() === authConfig.adminEmail.toLowerCase();
    }
  };

  const signUp = async (email: string, password: string, name: string, captchaToken?: string) => {
    try {
      logAuthEvent('Sign up attempt with enhanced security', { email });
      
      // Require captcha token
      if (!captchaToken) {
        return { success: false, error: 'Security verification required' };
      }
      
      // Sign up with email confirmation enabled
      const signUpOptions: any = {
        email,
        password,
        options: {
          captchaToken,
          data: {
            name: name
          },
          emailRedirectTo: `${window.location.origin}/signin`
        }
      };

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

        logAuthEvent('Sign up successful with enhanced security', { userId });
        
        // Show confirmation popup
        toast({
          title: "Account Created!",
          description: "A confirmation email has been sent to your email address. Please check your inbox and click the link to verify your account.",
        });
        
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
      logAuthEvent('Sign in attempt with enhanced security', { email, isAdmin: isAdmin ? '(Admin)' : '(User)' });
      
      if (isAdmin) {
        const result = await adminDirectLogin(email, password, captchaToken);
        return result;
      } else {
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
      
      // Clear all local storage auth data
      localStorage.removeItem('auth_session_token');
      localStorage.removeItem('temp_auth_data');
      
      await supabase.auth.signOut();
      logAuthEvent('User signed out successfully with security cleanup');
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
      isDevelopmentMode: false,
    }}>
      {children}
    </ImprovedAuthContext.Provider>
  );
};
