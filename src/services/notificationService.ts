import { supabase } from '@/integrations/supabase/client';

export interface ChatNotification {
  id: string;
  user_id: string;
  session_id: string;
  message_id: string;
  message_content: string;
  sender_name?: string;
  is_read: boolean;
  created_at: string;
  expires_at: string;
}

export const notificationService = {
  /**
   * Get unread notifications for current user
   */
  async getUnreadNotifications(): Promise<ChatNotification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('chat_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('chat_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  /**
   * Create notification (system use)
   */
  async createNotification(
    userId: string,
    sessionId: string,
    messageId: string,
    messageContent: string,
    senderName?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_notifications')
        .insert({
          user_id: userId,
          session_id: sessionId,
          message_id: messageId,
          message_content: messageContent,
          sender_name: senderName
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(onNotification: (notification: ChatNotification) => void) {
    return supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return null;

    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          onNotification(payload.new as ChatNotification);
        }
      )
        .subscribe();

      return channel;
    });
  }
};