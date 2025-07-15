
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useImprovedAuth();
  
  // Enable session timeout for protected routes
  useSessionTimeout(30); // 30 minutes timeout

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
