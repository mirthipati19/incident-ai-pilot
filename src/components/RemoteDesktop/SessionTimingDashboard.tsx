import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Timer,
  Activity,
  Target
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SessionTimingDashboardProps {
  sessionId: string;
}

interface TimingMetrics {
  avgResponseTime: number;
  totalDuration: number;
  messageCount: number;
  escalationRisk: 'low' | 'medium' | 'high';
  slaStatus: 'on_track' | 'at_risk' | 'violated';
}

interface TimingEvent {
  event_type: string;
  event_timestamp: string;
  response_time_seconds: number;
  notes: string;
}

export const SessionTimingDashboard = ({ sessionId }: SessionTimingDashboardProps) => {
  const [metrics, setMetrics] = useState<TimingMetrics>({
    avgResponseTime: 0,
    totalDuration: 0,
    messageCount: 0,
    escalationRisk: 'low',
    slaStatus: 'on_track'
  });
  const [timingEvents, setTimingEvents] = useState<TimingEvent[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTimingData();
    
    // Subscribe to real-time timing updates
    const channel = supabase
      .channel(`session-timing-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remote_session_timing',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadTimingData();
        }
      )
      .subscribe();

    // Update metrics every 30 seconds
    const interval = setInterval(loadTimingData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [sessionId]);

  const loadTimingData = async () => {
    try {
      const [timingRes, messagesRes, sessionRes] = await Promise.all([
        supabase
          .from('remote_session_timing')
          .select('*')
          .eq('session_id', sessionId)
          .order('event_timestamp', { ascending: false }),
        supabase
          .from('remote_session_messages')
          .select('created_at, sender_type')
          .eq('session_id', sessionId),
        supabase
          .from('remote_sessions')
          .select('started_at, status')
          .eq('id', sessionId)
          .single()
      ]);

      if (timingRes.error || messagesRes.error || sessionRes.error) {
        throw new Error('Failed to load timing data');
      }

      const events = timingRes.data || [];
      const messages = messagesRes.data || [];
      const session = sessionRes.data;

      setTimingEvents(events);
      
      if (session?.started_at) {
        setSessionStartTime(new Date(session.started_at));
      }

      // Calculate metrics
      const responseTimes = events
        .filter(e => e.response_time_seconds && e.response_time_seconds > 0)
        .map(e => e.response_time_seconds);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      const totalDuration = sessionStartTime 
        ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
        : 0;

      // Determine escalation risk based on response times and duration
      let escalationRisk: 'low' | 'medium' | 'high' = 'low';
      let slaStatus: 'on_track' | 'at_risk' | 'violated' = 'on_track';

      if (avgResponseTime > 300 || totalDuration > 1800) { // 5 min response or 30 min session
        escalationRisk = 'high';
        slaStatus = 'violated';
      } else if (avgResponseTime > 180 || totalDuration > 1200) { // 3 min response or 20 min session
        escalationRisk = 'medium';
        slaStatus = 'at_risk';
      }

      setMetrics({
        avgResponseTime,
        totalDuration,
        messageCount: messages.length,
        escalationRisk,
        slaStatus
      });

    } catch (error) {
      console.error('Error loading timing data:', error);
      toast({
        title: "Error",
        description: "Failed to load session timing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getSlaStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-50 text-green-700 border-green-200';
      case 'at_risk': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'violated': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span>Session Metrics</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(metrics.totalDuration)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Duration</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(metrics.avgResponseTime)}s
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Avg Response</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.messageCount}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Messages</div>
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className={getRiskColor(metrics.escalationRisk)}>
              {metrics.escalationRisk.toUpperCase()} RISK
            </Badge>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Escalation</div>
          </div>
        </div>
      </Card>

      {/* SLA Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span>SLA Status</span>
          </h4>
          <Badge variant="outline" className={getSlaStatusColor(metrics.slaStatus)}>
            {metrics.slaStatus.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        {/* Progress bars for different SLA metrics */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Session Duration</span>
              <span>{formatDuration(metrics.totalDuration)} / 30m</span>
            </div>
            <Progress 
              value={Math.min((metrics.totalDuration / 1800) * 100, 100)} 
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Response Time</span>
              <span>{Math.round(metrics.avgResponseTime)}s / 180s</span>
            </div>
            <Progress 
              value={Math.min((metrics.avgResponseTime / 180) * 100, 100)} 
              className="h-2"
            />
          </div>
        </div>
      </Card>

      {/* Recent Events */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Recent Events</span>
        </h4>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {timingEvents.slice(0, 10).map((event, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium">
                  {event.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(event.event_timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {event.response_time_seconds && (
                  <span className="ml-2">({event.response_time_seconds}s)</span>
                )}
              </div>
            </div>
          ))}
          
          {timingEvents.length === 0 && (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400">
              No timing events recorded yet
            </div>
          )}
        </div>
      </Card>

      {/* Escalation Warnings */}
      {metrics.escalationRisk === 'high' && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                Escalation Recommended
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Session duration or response times exceed recommended thresholds. 
                Consider escalating to senior support or supervisor.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};