import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Ticket, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Bot,
  UserCheck,
  Zap,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalIncidents: number;
  openIncidents: number;
  resolvedToday: number;
  avgResolutionTime: number;
  aiSuccessRate: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalIncidents: 0,
    openIncidents: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    aiSuccessRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useImprovedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load users count
      const { data: users } = await supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Load incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*');

      const today = new Date().toDateString();
      const openIncidents = incidents?.filter(i => i.status === 'Open').length || 0;
      const resolvedToday = incidents?.filter(i => 
        i.status === 'Resolved' && 
        new Date(i.created_at).toDateString() === today
      ).length || 0;

      // Calculate AI success rate (mock calculation)
      const aiSuccessRate = Math.round(85 + Math.random() * 10);
      
      setStats({
        totalUsers: users?.length || 0,
        totalIncidents: incidents?.length || 0,
        openIncidents,
        resolvedToday,
        avgResolutionTime: Math.round(15 + Math.random() * 20),
        aiSuccessRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-lg text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300 text-lg">Complete IT Service Management Overview</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-4 py-2 border-white/20 text-white bg-white/5">
              Admin: {user?.email}
            </Badge>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-300">Active registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <Ticket className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIncidents}</div>
              <p className="text-xs text-gray-300">All time incidents</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stats.openIncidents}</div>
              <p className="text-xs text-gray-300">Requiring attention</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.resolvedToday}</div>
              <p className="text-xs text-gray-300">Issues closed today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResolutionTime}min</div>
              <p className="text-xs text-gray-300">Average response time</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Success Rate</CardTitle>
              <Bot className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.aiSuccessRate}%</div>
              <p className="text-xs text-gray-300">Automated resolutions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300 cursor-pointer group" 
            onClick={() => navigate('/knowledge-base')}
          >
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Bot className="w-8 h-8 mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-white">Knowledge Base</p>
                <p className="text-sm text-gray-300">Manage articles & FAQ</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300 cursor-pointer group" 
            onClick={() => navigate('/service-catalog')}
          >
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-white">Service Catalog</p>
                <p className="text-sm text-gray-300">Define service offerings</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300 cursor-pointer group" 
            onClick={() => navigate('/admin/users')}
          >
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-white">User Management</p>
                <p className="text-sm text-gray-300">Manage user access</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300 cursor-pointer group">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-400 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-white">Analytics</p>
                <p className="text-sm text-gray-300">Performance metrics</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-xl text-white">Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <p className="font-medium text-white">Incident #12345 resolved automatically</p>
                  <p className="text-sm text-gray-300">AI resolved password reset issue - 2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium text-white">New user registered</p>
                  <p className="text-sm text-gray-300">john.doe@company.com joined the platform - 5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div className="flex-1">
                  <p className="font-medium text-white">High priority incident created</p>
                  <p className="text-sm text-gray-300">Network connectivity issue reported - 8 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;