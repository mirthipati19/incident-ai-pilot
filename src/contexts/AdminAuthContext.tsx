
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { newAdminAuthService, AdminUser, Organization } from '@/services/newAdminAuthService';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getOrganizationByEmail: (email: string) => Promise<Organization | null>;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (sessionToken) {
        try {
          const user = await newAdminAuthService.validateSession(sessionToken);
          if (user) {
            setAdminUser(user);
            setOrganization(user.organization);
          } else {
            localStorage.removeItem('admin_session_token');
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('admin_session_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user, session } = await newAdminAuthService.loginAdmin(email, password);
      
      setAdminUser(user);
      setOrganization(user.organizations);
      localStorage.setItem('admin_session_token', session.session_token);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem('admin_session_token');
    if (sessionToken) {
      await newAdminAuthService.logoutAdmin(sessionToken);
      localStorage.removeItem('admin_session_token');
    }
    setAdminUser(null);
    setOrganization(null);
  };

  const getOrganizationByEmail = async (email: string) => {
    return await newAdminAuthService.getOrganizationByEmail(email);
  };

  return (
    <AdminAuthContext.Provider value={{
      adminUser,
      organization,
      loading,
      login,
      logout,
      getOrganizationByEmail,
      isAuthenticated: !!adminUser
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
