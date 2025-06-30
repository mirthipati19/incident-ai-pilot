
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useImprovedAuth();
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log('🔒 AdminRoute:', info);
    setDebugInfo(prev => [...prev.slice(-3), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user) {
        addDebugInfo('No user found');
        setIsAdminVerified(false);
        return;
      }

      addDebugInfo(`Verifying admin status for: ${user.email}`);

      // Check if user is the specific admin email
      const isAdminEmail = user.email === 'murari.mirthipati@authexa.me';
      
      if (isAdminEmail) {
        addDebugInfo('Admin email verified - granting access');
        setIsAdminVerified(true);
        return;
      }

      // Check if user has isAdmin property (from improved auth context)
      if (user.isAdmin) {
        addDebugInfo('User has admin flag - granting access');
        setIsAdminVerified(true);
        return;
      }

      // Double-check in admin_users table for other potential admins
      try {
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        addDebugInfo(`Database admin check: ${adminData ? 'found' : 'not found'}`);

        if (adminData && adminData.role === 'admin') {
          setIsAdminVerified(true);
          addDebugInfo('Admin status verified via database');
        } else {
          addDebugInfo('User is not admin - access denied');
          setIsAdminVerified(false);
        }
      } catch (error) {
        addDebugInfo(`Admin verification failed: ${error}`);
        setIsAdminVerified(false);
      }
    };

    if (!loading) {
      verifyAdminStatus();
    }
  }, [user, loading]);

  if (loading || isAdminVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/50">
          <CardContent className="text-center p-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <h3 className="text-white font-medium mb-2">Verifying Admin Access</h3>
            <p className="text-slate-300 text-sm">Please wait while we verify your permissions...</p>
            
            {debugInfo.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs text-orange-400 mb-2">Debug Info:</p>
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-xs text-slate-400 font-mono bg-slate-900/50 p-1 rounded">
                    {info}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    addDebugInfo('No user found, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  if (!isAdminVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-600/20 backdrop-blur-sm rounded-full border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <CardTitle className="text-xl text-white">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-300">
              Admin privileges are required to access this area.
            </p>
            <p className="text-sm text-slate-400">
              User: {user.email}
            </p>
            
            {debugInfo.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-orange-400">Debug Information:</p>
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-xs text-slate-400 font-mono bg-slate-900/50 p-1 rounded">
                    {info}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 justify-center pt-4">
              <Button 
                onClick={() => window.location.href = '/itsm'}
                variant="outline"
                className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50"
              >
                Go to ITSM
              </Button>
              <Button 
                onClick={() => window.location.href = '/signin'}
                variant="outline"
                className="bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50"
              >
                Sign In Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  addDebugInfo('Admin access granted - rendering admin portal');
  return <>{children}</>;
};

export default AdminRoute;
