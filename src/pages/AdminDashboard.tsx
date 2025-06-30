import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
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
  avgResponseTime: number;
  avgSatisfactionRating: number;
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
  response_time_minutes: number | null;
  resolution_time_minutes: number | null;
}

interface ChartData {
  resolutionTimeData: Array<{ period: string; avgTime: number; count: number }>;
  satisfactionData: Array<{ rating: string; count: number; percentage: number; color: string }>;
  responseTimeData: Array<{ date: string; avgResponse: number; avgResolution: number }>;
  categoryData: Array<{ category: string; count: number; avgSatisfaction: number }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalIncidents: 0,
    openIncidents: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    aiResolutionRate: 0,
    avgResponseTime: 0,
    avgSatisfactionRating: 0,
    systemUptime: 0
  });
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    resolutionTimeData: [],
    satisfactionData: [],
    responseTimeData: [],
    categoryData: []
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useImprovedAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      checkAdminAccess();
    }
  }, [user?.id]);

  const checkAdminAccess = async () => {
    try {
      // Allow both database admin check and email-based admin check
      const isAdminEmail = user?.email === 'murari.mirthipati@authexa.me';
      
      if (isAdminEmail) {
        setIsAdmin(true);
        loadDashboardData();
        return;
      }

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
        loadChartData()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralStats = async () => {
    try {
      // Get basic counts
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*');

      const { data: users } = await supabase
        .from('users')
        .select('id');

      const { data: aiResolutions } = await supabase
        .from('ai_resolution_stats')
        .select('*');

      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('satisfaction_rating');

      const { data: systemMetrics } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_name', 'system_uptime')
        .order('recorded_at', { ascending: false })
        .limit(1);

      const today = new Date().toDateString();
      const openIncidents = incidents?.filter(i => i.status === 'Open').length || 0;
      const resolvedToday = incidents?.filter(i => 
        i.status === 'Resolved' && 
        new Date(i.created_at).toDateString() === today
      ).length || 0;

      // Calculate AI resolution rate
      const totalResolutions = aiResolutions?.length || 0;
      const autoResolved = aiResolutions?.filter(r => r.resolution_method === 'auto').length || 0;
      const aiResolutionRate = totalResolutions > 0 ? Math.round((autoResolved / totalResolutions) * 100) : 0;

      // Calculate average resolution time from real data
      const resolvedIncidents = incidents?.filter(i => i.resolution_time_minutes) || [];
      const avgResolutionTime = resolvedIncidents.length > 0 
        ? Math.round(resolvedIncidents.reduce((acc, i) => acc + (i.resolution_time_minutes || 0), 0) / resolvedIncidents.length)
        : 0;

      // Calculate average response time
      const respondedIncidents = incidents?.filter(i => i.response_time_minutes) || [];
      const avgResponseTime = respondedIncidents.length > 0
        ? Math.round(respondedIncidents.reduce((acc, i) => acc + (i.response_time_minutes || 0), 0) / respondedIncidents.length)
        : 0;

      // Calculate average satisfaction rating
      const avgSatisfactionRating = feedback && feedback.length > 0
        ? parseFloat((feedback.reduce((acc, f) => acc + f.satisfaction_rating, 0) / feedback.length).toFixed(1))
        : 0;

      // Get system uptime
      const systemUptime = systemMetrics && systemMetrics.length > 0 
        ? parseFloat(systemMetrics[0].metric_value.toString())
        : 99.8;

      setStats({
        totalUsers: users?.length || 0,
        totalIncidents: incidents?.length || 0,
        openIncidents,
        resolvedToday,
        avgResolutionTime,
        aiResolutionRate,
        avgResponseTime,
        avgSatisfactionRating,
        systemUptime
      });
    } catch (error) {
      console.error('Error loading general stats:', error);
    }
  };

  const loadUserTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          assignee,
          response_time_minutes,
          resolution_time_minutes,
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
          assignee: ticket.assignee,
          response_time_minutes: ticket.response_time_minutes,
          resolution_time_minutes: ticket.resolution_time_minutes
        }));
        setUserTickets(formattedTickets);
      }
    } catch (error) {
      console.error('Error loading user tickets:', error);
    }
  };

  const loadChartData = async () => {
    try {
      // Load resolution time data by week
      const { data: incidents } = await supabase
        .from('incidents')
        .select('created_at, resolution_time_minutes, status')
        .not('resolution_time_minutes', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      // Load satisfaction data
      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('satisfaction_rating');

      // Load incidents with response times for trend analysis
      const { data: responseData } = await supabase
        .from('incidents')
        .select('created_at, response_time_minutes, resolution_time_minutes')
        .not('response_time_minutes', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Load category performance data
      const { data: categoryPerformance } = await supabase
        .from('incidents')
        .select(`
          category,
          user_feedback(satisfaction_rating)
        `);

      // Process resolution time data
      const resolutionTimeData = processResolutionTimeData(incidents || []);
      
      // Process satisfaction data
      const satisfactionData = processSatisfactionData(feedback || []);
      
      // Process response time trends
      const responseTimeData = processResponseTimeData(responseData || []);
      
      // Process category data
      const categoryData = processCategoryData(categoryPerformance || []);

      setChartData({
        resolutionTimeData,
        satisfactionData,
        responseTimeData,
        categoryData
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const processResolutionTimeData = (incidents: any[]) => {
    const weeklyData: { [key: string]: { total: number; count: number } } = {};
    
    incidents.forEach(incident => {
      const week = getWeekKey(new Date(incident.created_at));
      if (!weeklyData[week]) {
        weeklyData[week] = { total: 0, count: 0 };
      }
      weeklyData[week].total += incident.resolution_time_minutes || 0;
      weeklyData[week].count += 1;
    });

    return Object.entries(weeklyData)
      .map(([period, data]) => ({
        period,
        avgTime: Math.round(data.total / data.count),
        count: data.count
      }))
      .slice(0, 8)
      .reverse();
  };

  const processSatisfactionData = (feedback: any[]) => {
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    feedback.forEach(f => {
      ratings[f.satisfaction_rating as keyof typeof ratings]++;
    });

    const total = feedback.length || 1;
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    const labels = ['1★ Poor', '2★ Fair', '3★ Good', '4★ Very Good', '5★ Excellent'];

    return Object.entries(ratings).map(([rating, count], index) => ({
      rating: labels[index],
      count,
      percentage: Math.round((count / total) * 100),
      color: colors[index]
    }));
  };

  const processResponseTimeData = (incidents: any[]) => {
    const dailyData: { [key: string]: { responseTotal: number; resolutionTotal: number; count: number } } = {};
    
    incidents.forEach(incident => {
      const date = new Date(incident.created_at).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { responseTotal: 0, resolutionTotal: 0, count: 0 };
      }
      dailyData[date].responseTotal += incident.response_time_minutes || 0;
      dailyData[date].resolutionTotal += incident.resolution_time_minutes || 0;
      dailyData[date].count += 1;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: date.slice(0, 5), // MM/DD format
        avgResponse: Math.round(data.responseTotal / data.count),
        avgResolution: Math.round(data.resolutionTotal / data.count)
      }))
      .slice(-10);
  };

  const processCategoryData = (incidents: any[]) => {
    const categoryStats: { [key: string]: { count: number; satisfactionTotal: number; satisfactionCount: number } } = {};
    
    incidents.forEach(incident => {
      const category = incident.category || 'other';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, satisfactionTotal: 0, satisfactionCount: 0 };
      }
      categoryStats[category].count += 1;
      
      if (incident.user_feedback && incident.user_feedback.length > 0) {
        incident.user_feedback.forEach((fb: any) => {
          categoryStats[category].satisfactionTotal += fb.satisfaction_rating;
          categoryStats[category].satisfactionCount += 1;
        });
      }
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: stats.count,
      avgSatisfaction: stats.satisfactionCount > 0 
        ? parseFloat((stats.satisfactionTotal / stats.satisfactionCount).toFixed(1))
        : 0
    }));
  };

  const getWeekKey = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toLocaleDateString();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalIncidents}</p>
                </div>
                <Ticket className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.openIncidents}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolvedToday}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgResponseTime}min</p>
                </div>
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Avg Resolution</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.avgResolutionTime}min</p>
                </div>
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.avgSatisfactionRating}/5</p>
                </div>
                <UserCheck className="w-6 h-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.systemUptime}%</p>
                </div>
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="satisfaction">User Satisfaction</TabsTrigger>
            <TabsTrigger value="tickets">Recent Tickets</TabsTrigger>
            <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Resolution Time Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.resolutionTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Resolution Time" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Response vs Resolution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avgResponse" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        name="Avg Response Time"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgResolution" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Avg Resolution Time"
                      />
                    </LineChart>
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
                        dataKey="count"
                        label={({ rating, percentage }) => `${rating}: ${percentage}%`}
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
                    <Target className="w-5 h-5" />
                    Satisfaction Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chartData.satisfactionData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                      <span className="font-medium">{item.rating}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.count} responses</span>
                        <span className="font-bold" style={{ color: item.color }}>{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Category Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData.categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis yAxisId="left" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Satisfaction', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Incident Count" />
                    <Bar yAxisId="right" dataKey="avgSatisfaction" fill="#22c55e" name="Avg Satisfaction" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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
                          Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                        {ticket.assignee && (
                          <p className="text-sm text-blue-600">Assignee: {ticket.assignee}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {ticket.response_time_minutes && (
                            <span>Response: {ticket.response_time_minutes}min</span>
                          )}
                          {ticket.resolution_time_minutes && (
                            <span>Resolution: {ticket.resolution_time_minutes}min</span>
                          )}
                        </div>
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
