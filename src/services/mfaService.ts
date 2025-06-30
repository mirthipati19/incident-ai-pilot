
import { supabase } from '@/integrations/supabase/client';

export const sendMFACode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store token in database
    const { error: insertError } = await supabase
      .from('mfa_tokens')
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('MFA token insert error:', insertError);
      return { success: false, error: 'Failed to generate MFA code' };
    }

    // In a real application, you would send this via email
    // For now, we'll log it to console for testing
    console.log(`MFA Code for ${email}: ${token}`);
    
    // You can integrate with email service here
    // await sendEmailWithMFACode(email, token);

    return { success: true };
  } catch (error) {
    console.error('MFA send error:', error);
    return { success: false, error: 'Failed to send MFA code' };
  }
};

export const verifyMFACode = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('mfa_tokens')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid or expired MFA code' };
    }

    // Delete used token
    await supabase
      .from('mfa_tokens')
      .delete()
      .eq('id', data.id);

    return { success: true };
  } catch (error) {
    console.error('MFA verify error:', error);
    return { success: false, error: 'Failed to verify MFA code' };
  }
};
