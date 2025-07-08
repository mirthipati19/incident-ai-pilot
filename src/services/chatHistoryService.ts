
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
      console.log('Saving chat history for user:', userId, 'messages:', messages.length);
      
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
        throw new Error(`Save error: ${response.error.message}`);
      }

      console.log('Chat history saved successfully:', response.data);
    } catch (error) {
      console.error('Error saving chat history:', error);
      throw error;
    }
  },

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    try {
      console.log('Loading chat history for user:', userId);
      
      const response = await supabase.functions.invoke('mongodb-handler', {
        body: {
          action: 'getChatHistory',
          data: { userId }
        }
      });

      if (response.error) {
        console.error('Error loading chat history:', response.error);
        throw new Error(`Load error: ${response.error.message}`);
      }

      if (response.data?.data?.messages) {
        const messages = response.data.data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        console.log('Chat history loaded successfully:', messages.length, 'messages');
        return messages;
      }

      console.log('No chat history found for user');
      return [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }
};
