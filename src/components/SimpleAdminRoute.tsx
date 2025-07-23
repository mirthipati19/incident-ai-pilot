import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAdminAuth } from '@/contexts/SimpleAdminAuthContext';
import { Loader2 } from 'lucide-react';

interface SimpleAdminRouteProps {
  children: React.ReactNode;
}

const SimpleAdminRoute = ({ children }: SimpleAdminRouteProps) => {
  const { user, loading } = useSimpleAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/simple-admin-login" replace />;
  }

  return <>{children}</>;
};

export default SimpleAdminRoute;