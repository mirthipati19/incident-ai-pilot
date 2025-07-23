import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  ArrowUp, 
  Clock, 
  User, 
  MessageCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EscalationControlProps {
  sessionId: string;
  userType: 'support_engineer' | 'supervisor';
  currentStatus: string;
}

interface EscalationRule {
  id: string;
  rule_name: string;
  trigger_condition: string;
  threshold_minutes: number;
  escalation_action: string;
  is_active: boolean;
}

export const EscalationControl = ({ sessionId, userType, currentStatus }: EscalationControlProps) => {
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [escalationNotes, setEscalationNotes] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [sessionMetrics, setSessionMetrics] = useState({
    duration: 0,
    avgResponseTime: 0,
    lastActivity: null as Date | null
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEscalationRules();
    loadSessionMetrics();
    
    // Update metrics every minute
    const interval = setInterval(loadSessionMetrics, 60000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadEscalationRules = async () => {
    try {
      const { data, error } = await supabase
        .from('session_escalation_rules')
        .select('*')
        .eq('is_active', true)
        .order('threshold_minutes');

      if (error) throw error;
      setEscalationRules(data || []);
    } catch (error) {
      console.error('Error loading escalation rules:', error);
    }
  };

  const loadSessionMetrics = async () => {
    try {
      const [sessionRes, timingRes, messagesRes] = await Promise.all([
        supabase
          .from('remote_sessions')
          .select('started_at')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('remote_session_timing')
          .select('response_time_seconds, event_timestamp')
          .eq('session_id', sessionId),
        supabase
          .from('remote_session_messages')
          .select('created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      if (sessionRes.data?.started_at) {
        const duration = Math.floor((Date.now() - new Date(sessionRes.data.started_at).getTime()) / 1000);
        setSessionMetrics(prev => ({ ...prev, duration }));
      }

      if (timingRes.data) {
        const responseTimes = timingRes.data
          .filter(t => t.response_time_seconds)
          .map(t => t.response_time_seconds);
        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0;
        setSessionMetrics(prev => ({ ...prev, avgResponseTime }));
      }

      if (messagesRes.data && messagesRes.data.length > 0) {
        setSessionMetrics(prev => ({ 
          ...prev, 
          lastActivity: new Date(messagesRes.data[0].created_at) 
        }));
      }

    } catch (error) {
      console.error('Error loading session metrics:', error);
    }
  };

  const triggerEscalation = async (escalationType: string, reason: string) => {
    setIsEscalating(true);
    try {
      // Record escalation event
      await supabase
        .from('remote_session_timing')
        .insert({
          session_id: sessionId,
          event_type: 'escalation_triggered',
          notes: reason,
          triggered_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: { escalation_type: escalationType }
        });

      // Send escalation message
      await supabase
        .from('remote_session_messages')
        .insert({
          session_id: sessionId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          sender_type: 'system',
          message_content: `Session escalated: ${reason}`,
          message_type: 'system_notification',
          metadata: { escalation_type: escalationType }
        });

      // Update session status if needed
      if (escalationType === 'supervisor_takeover') {
        await supabase
          .from('remote_sessions')
          .update({ 
            status: 'active', // Keep as active when supervisor takes over
            metadata: { escalated: true, escalation_type: escalationType }
          })
          .eq('id', sessionId);
      }

      toast({
        title: "Session Escalated",
        description: `Session has been escalated: ${reason}`,
      });

      setEscalationNotes('');

    } catch (error) {
      console.error('Error escalating session:', error);
      toast({
        title: "Escalation Failed",
        description: "Failed to escalate the session",
        variant: "destructive",
      });
    } finally {
      setIsEscalating(false);
    }
  };

  const pauseSession = async () => {
    try {
      await Promise.all([
        supabase
          .from('remote_sessions')
          .update({ 
            status: 'active',
            metadata: { paused: true }
          })
          .eq('id', sessionId),
        supabase
          .from('remote_session_timing')
          .insert({
            session_id: sessionId,
            event_type: 'session_paused',
            triggered_by: (await supabase.auth.getUser()).data.user?.id
          })
      ]);

      toast({
        title: "Session Paused",
        description: "The support session has been paused",
      });
    } catch (error) {
      console.error('Error pausing session:', error);
      toast({
        title: "Error",
        description: "Failed to pause session",
        variant: "destructive",
      });
    }
  };

  const resumeSession = async () => {
    try {
      await Promise.all([
        supabase
          .from('remote_sessions')
          .update({ 
            status: 'active',
            metadata: { paused: false }
          })
          .eq('id', sessionId),
        supabase
          .from('remote_session_timing')
          .insert({
            session_id: sessionId,
            event_type: 'session_resumed',
            triggered_by: (await supabase.auth.getUser()).data.user?.id
          })
      ]);

      toast({
        title: "Session Resumed",
        description: "The support session has been resumed",
      });
    } catch (error) {
      console.error('Error resuming session:', error);
      toast({
        title: "Error",
        description: "Failed to resume session",
        variant: "destructive",
      });
    }
  };

  const endSession = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;

    try {
      await Promise.all([
        supabase
          .from('remote_sessions')
          .update({ 
            status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('id', sessionId),
        supabase
          .from('remote_session_timing')
          .insert({
            session_id: sessionId,
            event_type: 'session_ended',
            triggered_by: (await supabase.auth.getUser()).data.user?.id,
            total_session_duration_seconds: sessionMetrics.duration
          })
      ]);

      toast({
        title: "Session Ended",
        description: "The support session has been completed",
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      });
    }
  };

  const checkEscalationTriggers = () => {
    const triggers = [];
    const durationMinutes = Math.floor(sessionMetrics.duration / 60);
    const responseMinutes = Math.floor(sessionMetrics.avgResponseTime / 60);

    escalationRules.forEach(rule => {
      let triggered = false;
      
      switch (rule.trigger_condition) {
        case 'session_duration_exceeded':
          triggered = durationMinutes > rule.threshold_minutes;
          break;
        case 'response_time_exceeded':
          triggered = responseMinutes > rule.threshold_minutes;
          break;
        case 'user_inactivity':
          if (sessionMetrics.lastActivity) {
            const inactiveMinutes = Math.floor((Date.now() - sessionMetrics.lastActivity.getTime()) / 60000);
            triggered = inactiveMinutes > rule.threshold_minutes;
          }
          break;
      }

      if (triggered) {
        triggers.push(rule);
      }
    });

    return triggers;
  };

  const triggeredRules = checkEscalationTriggers();
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <span>Session Control</span>
      </h3>

      {/* Triggered Escalation Rules */}
      {triggeredRules.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
            ⚠️ Escalation Triggers Active
          </h4>
          <div className="space-y-1">
            {triggeredRules.map(rule => (
              <div key={rule.id} className="text-sm text-red-700 dark:text-red-300">
                • {rule.rule_name} ({rule.threshold_minutes}m threshold)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {currentStatus === 'active' ? (
          <Button
            onClick={pauseSession}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Pause className="w-4 h-4" />
            <span>Pause Session</span>
          </Button>
        ) : currentStatus === 'paused' ? (
          <Button
            onClick={resumeSession}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Resume Session</span>
          </Button>
        ) : null}

        <Button
          onClick={endSession}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <XCircle className="w-4 h-4" />
          <span>End Session</span>
        </Button>
      </div>

      {/* Escalation Actions */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Escalation Notes</label>
          <Textarea
            value={escalationNotes}
            onChange={(e) => setEscalationNotes(e.target.value)}
            placeholder="Describe the reason for escalation..."
            rows={3}
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {userType === 'support_engineer' && (
            <Button
              onClick={() => triggerEscalation('supervisor_request', escalationNotes || 'Engineer requested supervisor assistance')}
              disabled={isEscalating}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Request Supervisor</span>
            </Button>
          )}

          {userType === 'supervisor' && (
            <Button
              onClick={() => triggerEscalation('supervisor_takeover', escalationNotes || 'Supervisor taking over session')}
              disabled={isEscalating}
              size="sm"
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
            >
              <User className="w-4 h-4" />
              <span>Take Over Session</span>
            </Button>
          )}

          <Button
            onClick={() => triggerEscalation('manual_escalation', escalationNotes || 'Manual escalation triggered')}
            disabled={isEscalating || !escalationNotes.trim()}
            variant="destructive"
            size="sm"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Escalate Now</span>
          </Button>
        </div>
      </div>

      {/* Session Stats */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{formatDuration(sessionMetrics.duration)}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Duration</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(sessionMetrics.avgResponseTime)}s</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Avg Response</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {sessionMetrics.lastActivity 
                ? formatDuration(Math.floor((Date.now() - sessionMetrics.lastActivity.getTime()) / 1000))
                : 'N/A'
              }
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Last Activity</div>
          </div>
        </div>
      </div>
    </Card>
  );
};