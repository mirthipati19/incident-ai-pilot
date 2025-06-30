
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useImprovedAuth();

  console.log('🔍 AdminRoute - User:', user?.email, 'IsAdmin:', user?.isAdmin, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ AdminRoute - No user, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  if (!user.isAdmin) {
    console.log('❌ AdminRoute - User not admin, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  console.log('✅ AdminRoute - Admin access granted');
  return <>{children}</>;
};

export default AdminRoute;
