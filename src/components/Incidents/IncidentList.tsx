
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, User, CheckCircle } from 'lucide-react';
import { incidentService, Incident } from '@/services/incidentService';
import UserFeedbackDialog from '@/components/UserFeedbackDialog';

interface IncidentListProps {
  incidents: Incident[];
  onIncidentUpdate: () => Promise<void>;
}

const IncidentList = ({ incidents, onIncidentUpdate }: IncidentListProps) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check which resolved incidents already have feedback
    const checkFeedback = async () => {
      if (incidents.length === 0) return;
      
      const resolvedIncidents = incidents.filter(inc => inc.status === 'Resolved' || inc.status === 'Closed');
      const feedbackChecks = await Promise.all(
        resolvedIncidents.map(async (incident) => {
          try {
            const hasFeedback = await incidentService.checkExistingFeedback(incident.id, incident.user_id);
            return { incidentId: incident.id, hasFeedback };
          } catch (error) {
            console.error('Error checking feedback:', error);
            return { incidentId: incident.id, hasFeedback: false };
          }
        })
      );

      const submittedSet = new Set(
        feedbackChecks
          .filter(check => check.hasFeedback)
          .map(check => check.incidentId)
      );
      setFeedbackSubmitted(submittedSet);
    };

    checkFeedback();
  }, [incidents]);

  const handleFeedbackSubmitted = (incidentId: string) => {
    setFeedbackSubmitted(prev => new Set(prev.add(incidentId)));
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

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  if (incidents.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="text-center py-8">
          <p className="text-white/70">No incidents found. Create your first incident to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <Card key={incident.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg text-white">{incident.title}</CardTitle>
                <p className="text-sm text-blue-200 line-clamp-2">{incident.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(incident.priority)}>
                  {incident.priority}
                </Badge>
                <Badge className={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-blue-200">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(incident.created_at).toLocaleDateString()}</span>
                </div>
                {incident.assignee && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Assignee: {incident.assignee}</span>
                  </div>
                )}
              </div>

              {/* Performance metrics */}
              {(incident.response_time_minutes || incident.resolution_time_minutes) && (
                <div className="flex items-center gap-4 text-sm">
                  {incident.response_time_minutes && (
                    <div className="flex items-center gap-1 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span>Response: {formatDuration(incident.response_time_minutes)}</span>
                    </div>
                  )}
                  {incident.resolution_time_minutes && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolution: {formatDuration(incident.resolution_time_minutes)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback section for resolved incidents */}
              {(incident.status === 'Resolved' || incident.status === 'Closed') && (
                <div className="pt-2 border-t border-white/10">
                  {feedbackSubmitted.has(incident.id) ? (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Feedback submitted - Thank you!</span>
                    </div>
                  ) : (
                    <UserFeedbackDialog
                      incidentId={incident.id}
                      incidentTitle={incident.title}
                      userId={incident.user_id}
                      onFeedbackSubmitted={() => handleFeedbackSubmitted(incident.id)}
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IncidentList;
