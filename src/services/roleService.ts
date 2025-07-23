import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_at: string;
  assigned_by?: string;
}

export const roleService = {
  /**
   * Check if the current user has a specific role
   */
  async hasRole(role: UserRole): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: role
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  },

  /**
   * Check if the current user is an admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  /**
   * Get user roles (admin only)
   */
  async getUserRoles(userId?: string): Promise<UserRoleData[]> {
    try {
      let query = supabase.from('user_roles').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  },

  /**
   * Assign role to user (admin only)
   */
  async assignRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: role,
        assigned_by: user.id
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  /**
   * Remove role from user (admin only)
   */
  async removeRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }
};