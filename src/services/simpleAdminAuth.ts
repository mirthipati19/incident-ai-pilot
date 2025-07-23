import { supabase } from '@/integrations/supabase/client';

export interface SimpleAdminUser {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  permissions: string[];
  is_email_verified: boolean;
  created_at: string;
  organizations?: {
    id: string;
    name: string;
    domain: string;
    logo_url?: string;
  };
}

export interface SimpleAdminSession {
  id: string;
  admin_user_id: string;
  session_token: string;
  expires_at: string;
  is_active: boolean;
}

class SimpleAdminAuthService {
  async register(organizationName: string, adminName: string, email: string, password: string) {
    try {
      const { data, error } = await supabase.functions.invoke('simple-admin-auth', {
        body: {
          action: 'register',
          organizationName,
          adminName,
          email,
          password
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.functions.invoke('simple-admin-auth', {
        body: {
          action: 'login',
          email,
          password
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Store session token
      localStorage.setItem('simple_admin_session', data.session.session_token);
      localStorage.setItem('simple_admin_user', JSON.stringify(data.user));

      return {
        success: true,
        user: data.user as SimpleAdminUser,
        session: data.session as SimpleAdminSession
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getOrganizationByEmail(email: string) {
    try {
      const { data, error } = await supabase.functions.invoke('simple-admin-auth', {
        body: {
          action: 'getOrganization',
          email
        }
      });

      if (error) throw error;
      return data.organization;
    } catch (error) {
      return null;
    }
  }

  logout() {
    localStorage.removeItem('simple_admin_session');
    localStorage.removeItem('simple_admin_user');
  }

  getCurrentUser(): SimpleAdminUser | null {
    const userStr = localStorage.getItem('simple_admin_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    const session = localStorage.getItem('simple_admin_session');
    const user = this.getCurrentUser();
    return !!(session && user);
  }
}

export const simpleAdminAuth = new SimpleAdminAuthService();