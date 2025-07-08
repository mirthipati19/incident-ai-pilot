
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
      console.log('Attempting to save chat history for user:', userId, 'messages:', messages.length);
      
      // Prepare messages for storage
      const messagesToSave = messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        isBot: msg.isBot,
        timestamp: msg.timestamp.toISOString(),
        userId: msg.userId
      }));

      console.log('Prepared messages for storage:', messagesToSave);
      
      const response = await supabase.functions.invoke('mongodb-handler', {
        body: {
          action: 'saveChatHistory',
          data: {
            userId: userId,
            messages: messagesToSave
          }
        }
      });

      console.log('MongoDB handler response:', response);

      if (response.error) {
        console.error('Error from MongoDB handler:', response.error);
        throw new Error(`Save error: ${response.error.message}`);
      }

      if (!response.data?.success) {
        console.error('MongoDB handler returned unsuccessful response:', response.data);
        throw new Error('Failed to save chat history');
      }

      console.log('Chat history saved successfully');
      return response.data;
    } catch (error) {
      console.error('Error in saveChatHistory:', error);
      throw error;
    }
  },

  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    try {
      console.log('Attempting to load chat history for user:', userId);
      
      const response = await supabase.functions.invoke('mongodb-handler', {
        body: {
          action: 'getChatHistory',
          data: { userId: userId }
        }
      });

      console.log('MongoDB handler response for getChatHistory:', response);

      if (response.error) {
        console.error('Error from MongoDB handler:', response.error);
        throw new Error(`Load error: ${response.error.message}`);
      }

      if (!response.data?.success) {
        console.error('MongoDB handler returned unsuccessful response:', response.data);
        return [];
      }

      const messages = response.data.data?.messages || [];
      console.log('Raw messages from MongoDB:', messages);

      if (messages.length > 0) {
        const parsedMessages = messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          isBot: msg.isBot,
          timestamp: new Date(msg.timestamp),
          userId: msg.userId
        }));
        
        console.log('Parsed messages:', parsedMessages);
        console.log('Chat history loaded successfully:', parsedMessages.length, 'messages');
        return parsedMessages;
      }

      console.log('No chat history found for user');
      return [];
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  }
};
