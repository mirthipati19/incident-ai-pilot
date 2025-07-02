
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { incidentService } from '@/services/incidentService';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useImprovedAuth();
  const [stats, setStats] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    avgResolutionTime: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const userStats = await incidentService.getIncidentStats(user.id);
      setStats({
        totalIncidents: userStats.open + userStats.inProgress + userStats.resolved,
        openIncidents: userStats.open,
        inProgressIncidents: userStats.inProgress,
        resolvedIncidents: userStats.resolved,
        criticalIncidents: userStats.critical,
        avgResolutionTime: 24, // Mock data
        recentActivity: [] // Mock data
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Incident',
      description: 'Report a new IT issue',
      icon: AlertTriangle,
      link: '/itsm',
      color: 'bg-red-500'
    },
    {
      title: 'Service Catalog',
      description: 'Request IT services',
      icon: BarChart3,
      link: '/service-catalog',
      color: 'bg-blue-500'
    },
    {
      title: 'Knowledge Base',
      description: 'Find solutions and guides',
      icon: CheckCircle,
      link: '/knowledge-base',
      color: 'bg-green-500'
    },
    {
      title: 'Asset Management',
      description: 'Manage IT assets',
      icon: Activity,
      link: '/asset-management',
      color: 'bg-purple-500'
    }
  ];

  const statCards = [
    {
      title: 'Total Incidents',
      value: stats.totalIncidents,
      icon: BarChart3,
      description: 'All time incidents',
      color: 'text-blue-600'
    },
    {
      title: 'Open Incidents',
      value: stats.openIncidents,
      icon: XCircle,
      description: 'Awaiting attention',
      color: 'text-red-600'
    },
    {
      title: 'In Progress',
      value: stats.inProgressIncidents,
      icon: Clock,
      description: 'Being worked on',
      color: 'text-yellow-600'
    },
    {
      title: 'Resolved',
      value: stats.resolvedIncidents,
      icon: CheckCircle,
      description: 'Successfully closed',
      color: 'text-green-600'
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'User'}! Here's your IT service overview.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.link}>
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Resolution Time</span>
                <span className="text-sm text-muted-foreground">{stats.avgResolutionTime}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resolution Rate</span>
                <span className="text-sm text-muted-foreground">
                  {stats.totalIncidents > 0 ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Critical Issues</span>
                <span className="text-sm text-muted-foreground">{stats.criticalIncidents}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">IT Services</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Network</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Email Services</span>
                </div>
                <span className="text-sm text-yellow-600 font-medium">Maintenance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
