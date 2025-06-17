
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

  async createIncident(incident: Omit<Incident, 'id' | 'created_at' | 'updated_at'>): Promise<Incident> {
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

  async updateIncidentStatus(incidentId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('incidents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', incidentId);

    if (error) {
      console.error('Error updating incident status:', error);
      throw error;
    }
  },

  async getIncidentStats(userId: string) {
    const { data, error } = await supabase
      .from('incidents')
      .select('status, priority, created_at')
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
      critical: incidents.filter(i => i.priority === 'critical').length
    };
  }
};
