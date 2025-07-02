
import { supabase } from '@/integrations/supabase/client';

export interface MFAResult {
  success: boolean;
  error?: string;
}

let currentMFACode: string | null = null;
let mfaResendCount = 0;
let lastResendTime = 0;

const generateMFACode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendMFACode = async (email: string): Promise<MFAResult> => {
  try {
    // Rate limiting for resend
    const now = Date.now();
    if (now - lastResendTime < 30000) { // 30 seconds between resends
      return { success: false, error: 'Please wait 30 seconds before requesting another code' };
    }

    // Generate new code
    currentMFACode = generateMFACode();
    mfaResendCount = 0;
    lastResendTime = now;

    // Store in database with expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const { error } = await supabase
      .from('mfa_tokens')
      .insert({
        email: email,
        token: currentMFACode,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('MFA token storage error:', error);
      return { success: false, error: 'Failed to generate MFA code' };
    }

    // Call edge function to send email
    const { error: emailError } = await supabase.functions.invoke('send-mfa-email', {
      body: {
        email: email,
        mfaCode: currentMFACode
      }
    });

    if (emailError) {
      console.error('MFA email send error:', emailError);
      return { success: false, error: 'Failed to send MFA code via email' };
    }

    return { success: true };
  } catch (error) {
    console.error('MFA send error:', error);
    return { success: false, error: 'Failed to send MFA code' };
  }
};

export const resendMFACode = async (email: string): Promise<MFAResult> => {
  try {
    const now = Date.now();
    
    // Check resend rate limiting
    if (now - lastResendTime < 30000) {
      const remainingTime = Math.ceil((30000 - (now - lastResendTime)) / 1000);
      return { 
        success: false, 
        error: `Please wait ${remainingTime} seconds before requesting another code` 
      };
    }

    // Limit total resends
    if (mfaResendCount >= 3) {
      return { success: false, error: 'Maximum resend attempts reached. Please try again later.' };
    }

    // Generate new code
    currentMFACode = generateMFACode();
    mfaResendCount += 1;
    lastResendTime = now;

    // Store new code in database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete old tokens for this email first
    await supabase
      .from('mfa_tokens')
      .delete()
      .eq('email', email);

    const { error } = await supabase
      .from('mfa_tokens')
      .insert({
        email: email,
        token: currentMFACode,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('MFA token resend storage error:', error);
      return { success: false, error: 'Failed to generate new MFA code' };
    }

    // Send new code via email
    const { error: emailError } = await supabase.functions.invoke('send-mfa-email', {
      body: {
        email: email,
        mfaCode: currentMFACode
      }
    });

    if (emailError) {
      console.error('MFA email resend error:', emailError);
      return { success: false, error: 'Failed to send new MFA code via email' };
    }

    return { success: true };
  } catch (error) {
    console.error('MFA resend error:', error);
    return { success: false, error: 'Failed to resend MFA code' };
  }
};

export const verifyMFACode = async (email: string, code: string): Promise<MFAResult> => {
  try {
    // Use the database function to verify the token
    const { data, error } = await supabase.rpc('verify_mfa_token_bypass', {
      email_arg: email,
      token_arg: code
    });

    if (error) {
      console.error('MFA verification error:', error);
      return { success: false, error: 'Verification failed' };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Invalid or expired MFA code' };
    }

    // Clear the used token
    await supabase
      .from('mfa_tokens')
      .delete()
      .eq('email', email)
      .eq('token', code);

    // Reset tracking variables
    currentMFACode = null;
    mfaResendCount = 0;
    lastResendTime = 0;

    return { success: true };
  } catch (error) {
    console.error('MFA verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
};
