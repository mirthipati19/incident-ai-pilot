
import { supabase } from '@/integrations/supabase/client';
import { getAuthConfig, DEV_HELPERS } from '@/config/authConfig';

export const sendMFACode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const config = getAuthConfig();
    DEV_HELPERS.logAuthFlow('MFA_SEND_REQUEST', { email });
    
    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing tokens for this email
    await supabase
      .from('mfa_tokens')
      .delete()
      .eq('email', email);

    // Store new token in database
    const { error: insertError } = await supabase
      .from('mfa_tokens')
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      DEV_HELPERS.logAuthFlow('MFA_STORE_ERROR', insertError);
      return { success: false, error: 'Failed to generate MFA code' };
    }

    // Developer mode: Log OTP to console
    if (config.enableConsoleOTP) {
      DEV_HELPERS.logMFACode(email, token);
    }
    
    DEV_HELPERS.logAuthFlow('MFA_SEND_SUCCESS', { email, tokenLength: token.length });
    return { success: true };
  } catch (error) {
    DEV_HELPERS.logAuthFlow('MFA_SEND_EXCEPTION', error);
    return { success: false, error: 'Failed to send MFA code' };
  }
};

export const verifyMFACode = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    DEV_HELPERS.logAuthFlow('MFA_VERIFY_REQUEST', { email, token });
    
    // Use the bypass function for reliable verification
    const { data, error } = await supabase.rpc('verify_mfa_token_bypass', {
      email_arg: email,
      token_arg: token
    });

    if (error) {
      DEV_HELPERS.logAuthFlow('MFA_VERIFY_RPC_ERROR', error);
      return { success: false, error: 'MFA verification system error' };
    }

    if (!data || data.length === 0) {
      DEV_HELPERS.logAuthFlow('MFA_VERIFY_NOT_FOUND', { email, token });
      
      // Check if token exists but is expired
      const { data: expiredCheck } = await supabase
        .from('mfa_tokens')
        .select('*')
        .eq('email', email)
        .eq('token', token)
        .single();

      if (expiredCheck) {
        return { success: false, error: 'MFA code has expired. Please request a new one.' };
      }

      return { success: false, error: 'Invalid MFA code. Please check and try again.' };
    }

    // Delete used token
    await supabase
      .from('mfa_tokens')
      .delete()
      .eq('email', email)
      .eq('token', token);

    DEV_HELPERS.logAuthFlow('MFA_VERIFY_SUCCESS', { email });
    return { success: true };
  } catch (error) {
    DEV_HELPERS.logAuthFlow('MFA_VERIFY_EXCEPTION', error);
    return { success: false, error: 'Failed to verify MFA code' };
  }
};
