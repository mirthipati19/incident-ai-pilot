
import { supabase } from '@/integrations/supabase/client';

export const sendMFACode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending MFA code for:', email);
    
    // Generate 6-digit OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔑 Generated MFA token:', token);
    console.log('⏰ Token expires at:', expiresAt);

    // Delete any existing tokens for this email
    const { error: deleteError } = await supabase
      .from('mfa_tokens')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.warn('⚠️ Failed to delete existing tokens:', deleteError);
    } else {
      console.log('🗑️ Cleaned up existing tokens');
    }

    // Store new token in database
    const { error: insertError } = await supabase
      .from('mfa_tokens')
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('❌ MFA token insert error:', insertError);
      return { success: false, error: 'Failed to generate MFA code' };
    }

    console.log('✅ MFA token stored successfully in database');
    
    // Send email via edge function in production, log in development
    if (import.meta.env.DEV) {
      console.log(`📬 [Dev Mode] MFA OTP for ${email}: ${token}`);
      console.log('💡 In production, this would be sent via email service');
      return { success: true };
    } else {
      // Call edge function to send email
      const { data, error: emailError } = await supabase.functions.invoke('send-mfa-email', {
        body: { email, code: token }
      });

      if (emailError) {
        console.error('❌ Failed to send MFA email:', emailError);
        return { success: false, error: 'Failed to send MFA code via email' };
      }

      if (!data?.success) {
        console.error('❌ Email service returned error:', data?.error);
        return { success: false, error: data?.error || 'Failed to send MFA code' };
      }

      console.log('✅ MFA email sent successfully');
      return { success: true };
    }
  } catch (error) {
    console.error('💥 MFA send error:', error);
    return { success: false, error: 'Failed to send MFA code' };
  }
};

export const verifyMFACode = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔍 MFA VERIFICATION ATTEMPT:', { email, token });
    
    // First try the bypass RLS function for secure verification
    try {
      const { data: bypassData, error: bypassError } = await supabase
        .rpc('verify_mfa_token_bypass', { 
          email_arg: email, 
          token_arg: token 
        });

      console.log('🔐 Bypass RLS result:', { 
        foundToken: !!bypassData?.[0], 
        error: bypassError?.message || 'none' 
      });

      if (!bypassError && bypassData && bypassData.length > 0) {
        const tokenData = bypassData[0];
        console.log('✅ Token found via bypass:', tokenData.token, 'Exp:', tokenData.expires_at);
        
        // Delete used token
        await supabase
          .from('mfa_tokens')
          .delete()
          .eq('id', tokenData.id);
        
        console.log('✅ MFA verification successful via bypass');
        return { success: true };
      }
    } catch (bypassError) {
      console.warn('⚠️ Bypass RLS failed, falling back to direct query:', bypassError);
    }
    
    // Fallback to direct query
    const { data, error } = await supabase
      .from('mfa_tokens')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('📊 Direct MFA verification query result:', { 
      foundToken: !!data, 
      error: error?.message || 'none',
      tokenExpiry: data?.expires_at 
    });

    if (error || !data) {
      console.error('❌ MFA verification failed:', error);
      
      // Check if token exists but is expired
      const { data: expiredToken } = await supabase
        .from('mfa_tokens')
        .select('*')
        .eq('email', email)
        .eq('token', token)
        .single();

      if (expiredToken) {
        console.log('⏰ Token found but expired');
        return { success: false, error: 'MFA code has expired. Please request a new one.' };
      }

      return { success: false, error: 'Invalid MFA code. Please check and try again.' };
    }

    // Delete used token
    const { error: deleteError } = await supabase
      .from('mfa_tokens')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('⚠️ Failed to delete used MFA token:', deleteError);
    } else {
      console.log('🗑️ Used MFA token deleted successfully');
    }

    console.log('✅ MFA verification successful');
    return { success: true };
  } catch (error) {
    console.error('💥 MFA verify error:', error);
    return { success: false, error: 'Failed to verify MFA code' };
  }
};
