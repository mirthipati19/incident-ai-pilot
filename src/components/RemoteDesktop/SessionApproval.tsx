import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Monitor, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { remoteDesktopService, RemoteSession } from '@/services/remoteDesktopService';
import { supabase } from '@/integrations/supabase/client';

export const SessionApproval = () => {
  const { toast } = useToast();
  const { user } = useImprovedAuth();
  const [pendingSessions, setPendingSessions] = useState<RemoteSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingSession, setProcessingSession] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user?.id) {
      loadPendingSessions();
      
      // Subscribe to real-time updates
      const subscription = remoteDesktopService.subscribeToSessionUpdates(
        user.id,
        (payload) => {
          console.log('Session update received:', payload);
          loadPendingSessions();
        }
      );

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user?.id]);

  const loadPendingSessions = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await remoteDesktopService.getPendingSessions(user.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load pending sessions",
        variant: "destructive",
      });
    } else {
      setPendingSessions(data || []);
    }
    setLoading(false);
  };

  const respondToSession = async (
    sessionId: string,
    status: 'approved' | 'denied'
  ) => {
    setProcessingSession(sessionId);

    const notes = responseNotes[sessionId];
    const { error } = await remoteDesktopService.updateSessionStatus(
      sessionId,
      status,
      notes
    );

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${status === 'approved' ? 'approve' : 'deny'} session`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Session ${status === 'approved' ? 'approved' : 'denied'} successfully`,
      });
      
      // Remove from pending list
      setPendingSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Clear notes
      setResponseNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[sessionId];
        return newNotes;
      });
    }

    setProcessingSession(null);
  };

  const updateNotes = (sessionId: string, notes: string) => {
    setResponseNotes(prev => ({
      ...prev,
      [sessionId]: notes
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading pending sessions...</div>
        </CardContent>
      </Card>
    );
  }

  if (pendingSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Session Approval
          </CardTitle>
          <CardDescription>
            No pending remote session requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No pending remote session requests found.</p>
            <p className="text-sm">New requests will appear here for your approval.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Session Requests
          </CardTitle>
          <CardDescription>
            Review and approve or deny remote desktop access requests
          </CardDescription>
        </CardHeader>
      </Card>

      {pendingSessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Remote Access Request</CardTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </Badge>
            </div>
            <CardDescription>
              Session Code: <strong>{session.session_code}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Support Engineer ID
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4" />
                  <span>{session.support_engineer_id}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Requested At
                </Label>
                <div className="mt-1">
                  {new Date(session.requested_at).toLocaleString()}
                </div>
              </div>
            </div>

            {session.purpose && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Purpose
                </Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {session.purpose}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor={`notes-${session.id}`}>
                Response Notes (Optional)
              </Label>
              <Textarea
                id={`notes-${session.id}`}
                placeholder="Add any notes about your decision..."
                value={responseNotes[session.id] || ''}
                onChange={(e) => updateNotes(session.id, e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => respondToSession(session.id, 'approved')}
                disabled={processingSession === session.id}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {processingSession === session.id ? 'Processing...' : 'Approve'}
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => respondToSession(session.id, 'denied')}
                disabled={processingSession === session.id}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {processingSession === session.id ? 'Processing...' : 'Deny'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};