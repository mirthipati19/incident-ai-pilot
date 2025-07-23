import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RemoteSessionChat } from '@/components/RemoteDesktop/RemoteSessionChat';
import { SessionTimingDashboard } from '@/components/RemoteDesktop/SessionTimingDashboard';
import { EscalationControl } from '@/components/RemoteDesktop/EscalationControl';
import { 
  ArrowLeft, 
  Monitor, 
  Users, 
  Clock, 
  MessageSquare,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RemoteSession {
  id: string;
  session_code: string;
  target_user_id: string;
  support_engineer_id: string;
  status: string;
  purpose: string;
  started_at: string;
  ended_at?: string;
  metadata: any;
}

const RemoteSessionDetail = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<RemoteSession | null>(null);
  const [userType, setUserType] = useState<'support_engineer' | 'target_user' | 'supervisor'>('target_user');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'timing' | 'control'>('chat');
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
      determineUserType();
    }
  }, [sessionId]);

  const loadSessionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('remote_sessions')
        .select(`
          *,
          support_engineers!inner(user_id, role)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);

      // Subscribe to session updates
      const channel = supabase
        .channel(`remote-session-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'remote_sessions',
            filter: `id=eq.${sessionId}`
          },
          (payload) => {
            setSession(payload.new as RemoteSession);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } catch (error) {
      console.error('Error loading session details:', error);
      toast({
        title: "Error",
        description: "Failed to load session details",
        variant: "destructive",
      });
      navigate('/remote-desktop');
    } finally {
      setLoading(false);
    }
  };

  const determineUserType = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Check if user is admin (supervisor)
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.data.user.id)
        .single();

      if (adminData) {
        setUserType('supervisor');
        return;
      }

      // Check if user is support engineer
      const { data: engineerData } = await supabase
        .from('support_engineers')
        .select('*')
        .eq('user_id', user.data.user.id)
        .single();

      if (engineerData) {
        setUserType('support_engineer');
        return;
      }

      // Default to target user
      setUserType('target_user');

    } catch (error) {
      console.error('Error determining user type:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'paused':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'escalated':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return <Activity className="w-4 h-4" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Session Not Found
            </h1>
            <Button onClick={() => navigate('/remote-desktop')}>
              Return to Remote Desktop
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/remote-desktop')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Remote Session: {session.session_code}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {session.purpose || 'Remote support session'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={getStatusColor(session.status)}>
              {getStatusIcon(session.status)}
              <span className="ml-1 capitalize">{session.status}</span>
            </Badge>
            
            <Badge variant="outline">
              <Users className="w-3 h-3 mr-1" />
              {userType === 'support_engineer' ? 'Engineer' : 
               userType === 'supervisor' ? 'Supervisor' : 'User'}
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Chat
          </button>
          
          <button
            onClick={() => setActiveTab('timing')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timing'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Timing
          </button>
          
          {(userType === 'support_engineer' || userType === 'supervisor') && (
            <button
              onClick={() => setActiveTab('control')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'control'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-4 h-4 inline mr-2" />
              Control
            </button>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'chat' && (
              <RemoteSessionChat
                sessionId={session.id}
                userType={userType === 'supervisor' ? 'support_engineer' : userType}
                sessionStatus={session.status}
              />
            )}
            
            {activeTab === 'timing' && (
              <SessionTimingDashboard sessionId={session.id} />
            )}
            
            {activeTab === 'control' && (userType === 'support_engineer' || userType === 'supervisor') && (
              <EscalationControl
                sessionId={session.id}
                userType={userType === 'supervisor' ? 'supervisor' : 'support_engineer'}
                currentStatus={session.status}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Session Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Session Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Code:</span>
                  <span className="font-mono">{session.session_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Started:</span>
                  <span>{new Date(session.started_at).toLocaleString()}</span>
                </div>
                {session.ended_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Ended:</span>
                    <span>{new Date(session.ended_at).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Purpose:</span>
                  <span>{session.purpose || 'General support'}</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            {(userType === 'support_engineer' || userType === 'supervisor') && activeTab !== 'control' && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => setActiveTab('control')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Session Control
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteSessionDetail;