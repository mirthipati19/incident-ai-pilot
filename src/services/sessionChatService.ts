import { cookieUtils, SessionCookie } from '@/utils/cookieUtils';
import { chatHistoryService, ChatMessage } from '@/services/chatHistoryService';

export interface ChatSession {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  lastActivity: Date;
  isActive: boolean;
}

export const sessionChatService = {
  /**
   * Initialize or restore a chat session for the user
   */
  async initializeSession(userId: string): Promise<ChatSession> {
    try {
      console.log('🔄 Initializing chat session for user:', userId);
      
      // Get or create session cookie
      let sessionData = cookieUtils.getSessionCookie();
      if (!sessionData || sessionData.userId !== userId) {
        // Create new session
        const sessionToken = cookieUtils.generateSessionToken();
        sessionData = {
          accessToken: '', // Will be set by auth system
          refreshToken: '', // Will be set by auth system
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          userId: userId,
          sessionToken: sessionToken
        };
        cookieUtils.setSessionCookie(sessionData);
        console.log('✅ Created new session cookie');
      } else {
        // Update session activity
        cookieUtils.updateSessionExpiry();
        console.log('✅ Updated existing session activity');
      }

      // Load chat history from MongoDB
      const messages = await chatHistoryService.getChatHistory(userId);
      console.log('📚 Loaded chat history:', messages.length, 'messages');

      const session: ChatSession = {
        sessionId: sessionData.sessionToken || `session_${userId}_${Date.now()}`,
        userId: userId,
        messages: messages,
        lastActivity: new Date(),
        isActive: true
      };

      return session;
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      throw error;
    }
  },

  /**
   * Save chat session data to MongoDB and update cookies
   */
  async saveSession(session: ChatSession): Promise<void> {
    try {
      console.log('💾 Saving session data for user:', session.userId);
      
      // Update session activity in cookies
      cookieUtils.updateSessionExpiry();
      
      // Save messages to MongoDB
      await chatHistoryService.saveChatHistory(session.userId, session.messages);
      
      console.log('✅ Session saved successfully');
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      throw error;
    }
  },

  /**
   * Add a message to the session and auto-save
   */
  async addMessage(session: ChatSession, message: ChatMessage): Promise<ChatSession> {
    try {
      const updatedSession = {
        ...session,
        messages: [...session.messages, message],
        lastActivity: new Date()
      };

      // Auto-save the updated session
      await this.saveSession(updatedSession);
      
      return updatedSession;
    } catch (error) {
      console.error('❌ Failed to add message to session:', error);
      throw error;
    }
  },

  /**
   * Clear chat session data
   */
  async clearSession(userId: string): Promise<void> {
    try {
      console.log('🗑️ Clearing session for user:', userId);
      
      // Clear cookies
      cookieUtils.clearSessionCookie();
      
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
      throw error;
    }
  },

  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    const sessionData = cookieUtils.getSessionCookie();
    return sessionData !== null && sessionData.expiresAt > Date.now();
  },

  /**
   * Get current session data from cookies
   */
  getCurrentSession(): SessionCookie | null {
    return cookieUtils.getSessionCookie();
  },

  /**
   * Update session activity timestamp
   */
  updateActivity(): void {
    cookieUtils.updateSessionExpiry();
  }
};