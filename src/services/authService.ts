
import { supabase } from '@/integrations/supabase/client';
import { sendMFACode, verifyMFACode } from './mfaService';

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresMFA?: boolean;
  isAdmin?: boolean;
  userId?: string;
}

// Hardcoded admin for development - bypass complex auth flow
const ADMIN_EMAIL = 'murari.mirthipati@authexa.me';
const ADMIN_PASSWORD = 'Qwertyuiop@0987654321';

export const createAdminUserIfNeeded = async () => {
  try {
    console.log('🔧 Checking/creating admin user...');
    
    // Check if admin exists in auth.users
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError);
      return false;
    }
    
    const adminAuthUser = data?.users?.find((user: any) => user.email === ADMIN_EMAIL);
    
    let adminUserId = adminAuthUser?.id;
    
    if (!adminAuthUser) {
      console.log('🆕 Creating admin auth user...');
      const { data: newAdmin, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true
      });
      
      if (authError || !newAdmin.user) {
        console.error('❌ Failed to create admin auth user:', authError);
        return false;
      }
      
      adminUserId = newAdmin.user.id;
    }
    
    if (!adminUserId) return false;
    
    // Check if admin exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (!existingUser) {
      console.log('🆕 Creating admin user record...');
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: adminUserId,
          user_id: '000001', // Special admin user ID
          name: 'Admin User',
          email: ADMIN_EMAIL,
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
      console.log('🆕 Creating admin_users record...');
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
    
    console.log('✅ Admin user setup completed');
    return true;
  } catch (error) {
    console.error('💥 Error setting up admin user:', error);
    return false;
  }
};

export const adminDirectLogin = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('🔐 Attempting admin direct login...');
    
    // For development, allow direct admin login without MFA
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('🎯 Admin credentials detected, bypassing MFA...');
      
      // Ensure admin user exists
      await createAdminUserIfNeeded();
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Admin auth failed:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No user data received' };
      }

      console.log('✅ Admin login successful');
      return { success: true, isAdmin: true };
    }
    
    return { success: false, error: 'Invalid admin credentials' };
  } catch (error) {
    console.error('💥 Admin login error:', error);
    return { success: false, error: 'Admin login failed' };
  }
};

export const regularUserLogin = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('🔐 Regular user login with MFA...');
    
    // First, validate credentials by attempting to sign in
    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (testError) {
      console.error('❌ Credential validation failed:', testError);
      return { success: false, error: testError.message };
    }
    
    // Immediately sign out to prevent session creation
    await supabase.auth.signOut();
    
    // Send MFA code
    console.log('📧 Sending MFA code...');
    const mfaResult = await sendMFACode(email);
    
    if (!mfaResult.success) {
      console.error('❌ MFA send failed:', mfaResult.error);
      return { success: false, error: mfaResult.error || 'Failed to send MFA code' };
    }
    
    console.log('✅ MFA code sent, user needs to verify');
    return { success: true, requiresMFA: true };
  } catch (error) {
    console.error('💥 Regular login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

export const completeMFALogin = async (email: string, password: string, mfaCode: string): Promise<AuthResult> => {
  try {
    console.log('🔓 Completing MFA login...');
    
    // Verify MFA code
    const verifyResult = await verifyMFACode(email, mfaCode);
    
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error || 'Invalid MFA code' };
    }
    
    // Complete login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Login failed' };
    }

    console.log('✅ MFA login completed successfully');
    return { success: true, isAdmin: false };
  } catch (error) {
    console.error('💥 MFA completion error:', error);
    return { success: false, error: 'MFA verification failed' };
  }
};
