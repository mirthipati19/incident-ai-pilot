
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  userId?: string;
}

export const chatHistoryService = {
  async saveChatHistory(userId: string, messages: ChatMessage[]) {
    try {
      const response = await supabase.functions.invoke('mongodb-handler', {
        body: {
          action: 'saveChatHistory',
          data: {
            userId,
            messages: messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString()
            }))
          }
        }
      });

      if (response.error) {
        console.error('Error saving chat history:', response.error);
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  },

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    try {
      const response = await supabase.functions.invoke('mongodb-handler', {
        body: {
          action: 'getChatHistory',
          data: { userId }
        }
      });

      if (response.data?.messages) {
        return response.data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }

      return [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }
};
