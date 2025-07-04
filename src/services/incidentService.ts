
import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string | null;
  category: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
  first_response_at?: string | null;
  response_time_minutes?: number | null;
  resolution_time_minutes?: number | null;
}

export const incidentService = {
  async getUserIncidents(userId: string): Promise<Incident[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incidents:', error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      status: item.status as 'Open' | 'In Progress' | 'Resolved' | 'Closed',
      priority: item.priority as 'low' | 'medium' | 'high' | 'critical'
    }));
  },

  async createIncident(incident: Omit<Incident, 'id' | 'created_at' | 'updated_at' | 'resolved_at' | 'first_response_at' | 'response_time_minutes' | 'resolution_time_minutes'>): Promise<Incident> {
    const { data, error } = await supabase
      .from('incidents')
      .insert(incident)
      .select()
      .single();

    if (error) {
      console.error('Error creating incident:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as 'Open' | 'In Progress' | 'Resolved' | 'Closed',
      priority: data.priority as 'low' | 'medium' | 'high' | 'critical'
    };
  },

  async updateIncidentStatus(incidentId: string, status: string, assignee?: string): Promise<void> {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    // Set first response time when moving from 'Open' to 'In Progress'
    if (status === 'In Progress') {
      // Check if this is the first response
      const { data: currentIncident } = await supabase
        .from('incidents')
        .select('first_response_at, status')
        .eq('id', incidentId)
        .single();

      if (currentIncident && currentIncident.status === 'Open' && !currentIncident.first_response_at) {
        updateData.first_response_at = new Date().toISOString();
      }
    }

    if (assignee !== undefined) {
      updateData.assignee = assignee;
    }

    const { error } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', incidentId);

    if (error) {
      console.error('Error updating incident status:', error);
      throw error;
    }
  },

  async markIncidentResolved(incidentId: string, resolutionMethod: 'auto' | 'manual' | 'escalated' = 'manual'): Promise<void> {
    const resolvedAt = new Date().toISOString();
    
    // Update incident status
    const { error: incidentError } = await supabase
      .from('incidents')
      .update({ 
        status: 'Resolved',
        resolved_at: resolvedAt,
        updated_at: resolvedAt
      })
      .eq('id', incidentId);

    if (incidentError) {
      console.error('Error marking incident as resolved:', incidentError);
      throw incidentError;
    }

    // Get incident details for AI resolution tracking
    const { data: incident } = await supabase
      .from('incidents')
      .select('created_at, response_time_minutes, resolution_time_minutes, category')
      .eq('id', incidentId)
      .single();

    if (incident) {
      // Record AI resolution stats
      const { error: statsError } = await supabase
        .from('ai_resolution_stats')
        .insert({
          incident_id: incidentId,
          resolution_method: resolutionMethod,
          resolved_at: resolvedAt,
          resolution_time_minutes: incident.resolution_time_minutes,
          response_time_minutes: incident.response_time_minutes,
          category: incident.category,
          ai_confidence_score: resolutionMethod === 'auto' ? 0.85 : 0.60, // Default confidence scores
          user_satisfaction_score: null // Will be updated when user provides feedback
        });

      if (statsError) {
        console.error('Error recording AI resolution stats:', statsError);
      }
    }
  },

  async recordUserFeedback(incidentId: string, userId: string, satisfactionRating: number, feedbackText?: string): Promise<void> {
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        incident_id: incidentId,
        user_id: userId,
        satisfaction_rating: satisfactionRating,
        feedback_text: feedbackText
      });

    if (error) {
      console.error('Error recording user feedback:', error);
      throw error;
    }

    // Update AI resolution stats with user satisfaction
    const { error: updateError } = await supabase
      .from('ai_resolution_stats')
      .update({ user_satisfaction_score: satisfactionRating })
      .eq('incident_id', incidentId);

    if (updateError) {
      console.error('Error updating AI stats with user satisfaction:', updateError);
    }
  },

  async checkExistingFeedback(incidentId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_feedback')
      .select('id')
      .eq('incident_id', incidentId)
      .eq('user_id', userId)
      .single();

    return !!data;
  },

  async getIncidentStats(userId: string) {
    const { data, error } = await supabase
      .from('incidents')
      .select('status, priority, created_at, resolution_time_minutes')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching incident stats:', error);
      throw error;
    }

    const incidents = data || [];
    const today = new Date().toDateString();

    return {
      open: incidents.filter(i => i.status === 'Open').length,
      inProgress: incidents.filter(i => i.status === 'In Progress').length,
      resolved: incidents.filter(i => i.status === 'Resolved').length,
      resolvedToday: incidents.filter(i => 
        i.status === 'Resolved' && 
        new Date(i.created_at).toDateString() === today
      ).length,
      critical: incidents.filter(i => i.priority === 'critical').length,
      avgResolutionTime: incidents
        .filter(i => i.resolution_time_minutes)
        .reduce((acc, i) => acc + (i.resolution_time_minutes || 0), 0) / 
        incidents.filter(i => i.resolution_time_minutes).length || 0
    };
  }
};
