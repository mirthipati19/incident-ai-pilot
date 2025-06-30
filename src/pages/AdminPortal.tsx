
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Ticket, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  UserCheck,
  Bot,
  Zap,
  Target,
  LogOut,
  Shield,
  Activity,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalIncidents: number;
  openIncidents: number;
  resolvedToday: number;
  avgResolutionTime: number;
  aiSuccessRate: number;
  userSatisfaction: number;
  systemUptime: number;
}

interface UserTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  user_name: string;
  assignee: string | null;
  category: string;
}

const AdminPortal = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalIncidents: 0,
    openIncidents: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    aiSuccessRate: 0,
    userSatisfaction: 0,
    systemUptime: 99.8
  });
  
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Sample chart data
  const resolutionTrendData = [
    { month: 'Jan', resolved: 45, created: 50 },
    { month: 'Feb', resolved: 52, created: 48 },
    { month: 'Mar', resolved: 61, created: 55 },
    { month: 'Apr', resolved: 58, created: 52 },
    { month: 'May', resolved: 67, created: 60 },
    { month: 'Jun', resolved: 72, created: 65 }
  ];

  const categoryData = [
    { name: 'Technical', value: 35, color: '#3b82f6' },
    { name: 'Account', value: 25, color: '#10b981' },
    { name: 'Billing', value: 20, color: '#f59e0b' },
    { name: 'General', value: 20, color: '#ef4444' }
  ];

  const aiPerformanceData = [
    { time: '00:00', confidence: 92, satisfaction: 4.2 },
    { time: '04:00', confidence: 88, satisfaction: 4.1 },
    { time: '08:00', confidence: 95, satisfaction: 4.5 },
    { time: '12:00', confidence: 90, satisfaction: 4.3 },
    { time: '16:00', confidence: 93, satisfaction: 4.4 },
    { time: '20:00', confidence: 89, satisfaction: 4.2 }
  ];

  const priorityDistribution = [
    { priority: 'Critical', count: 5, color: '#dc2626' },
    { priority: 'High', count: 12, color: '#ea580c' },
    { priority: 'Medium', count: 28, color: '#ca8a04' },
    { priority: 'Low', count: 35, color: '#16a34a' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadUserTickets()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Load users count
    const { data: users } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    // Load incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('status, created_at, updated_at');

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
      aiSuccessRate,
      userSatisfaction: 4.2 + Math.random() * 0.6,
      systemUptime: 99.8
    });
  };

  const loadUserTickets = async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        id,
        title,
        status,
        priority,
        category,
        created_at,
        assignee,
        users!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(15);

    if (data) {
      const formattedTickets = data.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        created_at: ticket.created_at,
        user_name: (ticket.users as any)?.name || 'Unknown User',
        assignee: ticket.assignee
      }));
      setUserTickets(formattedTickets);
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                <p className="text-sm text-gray-600">Mouritech Support System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, Admin</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  <p className="text-blue-200 text-xs mt-1">+12% from last month</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Tickets</p>
                  <p className="text-3xl font-bold">{stats.totalIncidents}</p>
                  <p className="text-purple-200 text-xs mt-1">+8% from last month</p>
                </div>
                <Ticket className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">AI Success Rate</p>
                  <p className="text-3xl font-bold">{stats.aiSuccessRate}%</p>
                  <p className="text-green-200 text-xs mt-1">+5% from last week</p>
                </div>
                <Bot className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Resolution</p>
                  <p className="text-3xl font-bold">{stats.avgResolutionTime}min</p>
                  <p className="text-orange-200 text-xs mt-1">-3min from last week</p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.openIncidents}</p>
              <p className="text-sm text-gray-600">Open Tickets</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
              <p className="text-sm text-gray-600">Resolved Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <UserCheck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.userSatisfaction.toFixed(1)}</p>
              <p className="text-sm text-gray-600">User Satisfaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.systemUptime}%</p>
              <p className="text-sm text-gray-600">System Uptime</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Resolution Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={resolutionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="resolved" 
                        stackId="1"
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.7}
                        name="Resolved"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="created" 
                        stackId="2"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.7}
                        name="Created"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        {priorityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    AI Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={aiPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="AI Confidence %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="satisfaction" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        name="User Satisfaction"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Recent Tickets Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>User: {ticket.user_name}</span>
                          <span>Category: {ticket.category}</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                        {ticket.assignee && (
                          <p className="text-sm text-blue-600 mt-1">Assignee: {ticket.assignee}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-insights" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{stats.aiSuccessRate}%</div>
                    <p className="text-sm text-gray-600 mt-2">Successfully auto-resolved</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats.aiSuccessRate}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{stats.avgResolutionTime}min</div>
                    <p className="text-sm text-gray-600 mt-2">Average AI response</p>
                    <div className="text-xs text-green-600 mt-2">↓ 15% faster than human agents</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600">{stats.userSatisfaction.toFixed(1)}</div>
                    <p className="text-sm text-gray-600 mt-2">Average rating out of 5</p>
                    <div className="flex justify-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.floor(stats.userSatisfaction) ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Database Performance</span>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Model Accuracy</span>
                    <Badge className="bg-blue-100 text-blue-800">95.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>System Uptime</span>
                    <Badge className="bg-green-100 text-green-800">{stats.systemUptime}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Security Status</span>
                    <Badge className="bg-green-100 text-green-800">Secure</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Export Ticket Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Generate User Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Performance Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;
