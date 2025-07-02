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
    
    // Check if admin exists in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.warn('⚠️ Cannot list users with current permissions, trying alternative approach');
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

export const adminDirectLogin = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
  try {
    logAuthEvent('Attempting admin direct login', { email });
    
    if (!captchaToken) {
      return { success: false, error: 'Security verification required' };
    }
    
    // For hardcoded admin, allow direct login - FIXED: Use plain password
    if (email === authConfig.adminEmail && password === authConfig.adminPassword) {
      logAuthEvent('Admin credentials detected, processing login');
      
      // Ensure admin user exists in Supabase Auth
      await createAdminUserIfNeeded();
      
      // Sign in with Supabase using plain password (not encrypted)
      const signInOptions: any = {
        email,
        password, // Use the plain password directly
        options: { captchaToken }
      };

      // First check if user exists in auth
      const { data: session, error } = await supabase.auth.signInWithPassword(signInOptions);
      
      if (error) {
        // If user doesn't exist in auth, create it
        if (error.message.includes('Invalid login credentials')) {
          logAuthEvent('Creating admin user in Supabase Auth');
          const { data: newUser, error: createError } = await supabase.auth.signUp({
            email: authConfig.adminEmail,
            password: authConfig.adminPassword,
            options: { 
              captchaToken,
              emailRedirectTo: `${window.location.origin}/signin`
            }
          });
          
          if (createError) {
            console.error('❌ Failed to create admin in auth:', createError);
            return { success: false, error: 'Failed to create admin user' };
          }
          
          // Sign in after creation
          const { data: loginSession, error: loginError } = await supabase.auth.signInWithPassword(signInOptions);
          
          if (loginError || !loginSession.user) {
            return { success: false, error: loginError?.message || 'Admin login failed after creation' };
          }
          
          logAuthEvent('Admin login successful after creation', { userId: loginSession.user.id });
          return { success: true, isAdmin: true, userId: loginSession.user.id };
        }
        
        console.error('❌ Admin auth failed:', error);
        return { success: false, error: 'Invalid admin credentials' };
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
