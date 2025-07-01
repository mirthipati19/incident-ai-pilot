
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
    
    // For admin login, we'll verify by attempting authentication
    return await verifyAdminExists();
  } catch (error) {
    console.error('💥 Error setting up admin user:', error);
    return false;
  }
};

const verifyAdminExists = async (): Promise<boolean> => {
  try {
    // Try to authenticate as admin to verify existence
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authConfig.adminEmail,
      password: authConfig.adminPassword,
    });
    
    if (!error && data.user) {
      // Admin exists, sign out immediately to prevent session creation
      await supabase.auth.signOut();
      logAuthEvent('Admin user verified via authentication test');
      return true;
    }
    
    logAuthEvent('Admin verification failed', { error: error?.message });
    return false;
  } catch (error) {
    console.error('❌ Admin verification failed:', error);
    return false;
  }
};

export const adminDirectLogin = async (email: string, password: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Attempting admin direct login', { email });
    
    // For hardcoded admin, allow direct login without captcha
    if (email === authConfig.adminEmail && password === authConfig.adminPassword) {
      logAuthEvent('Admin credentials detected, processing login');
      
      // Sign in with Supabase - no captcha required for admin
      const { data: session, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      logAuthEvent('Admin sign-in session result', { 
        success: !!session?.session, 
        error: error?.message || 'none' 
      });

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

export const regularUserLogin = async (email: string, password: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Regular user login with MFA', { email });
    
    // First, validate credentials by attempting to sign in WITHOUT captcha
    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (testError) {
      console.error('❌ Credential validation failed:', testError);
      return { success: false, error: testError.message };
    }
    
    // Immediately sign out to prevent session creation before MFA
    await supabase.auth.signOut();
    
    // Always send MFA code for regular users
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
    
    // Require captcha token for MFA completion
    if (!captchaToken) {
      return { success: false, error: 'Security verification required' };
    }
    
    // Verify MFA code using updated service
    const verifyResult = await verifyMFACode(email, mfaCode);
    
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error || 'Invalid MFA code' };
    }
    
    // Complete login with captcha token
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { 
        captchaToken 
      }
    });

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
