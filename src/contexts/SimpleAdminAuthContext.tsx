import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { simpleAdminAuth, SimpleAdminUser } from '@/services/simpleAdminAuth';

interface SimpleAdminAuthContextType {
  user: SimpleAdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (organizationName: string, adminName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getOrganizationByEmail: (email: string) => Promise<any>;
  isAuthenticated: boolean;
}

const SimpleAdminAuthContext = createContext<SimpleAdminAuthContextType | undefined>(undefined);

export const useSimpleAdminAuth = () => {
  const context = useContext(SimpleAdminAuthContext);
  if (!context) {
    throw new Error('useSimpleAdminAuth must be used within SimpleAdminAuthProvider');
  }
  return context;
};

export const SimpleAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SimpleAdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const currentUser = simpleAdminAuth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await simpleAdminAuth.login(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async (organizationName: string, adminName: string, email: string, password: string) => {
    setLoading(true);
    try {
      return await simpleAdminAuth.register(organizationName, adminName, email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    simpleAdminAuth.logout();
    setUser(null);
  };

  const getOrganizationByEmail = async (email: string) => {
    return await simpleAdminAuth.getOrganizationByEmail(email);
  };

  return (
    <SimpleAdminAuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      getOrganizationByEmail,
      isAuthenticated: !!user
    }}>
      {children}
    </SimpleAdminAuthContext.Provider>
  );
};