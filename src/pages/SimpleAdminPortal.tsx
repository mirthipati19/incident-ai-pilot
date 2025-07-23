import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Settings, LogOut, BarChart3 } from 'lucide-react';
import { useSimpleAdminAuth } from '@/contexts/SimpleAdminAuthContext';

const SimpleAdminPortal = () => {
  const { user, logout } = useSimpleAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/simple-admin-login');
  };

  if (!user) {
    navigate('/simple-admin-login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
              <p className="text-blue-200">{user.organizations?.name || 'Organization'}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Welcome Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome Back!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You're successfully logged into the {user.organizations?.name} admin portal.
              Your role: {user.role}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user.permissions.map((permission) => (
                <span
                  key={permission}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                >
                  {permission}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Total active users</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Open support tickets</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">✓</div>
              <p className="text-xs text-muted-foreground">System configured</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span>View Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Settings className="w-6 h-6" />
              <span>System Settings</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Building2 className="w-6 h-6" />
              <span>Organization</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminPortal;