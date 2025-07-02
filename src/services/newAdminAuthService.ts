
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  organization?: Organization;
}

export interface AdminSession {
  id: string;
  admin_user_id: string;
  session_token: string;
  expires_at: string;
  is_active: boolean;
}

export interface UserInvitation {
  id: string;
  email: string;
  organization_id: string;
  invited_by: string;
  invitation_token: string;
  expires_at: string;
  is_used: boolean;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: number;
  require_lowercase: number;
  require_numbers: number;
  require_special: number;
}

class NewAdminAuthService {
  // Password validation
  async validatePasswordStrength(password: string, orgId?: string): Promise<{ valid: boolean; message?: string }> {
    const { data: policy } = await supabase
      .from('password_policies')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    const defaultPolicy = {
      min_length: 12,
      require_uppercase: 1,
      require_lowercase: 1,
      require_numbers: 4,
      require_special: 1
    };

    const activePolicy = policy || defaultPolicy;

    if (password.length < activePolicy.min_length) {
      return { valid: false, message: `Password must be at least ${activePolicy.min_length} characters long` };
    }

    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    const specialCount = (password.match(/[^A-Za-z0-9]/g) || []).length;

    if (uppercaseCount < activePolicy.require_uppercase) {
      return { valid: false, message: `Password must contain at least ${activePolicy.require_uppercase} uppercase letter(s)` };
    }

    if (lowercaseCount < activePolicy.require_lowercase) {
      return { valid: false, message: `Password must contain at least ${activePolicy.require_lowercase} lowercase letter(s)` };
    }

    if (numberCount < activePolicy.require_numbers) {
      return { valid: false, message: `Password must contain at least ${activePolicy.require_numbers} number(s)` };
    }

    if (specialCount < activePolicy.require_special) {
      return { valid: false, message: `Password must contain at least ${activePolicy.require_special} special character(s)` };
    }

    return { valid: true };
  }

  // Organization management
  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data;
  }

  async getOrganizationByEmail(email: string): Promise<Organization | null> {
    const domain = email.split('@')[1];
    return this.getOrganizationByDomain(domain);
  }

  async createOrganization(name: string, domain: string, logoUrl?: string): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        domain,
        logo_url: logoUrl,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Admin user management
  async registerAdminUser(userData: {
    email: string;
    password: string;
    name: string;
    organizationId: string;
  }): Promise<AdminUser> {
    // Validate password
    const passwordValidation = await this.validatePasswordStrength(userData.password, userData.organizationId);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    const { data, error } = await supabase
      .from('admin_users_new')
      .insert({
        email: userData.email,
        password_hash: passwordHash,
        name: userData.name,
        organization_id: userData.organizationId,
        role: 'admin',
        is_active: true
      })
      .select(`
        *,
        organizations (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async loginAdmin(email: string, password: string): Promise<{ user: AdminUser; session: AdminSession }> {
    // Get admin user with organization
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users_new')
      .select(`
        *,
        organizations (*)
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !adminUser) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Create session
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Update last login
    await supabase
      .from('admin_users_new')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id);

    return { user: adminUser, session };
  }

  async validateSession(sessionToken: string): Promise<AdminUser | null> {
    const { data: session } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_users_new (
          *,
          organizations (*)
        )
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    return session?.admin_users_new || null;
  }

  async logoutAdmin(sessionToken: string): Promise<void> {
    await supabase
      .from('admin_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
  }

  // User invitation system
  async inviteUser(email: string, organizationId: string, invitedBy: string): Promise<UserInvitation> {
    // Generate invitation token
    const invitationToken = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept

    const { data, error } = await supabase
      .from('user_invitations')
      .insert({
        email,
        organization_id: organizationId,
        invited_by: invitedBy,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createUserAndSendCredentials(userData: {
    email: string;
    name: string;
    organizationId: string;
    createdBy: string;
  }): Promise<{ user: AdminUser; tempPassword: string }> {
    // Generate secure temporary password
    const tempPassword = this.generateSecurePassword();

    // Validate password against policy
    const passwordValidation = await this.validatePasswordStrength(tempPassword, userData.organizationId);
    if (!passwordValidation.valid) {
      throw new Error('Generated password does not meet policy requirements');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const { data: user, error } = await supabase
      .from('admin_users_new')
      .insert({
        email: userData.email,
        password_hash: passwordHash,
        name: userData.name,
        organization_id: userData.organizationId,
        created_by: userData.createdBy,
        role: 'user',
        permissions: ['view_tickets'],
        is_active: true
      })
      .select(`
        *,
        organizations (*)
      `)
      .single();

    if (error) throw error;

    return { user, tempPassword };
  }

  // Utility methods
  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateSecurePassword(): string {
    const length = 16;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    let password = '';
    
    // Ensure minimum requirements
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    
    // Add 4 numbers as required
    for (let i = 0; i < 4; i++) {
      password += numbers[Math.floor(Math.random() * numbers.length)];
    }
    
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining length
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export const newAdminAuthService = new NewAdminAuthService();
