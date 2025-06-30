
import { supabase } from '@/integrations/supabase/client';
import { getAuthConfig, ADMIN_CONFIG, DEV_HELPERS } from '@/config/authConfig';
import { sendMFACode, verifyMFACode } from './mfaService';

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresMFA?: boolean;
  isAdmin?: boolean;
  userId?: string;
  user?: any;
}

export class UnifiedAuthService {
  private config = getAuthConfig();

  async signUp(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      DEV_HELPERS.logAuthFlow('SIGNUP_ATTEMPT', { email, name });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/itsm`
        }
      });

      if (error) {
        DEV_HELPERS.logAuthFlow('SIGNUP_ERROR', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create user profile
        const userId = Math.floor(100000 + Math.random() * 100000).toString();
        
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            user_id: userId,
            name,
            email,
            password_hash: 'handled_by_supabase'
          });

        if (profileError) {
          DEV_HELPERS.logAuthFlow('PROFILE_CREATE_ERROR', profileError);
          return { success: false, error: 'Failed to create user profile' };
        }

        DEV_HELPERS.logAuthFlow('SIGNUP_SUCCESS', { userId: data.user.id });
        return { success: true, userId: data.user.id };
      }

      return { success: false, error: 'User creation failed' };
    } catch (error) {
      DEV_HELPERS.logAuthFlow('SIGNUP_EXCEPTION', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signIn(email: string, password: string, isAdmin = false, captchaToken?: string): Promise<AuthResult> {
    try {
      DEV_HELPERS.logAuthFlow('SIGNIN_ATTEMPT', { email, isAdmin, hasCaptcha: !!captchaToken });

      // Developer mode: Direct admin access
      if (this.config.developerMode && isAdmin && email === ADMIN_CONFIG.SUPER_ADMIN_EMAIL) {
        return this.handleDeveloperAdminLogin(email, password);
      }

      // Developer mode: Bypass captcha requirement
      if (this.config.bypassCaptcha && !captchaToken) {
        DEV_HELPERS.logAuthFlow('BYPASSING_CAPTCHA', 'Developer mode active');
      }

      // Admin login flow
      if (isAdmin) {
        return this.handleAdminLogin(email, password, captchaToken);
      }

      // Regular user login flow
      return this.handleRegularUserLogin(email, password, captchaToken);
    } catch (error) {
      DEV_HELPERS.logAuthFlow('SIGNIN_EXCEPTION', error);
      return { success: false, error: 'Sign in failed' };
    }
  }

  async verifyMFA(email: string, code: string, password: string, captchaToken?: string): Promise<AuthResult> {
    try {
      DEV_HELPERS.logAuthFlow('MFA_VERIFY_ATTEMPT', { email, code });

      // Developer mode: Accept any 6-digit code
      if (this.config.bypassMFA && /^\d{6}$/.test(code)) {
        DEV_HELPERS.logAuthFlow('MFA_BYPASSED', 'Developer mode - accepting any 6-digit code');
        return this.completeMFALogin(email, password, captchaToken);
      }

      // Verify MFA code
      const verifyResult = await verifyMFACode(email, code);
      
      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error || 'Invalid MFA code' };
      }

      return this.completeMFALogin(email, password, captchaToken);
    } catch (error) {
      DEV_HELPERS.logAuthFlow('MFA_VERIFY_EXCEPTION', error);
      return { success: false, error: 'MFA verification failed' };
    }
  }

  private async handleDeveloperAdminLogin(email: string, password: string): Promise<AuthResult> {
    try {
      // Ensure admin user exists
      await this.ensureAdminUserExists();
      
      // Direct Supabase auth
      const { data: session, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !session.user) {
        DEV_HELPERS.logAuthFlow('DEV_ADMIN_LOGIN_FAILED', error);
        return { success: false, error: error?.message || 'Admin login failed' };
      }

      DEV_HELPERS.logAuthFlow('DEV_ADMIN_LOGIN_SUCCESS', { userId: session.user.id });
      return { success: true, isAdmin: true, userId: session.user.id, user: session.user };
    } catch (error) {
      return { success: false, error: 'Developer admin login failed' };
    }
  }

  private async handleAdminLogin(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    // Super admin bypass in production
    if (email === ADMIN_CONFIG.SUPER_ADMIN_EMAIL && password === ADMIN_CONFIG.SUPER_ADMIN_PASSWORD) {
      await this.ensureAdminUserExists();
      
      const signInOptions: any = { email, password };
      if (captchaToken && !this.config.bypassCaptcha) {
        signInOptions.options = { captchaToken };
      }

      const { data: session, error } = await supabase.auth.signInWithPassword(signInOptions);
      
      if (error || !session.user) {
        return { success: false, error: error?.message || 'Admin authentication failed' };
      }

      return { success: true, isAdmin: true, userId: session.user.id, user: session.user };
    }

    return { success: false, error: 'Invalid admin credentials' };
  }

  private async handleRegularUserLogin(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    // Developer mode: Skip MFA
    if (this.config.bypassMFA) {
      const signInOptions: any = { email, password };
      if (captchaToken && !this.config.bypassCaptcha) {
        signInOptions.options = { captchaToken };
      }

      const { data: session, error } = await supabase.auth.signInWithPassword(signInOptions);
      
      if (error || !session.user) {
        return { success: false, error: error?.message || 'Login failed' };
      }

      DEV_HELPERS.logAuthFlow('DEV_USER_LOGIN_SUCCESS', { userId: session.user.id });
      return { success: true, isAdmin: false, userId: session.user.id, user: session.user };
    }

    // Production: Validate credentials and send MFA
    const signInOptions: any = { email, password };
    if (captchaToken) {
      signInOptions.options = { captchaToken };
    }

    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword(signInOptions);
    
    if (testError) {
      return { success: false, error: testError.message };
    }
    
    // Sign out immediately to prevent session creation
    await supabase.auth.signOut();
    
    // Send MFA code
    const mfaResult = await sendMFACode(email);
    
    if (!mfaResult.success) {
      return { success: false, error: mfaResult.error || 'Failed to send MFA code' };
    }
    
    return { success: true, requiresMFA: true };
  }

  private async completeMFALogin(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    const signInOptions: any = { email, password };
    if (captchaToken && !this.config.bypassCaptcha) {
      signInOptions.options = { captchaToken };
    }

    const { data, error } = await supabase.auth.signInWithPassword(signInOptions);

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Login failed' };
    }

    return { success: true, isAdmin: false, userId: data.user.id, user: data.user };
  }

  private async ensureAdminUserExists(): Promise<void> {
    try {
      // Check if admin exists in auth.users
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.warn('Failed to list users for admin check:', error);
        return;
      }
      
      const adminAuthUser = data?.users?.find((user: any) => user.email === ADMIN_CONFIG.SUPER_ADMIN_EMAIL);
      let adminUserId = adminAuthUser?.id;
      
      if (!adminAuthUser) {
        const { data: newAdmin, error: authError } = await supabase.auth.admin.createUser({
          email: ADMIN_CONFIG.SUPER_ADMIN_EMAIL,
          password: ADMIN_CONFIG.SUPER_ADMIN_PASSWORD,
          email_confirm: true
        });
        
        if (authError || !newAdmin.user) {
          console.error('Failed to create admin auth user:', authError);
          return;
        }
        
        adminUserId = newAdmin.user.id;
      }
      
      if (!adminUserId) return;
      
      // Ensure users record exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', ADMIN_CONFIG.SUPER_ADMIN_EMAIL)
        .single();
      
      if (!existingUser) {
        await supabase
          .from('users')
          .insert({
            id: adminUserId,
            user_id: ADMIN_CONFIG.DEFAULT_ADMIN_USER_ID,
            name: 'Admin User',
            email: ADMIN_CONFIG.SUPER_ADMIN_EMAIL,
            password_hash: 'handled_by_supabase'
          });
      }
      
      // Ensure admin_users record exists
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', adminUserId)
        .single();
      
      if (!existingAdmin) {
        await supabase
          .from('admin_users')
          .insert({
            user_id: adminUserId,
            role: 'admin',
            permissions: ['view_tickets', 'manage_users', 'view_stats', 'full_admin']
          });
      }
    } catch (error) {
      console.error('Error ensuring admin user exists:', error);
    }
  }
}

export const unifiedAuthService = new UnifiedAuthService();
