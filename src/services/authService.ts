
import { supabase } from '@/integrations/supabase/client';
import { sendMFACode, verifyMFACode } from './mfaService';
import { authConfig, logAuthEvent } from '@/utils/authConfig';

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresMFA?: boolean;
  isAdmin?: boolean;
  userId?: string;
}

export const createAdminUserIfNeeded = async () => {
  try {
    logAuthEvent('Checking/creating admin user');
    
    // For hardcoded admin, try direct sign-in first to check if user exists
    const { data: testSignIn, error: testError } = await supabase.auth.signInWithPassword({
      email: authConfig.adminEmail,
      password: authConfig.adminPassword,
    });
    
    if (!testError && testSignIn.user) {
      // Admin exists and can sign in, sign out immediately
      await supabase.auth.signOut();
      logAuthEvent('Admin user verified via test login');
      return true;
    }
    
    // If admin doesn't exist, try to create via auth
    if (testError?.message?.includes('Invalid login credentials')) {
      logAuthEvent('Admin user does not exist, attempting to create');
      
      const { data: newAdmin, error: createError } = await supabase.auth.signUp({
        email: authConfig.adminEmail,
        password: authConfig.adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
          data: {
            name: 'Admin User'
          }
        }
      });
      
      if (createError) {
        console.warn('⚠️ Could not create admin via signup:', createError);
        return false;
      }
      
      if (newAdmin.user) {
        // Try to create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: newAdmin.user.id,
            user_id: authConfig.adminUserId,
            name: 'Admin User',
            email: authConfig.adminEmail,
            password_hash: 'handled_by_supabase'
          });
        
        if (profileError) {
          console.warn('⚠️ Could not create admin profile:', profileError);
        }
        
        // Try to create admin_users record
        const { error: adminError } = await supabase
          .from('admin_users')
          .insert({
            user_id: newAdmin.user.id,
            role: 'admin',
            permissions: ['view_tickets', 'manage_users', 'view_stats', 'full_admin']
          });
        
        if (adminError) {
          console.warn('⚠️ Could not create admin_users record:', adminError);
        }
        
        logAuthEvent('Admin user created successfully');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('💥 Error in admin setup:', error);
    return false;
  }
};

export const adminDirectLogin = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Attempting admin direct login', { email });
    
    // Require captcha token for admin login
    if (!captchaToken) {
      return { success: false, error: 'Security verification required' };
    }
    
    // For hardcoded admin, allow direct login
    if (email === authConfig.adminEmail && password === authConfig.adminPassword) {
      logAuthEvent('Admin credentials detected, processing login');
      
      // Ensure admin user exists (but don't fail if it doesn't work)
      await createAdminUserIfNeeded();
      
      // Sign in with Supabase
      const signInOptions: any = {
        email,
        password,
        options: { captchaToken }
      };

      const { data: session, error } = await supabase.auth.signInWithPassword(signInOptions);
      
      if (error) {
        console.error('❌ Admin auth failed:', error);
        return { success: false, error: error.message };
      }

      if (!session.user) {
        return { success: false, error: 'No user data received' };
      }

      logAuthEvent('Admin login successful', { userId: session.user.id });
      return { success: true, isAdmin: true, userId: session.user.id };
    }
    
    return { success: false, error: 'Invalid admin credentials' };
  } catch (error) {
    console.error('💥 Admin login error:', error);
    return { success: false, error: 'Admin login failed' };
  }
};

export const regularUserLogin = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Regular user login with MFA', { email });
    
    // Require captcha token for all logins
    if (!captchaToken) {
      return { success: false, error: 'Security verification required' };
    }
    
    // First, validate credentials by attempting to sign in
    const signInOptions: any = {
      email,
      password,
      options: { captchaToken }
    };

    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword(signInOptions);
    
    if (testError) {
      console.error('❌ Credential validation failed:', testError);
      return { success: false, error: testError.message };
    }
    
    // Immediately sign out to prevent session creation
    await supabase.auth.signOut();
    
    // Send MFA code for regular users
    logAuthEvent('Sending MFA code');
    const mfaResult = await sendMFACode(email);
    
    if (!mfaResult.success) {
      console.error('❌ MFA send failed:', mfaResult.error);
      return { success: false, error: mfaResult.error || 'Failed to send MFA code' };
    }
    
    logAuthEvent('MFA code sent, user needs to verify');
    return { success: true, requiresMFA: true };
  } catch (error) {
    console.error('💥 Regular login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

export const completeMFALogin = async (email: string, password: string, mfaCode: string, captchaToken?: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Completing MFA login', { email });
    
    // Require captcha token
    if (!captchaToken) {
      return { success: false, error: 'Security verification required' };
    }
    
    // Verify MFA code
    const verifyResult = await verifyMFACode(email, mfaCode);
    
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error || 'Invalid MFA code' };
    }
    
    // Complete login with captcha token
    const signInOptions: any = {
      email,
      password,
      options: { captchaToken }
    };

    const { data, error } = await supabase.auth.signInWithPassword(signInOptions);

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Login failed' };
    }

    logAuthEvent('MFA login completed successfully');
    return { success: true, isAdmin: false };
  } catch (error) {
    console.error('💥 MFA completion error:', error);
    return { success: false, error: 'MFA verification failed' };
  }
};
