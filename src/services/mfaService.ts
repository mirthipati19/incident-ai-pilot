
import { supabase } from '@/integrations/supabase/client';

export const sendMFACode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Sending MFA code for:', email);
    
    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('Generated MFA token:', token);

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
      console.error('MFA token insert error:', insertError);
      return { success: false, error: 'Failed to generate MFA code' };
    }

    console.log(`MFA Code for ${email}: ${token}`);
    console.log('MFA token stored successfully in database');
    
    // TODO: In production, integrate with email service like Resend
    // await sendEmailWithMFACode(email, token);

    return { success: true };
  } catch (error) {
    console.error('MFA send error:', error);
    return { success: false, error: 'Failed to send MFA code' };
  }
};

export const verifyMFACode = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Verifying MFA code for:', email, 'with token:', token);
    
    const { data, error } = await supabase
      .from('mfa_tokens')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('MFA verification query result:', { data, error });

    if (error || !data) {
      console.error('MFA verification failed:', error);
      return { success: false, error: 'Invalid or expired MFA code' };
    }

    // Delete used token
    const { error: deleteError } = await supabase
      .from('mfa_tokens')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('Failed to delete used MFA token:', deleteError);
    }

    console.log('MFA verification successful');
    return { success: true };
  } catch (error) {
    console.error('MFA verify error:', error);
    return { success: false, error: 'Failed to verify MFA code' };
  }
};
