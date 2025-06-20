
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user) {
        setIsAdminVerified(false);
        return;
      }

      console.log('Verifying admin status for user:', user.email);

      // Check if user is the specific admin email
      const isAdminEmail = user.email === 'Murari.mirthipati@authexa.me';
      
      if (isAdminEmail) {
        // Double-check in admin_users table
        try {
          const { data: adminData, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (error && !error.message.includes('No rows')) {
            console.error('Admin verification error:', error);
          }

          // Admin is verified if they have the right email (with or without DB entry)
          setIsAdminVerified(true);
          console.log('Admin status verified:', true);
        } catch (error) {
          console.error('Admin verification failed:', error);
          setIsAdminVerified(true); // Still allow if email matches
        }
      } else {
        setIsAdminVerified(false);
      }
    };

    if (!loading) {
      verifyAdminStatus();
    }
  }, [user, loading]);

  if (loading || isAdminVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  if (!isAdminVerified) {
    console.log('User is not admin, redirecting to ITSM');
    return <Navigate to="/itsm" replace />;
  }

  console.log('Admin access granted, rendering admin portal');
  return <>{children}</>;
};

export default AdminRoute;
