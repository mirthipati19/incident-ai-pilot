
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
    
    // Check if admin exists in auth.users using service role
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.warn('⚠️ Cannot list users with current permissions, trying alternative approach');
      // Alternative: Check if we can sign in as admin
      return await verifyAdminExists();
    }
    
    const adminAuthUser = users?.find((user: any) => user.email === authConfig.adminEmail);
    
    let adminUserId = adminAuthUser?.id;
    
    if (!adminAuthUser) {
      logAuthEvent('Creating admin auth user');
      const { data: newAdmin, error: authError } = await supabase.auth.admin.createUser({
        email: authConfig.adminEmail,
        password: authConfig.adminPassword,
        email_confirm: true
      });
      
      if (authError) {
        console.warn('⚠️ Cannot create admin user with current permissions:', authError);
        return await verifyAdminExists();
      }
      
      if (!newAdmin.user) {
        return false;
      }
      
      adminUserId = newAdmin.user.id;
    }
    
    if (!adminUserId) return false;
    
    // Check if admin exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', authConfig.adminEmail)
      .single();
    
    if (!existingUser) {
      logAuthEvent('Creating admin user record');
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: adminUserId,
          user_id: authConfig.adminUserId,
          name: 'Admin User',
          email: authConfig.adminEmail,
          password_hash: 'handled_by_supabase'
        });
      
      if (userError) {
        console.error('❌ Failed to create admin user record:', userError);
      }
    }
    
    // Ensure admin_users record exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', adminUserId)
      .single();
    
    if (!existingAdmin) {
      logAuthEvent('Creating admin_users record');
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          user_id: adminUserId,
          role: 'admin',
          permissions: ['view_tickets', 'manage_users', 'view_stats', 'full_admin']
        });
      
      if (adminError) {
        console.error('❌ Failed to create admin_users record:', adminError);
      }
    }
    
    logAuthEvent('Admin user setup completed');
    return true;
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
      // Admin exists, sign out immediately
      await supabase.auth.signOut();
      logAuthEvent('Admin user verified via authentication test');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Admin verification failed:', error);
    return false;
  }
};

export const adminDirectLogin = async (
  email: string,
  password: string,
  captchaToken?: string
): Promise<AuthResult> => {
  try {
    // 🔍 DEBUG: Log when function is invoked
    logAuthEvent('Attempting admin direct login', { email });

    // 🔍 DEBUG: Check for missing CAPTCHA
    if (!captchaToken) {
      console.warn('❌ Missing CAPTCHA token');
      return { success: false, error: 'Security verification required' };
    }

    // 🔍 DEBUG: Log the input values (email, password, captchaToken)
    console.log('🔐 Incoming admin login values:', { email, password, captchaToken });

    // 🔍 DEBUG: Match hardcoded admin credentials
    if (email === authConfig.adminEmail && password === authConfig.adminPassword) {
      logAuthEvent('Admin credentials detected, processing login');

      // 🔍 DEBUG: Ensure admin user is provisioned
      const adminSetup = await createAdminUserIfNeeded();
      if (!adminSetup) {
        console.warn('⚠️ Admin setup check completed, attempting login anyway');
      }

      // 🔍 DEBUG: Prepare sign-in options
      const signInOptions: any = {
        email,
        password,
        options: { captchaToken }
      };

      // 🔍 DEBUG: Log the actual sign-in attempt
      console.log('🚀 Attempting Supabase signInWithPassword with:', signInOptions);

      const { data: session, error } = await supabase.auth.signInWithPassword(signInOptions);

      // 🔍 DEBUG: Log Supabase response
      console.log('📥 Supabase sign-in response:', { session, error });

      // 🔍 DEBUG: Log auth event result
      logAuthEvent('Admin sign-in session result', {
        success: !!session?.session,
        error: error?.message || 'none'
      });

      if (error) {
        console.error('❌ Admin auth failed:', error);
        return { success: false, error: error.message };
      }

      // 🔍 DEBUG: Handle case where no user is returned even if session exists
      if (!session.user) {
        console.warn('⚠️ Admin sign-in succeeded but no user returned');
        return { success: false, error: 'No user data received' };
      }

      // 🔍 DEBUG: Log success with user ID
      logAuthEvent('Admin login successful', { userId: session.user.id });
      return { success: true, isAdmin: true, userId: session.user.id };
    }

    // 🔍 DEBUG: If credentials don’t match hardcoded admin
    console.warn('❌ Provided admin credentials do not match configured admin');
    return { success: false, error: 'Invalid admin credentials' };
  } catch (error) {
    // 🔍 DEBUG: Catch and log any unexpected errors
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
    
    // Require captcha token
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
