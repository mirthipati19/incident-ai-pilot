
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  user_id?: string;
  name?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; userId?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
  signOut: () => Promise<void>;
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

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      return !!data;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get user profile data
        const { data: profile } = await supabase
          .from('users')
          .select('user_id, name')
          .eq('id', session.user.id)
          .single();
        
        // Check admin status
        const isAdmin = await checkAdminStatus(session.user.id);
        
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // For social auth, we might need to create a user profile
        if (event === 'SIGNED_IN' && session.user.app_metadata?.provider !== 'email') {
          // Check if user profile exists
          const { data: existingProfile } = await supabase
            .from('users')
            .select('user_id, name')
            .eq('id', session.user.id)
            .single();

          if (!existingProfile) {
            // Create profile for social auth user
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

            const isAdmin = await checkAdminStatus(session.user.id);
            setUser({ 
              ...session.user, 
              user_id: userId,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
              isAdmin
            });
          } else {
            const isAdmin = await checkAdminStatus(session.user.id);
            setUser({ 
              ...session.user, 
              user_id: existingProfile.user_id,
              name: existingProfile.name,
              isAdmin
            });
          }
        } else {
          // Regular email auth or existing social auth user
          const { data: profile } = await supabase
            .from('users')
            .select('user_id, name')
            .eq('id', session.user.id)
            .single();
          
          const isAdmin = await checkAdminStatus(session.user.id);
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
        // Generate unique 6-digit user ID
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

        // Store user profile
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
      console.log('Attempting to sign in with:', email);
      
      // Check if this is the admin login
      if (email === 'Murari.mirthipati@authexa.me' && password === 'Qwertyuiop@0987654321') {
        console.log('Admin login detected');
        
        // Check if admin user exists in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          console.log('Admin auth error:', authError.message);
          
          // If admin doesn't exist in auth, create them
          if (authError.message.includes('Invalid login credentials') || authError.message.includes('Email not confirmed')) {
            console.log('Creating admin user...');
            
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/admin`
              }
            });

            if (signUpError) {
              console.error('Admin signup error:', signUpError);
              return { success: false, error: signUpError.message };
            }

            if (signUpData.user) {
              console.log('Admin user created, setting up profile...');
              
              // Create admin profile
              const { error: profileError } = await supabase
                .from('users')
                .insert({
                  id: signUpData.user.id,
                  user_id: '000001',
                  name: 'Admin User',
                  email,
                  password_hash: 'handled_by_supabase'
                });

              if (profileError) {
                console.error('Admin profile creation error:', profileError);
              }

              // Create admin entry
              const { error: adminError } = await supabase
                .from('admin_users')
                .insert({
                  user_id: signUpData.user.id,
                  role: 'admin',
                  permissions: ['view_tickets', 'manage_users', 'view_stats', 'admin_dashboard']
                });

              if (adminError) {
                console.error('Admin role creation error:', adminError);
              }

              console.log('Admin setup complete');
              return { success: true, isAdmin: true };
            }
          }
          return { success: false, error: authError.message };
        }

        // Check if user has admin role
        console.log('Checking admin status for user:', authUser.user.id);
        const isAdmin = await checkAdminStatus(authUser.user.id);
        console.log('Admin status:', isAdmin);
        
        return { success: true, isAdmin };
      }

      // Regular user login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, isAdmin: false };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
