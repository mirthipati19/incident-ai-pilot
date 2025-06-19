
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  Target
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
  Area,
  AreaChart
} from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalIncidents: number;
  openIncidents: number;
  resolvedToday: number;
  avgResolutionTime: number;
  aiResolutionRate: number;
}

interface UserTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  user_name: string;
  assignee: string | null;
}

interface AIStats {
  totalResolutions: number;
  autoResolved: number;
  escalated: number;
  avgConfidenceScore: number;
  avgSatisfactionScore: number;
}

interface ChartData {
  resolutionTimeData: Array<{ name: string; aiTime: number; humanTime: number }>;
  satisfactionData: Array<{ name: string; value: number; color: string }>;
  confidenceData: Array<{ time: string; confidence: number; satisfaction: number }>;
  aiPerformanceData: Array<{ method: string; count: number; avgTime: number; satisfaction: number }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalIncidents: 0,
    openIncidents: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    aiResolutionRate: 0
  });
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [aiStats, setAIStats] = useState<AIStats>({
    totalResolutions: 0,
    autoResolved: 0,
    escalated: 0,
    avgConfidenceScore: 0,
    avgSatisfactionScore: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    resolutionTimeData: [],
    satisfactionData: [],
    confidenceData: [],
    aiPerformanceData: []
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      checkAdminAccess();
    }
  }, [user?.id]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role, permissions')
        .eq('user_id', user?.id)
        .single();

      if (error || !data) {
        toast({
          title: "Access Denied",
          description: "You don't have admin access to this dashboard.",
          variant: "destructive"
        });
        return;
      }

      setIsAdmin(true);
      loadDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive"
      });
    }
  };

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadGeneralStats(),
        loadUserTickets(),
        loadAIStats(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralStats = async () => {
    const { data: incidents } = await supabase
      .from('incidents')
      .select('status, created_at, updated_at');

    const { data: users } = await supabase
      .from('users')
      .select('id');

    const { data: aiResolutions } = await supabase
      .from('ai_resolution_stats')
      .select('resolution_method, resolution_time_minutes');

    const today = new Date().toDateString();
    const openIncidents = incidents?.filter(i => i.status === 'Open').length || 0;
    const resolvedToday = incidents?.filter(i => 
      i.status === 'Resolved' && 
      new Date(i.created_at).toDateString() === today
    ).length || 0;

    const totalResolutions = aiResolutions?.length || 0;
    const autoResolved = aiResolutions?.filter(r => r.resolution_method === 'auto').length || 0;
    const aiResolutionRate = totalResolutions > 0 ? Math.round((autoResolved / totalResolutions) * 100) : 0;

    const avgResolutionTime = aiResolutions?.reduce((acc, r) => acc + (r.resolution_time_minutes || 0), 0) / totalResolutions || 0;

    setStats({
      totalUsers: users?.length || 0,
      totalIncidents: incidents?.length || 0,
      openIncidents,
      resolvedToday,
      avgResolutionTime: Math.round(avgResolutionTime),
      aiResolutionRate
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
        created_at,
        assignee,
        users!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const formattedTickets = data.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        user_name: (ticket.users as any)?.name || 'Unknown User',
        assignee: ticket.assignee
      }));
      setUserTickets(formattedTickets);
    }
  };

  const loadAIStats = async () => {
    const { data } = await supabase
      .from('ai_resolution_stats')
      .select('*');

    if (data) {
      const autoResolved = data.filter(s => s.resolution_method === 'auto').length;
      const escalated = data.filter(s => s.resolution_method === 'escalated').length;
      const avgConfidence = data.reduce((acc, s) => acc + (s.ai_confidence_score || 0), 0) / data.length;
      const avgSatisfaction = data.reduce((acc, s) => acc + (s.user_satisfaction_score || 0), 0) / data.length;

      setAIStats({
        totalResolutions: data.length,
        autoResolved,
        escalated,
        avgConfidenceScore: avgConfidence || 0,
        avgSatisfactionScore: avgSatisfaction || 0
      });
    }
  };

  const loadChartData = async () => {
    const { data: aiData } = await supabase
      .from('ai_resolution_stats')
      .select('*')
      .order('resolved_at', { ascending: true });

    if (aiData) {
      // Resolution time comparison
      const resolutionTimeData = [
        { name: 'Auto Resolution', aiTime: 15, humanTime: 45 },
        { name: 'Simple Issues', aiTime: 8, humanTime: 30 },
        { name: 'Complex Issues', aiTime: 25, humanTime: 60 },
        { name: 'Technical Issues', aiTime: 12, humanTime: 40 }
      ];

      // Satisfaction breakdown
      const satisfactionCounts = aiData.reduce((acc, item) => {
        const score = item.user_satisfaction_score;
        if (score >= 5) acc.excellent++;
        else if (score >= 4) acc.good++;
        else if (score >= 3) acc.average++;
        else acc.poor++;
        return acc;
      }, { excellent: 0, good: 0, average: 0, poor: 0 });

      const satisfactionData = [
        { name: 'Excellent (5★)', value: satisfactionCounts.excellent, color: '#22c55e' },
        { name: 'Good (4★)', value: satisfactionCounts.good, color: '#84cc16' },
        { name: 'Average (3★)', value: satisfactionCounts.average, color: '#eab308' },
        { name: 'Poor (<3★)', value: satisfactionCounts.poor, color: '#ef4444' }
      ];

      // Confidence over time
      const confidenceData = aiData.map((item, index) => ({
        time: `T${index + 1}`,
        confidence: Math.round((item.ai_confidence_score || 0) * 100),
        satisfaction: item.user_satisfaction_score || 0
      }));

      // AI Performance by method
      const autoStats = aiData.filter(d => d.resolution_method === 'auto');
      const escalatedStats = aiData.filter(d => d.resolution_method === 'escalated');

      const aiPerformanceData = [
        {
          method: 'AI Auto-Resolved',
          count: autoStats.length,
          avgTime: autoStats.reduce((acc, s) => acc + (s.resolution_time_minutes || 0), 0) / autoStats.length || 0,
          satisfaction: autoStats.reduce((acc, s) => acc + (s.user_satisfaction_score || 0), 0) / autoStats.length || 0
        },
        {
          method: 'Escalated to Human',
          count: escalatedStats.length,
          avgTime: escalatedStats.reduce((acc, s) => acc + (s.resolution_time_minutes || 0), 0) / escalatedStats.length || 0,
          satisfaction: escalatedStats.reduce((acc, s) => acc + (s.user_satisfaction_score || 0), 0) / escalatedStats.length || 0
        }
      ];

      setChartData({
        resolutionTimeData,
        satisfactionData,
        confidenceData,
        aiPerformanceData
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <AlertTriangle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">Admin privileges required to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">AI Support Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <p className="text-gray-600">Welcome back, Admin!</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalIncidents}</p>
                </div>
                <Ticket className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.openIncidents}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Resolution Rate</p>
                  <p className="text-3xl font-bold text-green-600">{stats.aiResolutionRate}%</p>
                </div>
                <Bot className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.avgResolutionTime}min</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.resolvedToday}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ai-performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-performance">AI Performance</TabsTrigger>
            <TabsTrigger value="resolution-analytics">Resolution Analytics</TabsTrigger>
            <TabsTrigger value="tickets">User Tickets</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-performance" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    AI vs Human Resolution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.resolutionTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="aiTime" fill="#22c55e" name="AI Resolution" />
                      <Bar dataKey="humanTime" fill="#64748b" name="Human Resolution" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    AI Confidence Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.confidenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Confidence %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    AI Resolution Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Total AI Resolutions</span>
                    <span className="text-2xl font-bold text-green-600">{aiStats.totalResolutions}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Auto-Resolved</span>
                    <span className="text-2xl font-bold text-blue-600">{aiStats.autoResolved}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium">Escalated to Human</span>
                    <span className="text-2xl font-bold text-orange-600">{aiStats.escalated}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Avg AI Confidence</span>
                    <span className="text-2xl font-bold text-purple-600">{(aiStats.avgConfidenceScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span className="text-2xl font-bold text-yellow-600">{aiStats.avgSatisfactionScore.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-2xl font-bold text-emerald-600">{stats.aiResolutionRate}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resolution-analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Resolution Method Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.aiPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Efficiency Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.confidenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                        name="Confidence %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    User Satisfaction Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.satisfactionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {chartData.satisfactionData.map((entry, index) => (
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
                    <TrendingUp className="w-5 h-5" />
                    Satisfaction vs Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.confidenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#3b82f6" 
                        name="AI Confidence"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="satisfaction" 
                        stroke="#22c55e" 
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
                  <Ticket className="w-5 h-5" />
                  Recent User Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{ticket.title}</h4>
                        <p className="text-sm text-gray-600">User: {ticket.user_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                        {ticket.assignee && (
                          <p className="text-sm text-blue-600">Assignee: {ticket.assignee}</p>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
