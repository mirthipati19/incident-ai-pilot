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

// Admin users are now managed through Supabase Auth
// No hardcoded credentials - use proper authentication flow
export const adminDirectLogin = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Attempting admin login', { email });
    
    if (!captchaToken) {
      return { success: false, error: 'Security verification required' };
    }
    
    // Sign in through Supabase Auth - no hardcoded passwords
    const signInOptions: any = {
      email,
      password,
      options: { captchaToken }
    };

    const { data: session, error } = await supabase.auth.signInWithPassword(signInOptions);
    
    if (error) {
      console.error('❌ Admin auth failed:', error);
      return { success: false, error: 'Invalid credentials' };
    }

    if (!session.user) {
      return { success: false, error: 'No user data received' };
    }

    // Check if user is in admin_users table
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .single();

    if (!adminCheck) {
      await supabase.auth.signOut();
      return { success: false, error: 'Not authorized as admin' };
    }

    logAuthEvent('Admin login successful', { userId: session.user.id });
    return { success: true, isAdmin: true, userId: session.user.id };
  } catch (error) {
    console.error('💥 Admin login error:', error);
    return { success: false, error: 'Admin login failed' };
  }
};

export const regularUserLogin = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Regular user login with MFA', { email });
    
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
      // Return user-friendly error message
      if (testError.message.includes('Invalid login credentials')) {
        return { success: false, error: 'User doesn\'t exist or invalid credentials' };
      }
      return { success: false, error: testError.message };
    }
    
    // Immediately sign out to prevent session creation
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
    
    if (!captchaToken) {
      return { success: false, error: 'Security verification required' };
    }
    
    // Verify MFA code using updated service
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