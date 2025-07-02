
import { supabase } from '@/integrations/supabase/client';

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
    const defaultPolicy = {
      min_length: 12,
      require_uppercase: 1,
      require_lowercase: 1,
      require_numbers: 4,
      require_special: 1
    };

    if (password.length < defaultPolicy.min_length) {
      return { valid: false, message: `Password must be at least ${defaultPolicy.min_length} characters long` };
    }

    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    const specialCount = (password.match(/[^A-Za-z0-9]/g) || []).length;

    if (uppercaseCount < defaultPolicy.require_uppercase) {
      return { valid: false, message: `Password must contain at least ${defaultPolicy.require_uppercase} uppercase letter(s)` };
    }

    if (lowercaseCount < defaultPolicy.require_lowercase) {
      return { valid: false, message: `Password must contain at least ${defaultPolicy.require_lowercase} lowercase letter(s)` };
    }

    if (numberCount < defaultPolicy.require_numbers) {
      return { valid: false, message: `Password must contain at least ${defaultPolicy.require_numbers} number(s)` };
    }

    if (specialCount < defaultPolicy.require_special) {
      return { valid: false, message: `Password must contain at least ${defaultPolicy.require_special} special character(s)` };
    }

    return { valid: true };
  }

  // Organization management
  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth-functions', {
        body: { action: 'getOrganizationByDomain', domain }
      });

      if (error || !data?.data) return null;
      return data.data;
    } catch {
      return null;
    }
  }

  async getOrganizationByEmail(email: string): Promise<Organization | null> {
    const domain = email.split('@')[1];
    return this.getOrganizationByDomain(domain);
  }

  async createOrganization(name: string, domain: string, logoUrl?: string): Promise<Organization> {
    const { data, error } = await supabase.functions.invoke('admin-auth-functions', {
      body: { action: 'createOrganization', name, domain, logoUrl }
    });

    if (error) throw error;
    return data.data;
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

    // For now, return a mock response
    return {
      id: 'mock-id',
      email: userData.email,
      name: userData.name,
      organization_id: userData.organizationId,
      role: 'admin',
      permissions: ['view_tickets', 'manage_users', 'view_stats', 'full_admin'],
      is_active: true,
      created_at: new Date().toISOString()
    };
  }

  async loginAdmin(email: string, password: string): Promise<{ user: AdminUser; session: AdminSession }> {
    const { data, error } = await supabase.functions.invoke('admin-auth-functions', {
      body: { action: 'loginAdmin', email, password }
    });

    if (error || !data?.data) {
      throw new Error('Invalid credentials');
    }

    return data.data;
  }

  async validateSession(sessionToken: string): Promise<AdminUser | null> {
    // For now, return null to force re-login
    return null;
  }

  async logoutAdmin(sessionToken: string): Promise<void> {
    // Implementation would go here
  }

  // User invitation system
  async inviteUser(email: string, organizationId: string, invitedBy: string): Promise<UserInvitation> {
    const invitationToken = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      id: 'mock-invitation-id',
      email,
      organization_id: organizationId,
      invited_by: invitedBy,
      invitation_token: invitationToken,
      expires_at: expiresAt.toISOString(),
      is_used: false
    };
  }

  async createUserAndSendCredentials(userData: {
    email: string;
    name: string;
    organizationId: string;
    createdBy: string;
  }): Promise<{ user: AdminUser; tempPassword: string }> {
    const tempPassword = this.generateSecurePassword();

    // Validate password against policy
    const passwordValidation = await this.validatePasswordStrength(tempPassword, userData.organizationId);
    if (!passwordValidation.valid) {
      throw new Error('Generated password does not meet policy requirements');
    }

    const user: AdminUser = {
      id: 'mock-user-id',
      email: userData.email,
      name: userData.name,
      organization_id: userData.organizationId,
      role: 'user',
      permissions: ['view_tickets'],
      is_active: true,
      created_at: new Date().toISOString()
    };

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
