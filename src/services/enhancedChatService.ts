import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  user_id: string;
  message_text: string;
  is_bot: boolean;
  message_type: 'text' | 'action' | 'system' | 'error';
  metadata: Record<string, any>;
  session_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  status: 'active' | 'closed' | 'archived';
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  message: string;
  actions?: Array<{
    text: string;
    action: string;
  }>;
  type: 'success' | 'error' | 'partial';
}

class EnhancedChatService {
  private static instance: EnhancedChatService;
  private realtimeChannel: RealtimeChannel | null = null;
  private currentSessionId: string | null = null;
  private messageCache = new Map<string, ChatMessage[]>();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  static getInstance(): EnhancedChatService {
    if (!EnhancedChatService.instance) {
      EnhancedChatService.instance = new EnhancedChatService();
    }
    return EnhancedChatService.instance;
  }

  // Session Management
  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          title: title || 'New Chat Session',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      
      this.currentSessionId = sessionId;
      await this.setupRealtime(userId, sessionId);
      
      return data as ChatSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      // Fallback to local session
      const localSession: ChatSession = {
        id: sessionId,
        user_id: userId,
        title: title || 'New Chat Session',
        status: 'active',
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.currentSessionId = sessionId;
      this.storeOfflineSession(localSession);
      return localSession;
    }
  }

  async getOrCreateSession(userId: string): Promise<ChatSession> {
    try {
      // Try to get the most recent active session
      const { data: existingSessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('last_activity', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (existingSessions && existingSessions.length > 0) {
        const session = existingSessions[0] as ChatSession;
        this.currentSessionId = session.id;
        await this.setupRealtime(userId, session.id);
        return session;
      }

      // Create new session if none exists
      return await this.createSession(userId);
    } catch (error) {
      console.error('Failed to get or create session:', error);
      return await this.createSession(userId);
    }
  }

  // Real-time Setup
  private async setupRealtime(userId: string, sessionId: string) {
    try {
      if (this.realtimeChannel) {
        await supabase.removeChannel(this.realtimeChannel);
      }

      this.realtimeChannel = supabase
        .channel(`chat_${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('New message received:', payload);
            this.handleRealtimeMessage(payload.new as ChatMessage);
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
          this.connectionStatus = status === 'SUBSCRIBED' ? 'connected' : 'disconnected';
        });

      this.connectionStatus = 'connecting';
    } catch (error) {
      console.error('Failed to setup realtime:', error);
      this.connectionStatus = 'disconnected';
    }
  }

  private handleRealtimeMessage(message: ChatMessage) {
    // Update cache
    const sessionMessages = this.messageCache.get(message.session_id) || [];
    const existingIndex = sessionMessages.findIndex(m => m.id === message.id);
    
    if (existingIndex === -1) {
      sessionMessages.push(message);
      this.messageCache.set(message.session_id, sessionMessages);
    }

    // Trigger custom event for components to listen
    window.dispatchEvent(new CustomEvent('chatMessageReceived', { 
      detail: message 
    }));
  }

  // Message Management
  async sendMessage(
    userId: string, 
    messageText: string, 
    sessionId?: string
  ): Promise<{ userMessage: ChatMessage; aiResponse: ChatMessage }> {
    const activeSessionId = sessionId || this.currentSessionId;
    
    if (!activeSessionId) {
      throw new Error('No active session found');
    }

    // Create user message
    const userMessage = await this.saveMessage(
      userId,
      messageText,
      false,
      'text',
      {},
      activeSessionId
    );

    // Generate AI response with retry logic
    let aiResponse: ChatMessage;
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        const response = await this.generateAIResponse(messageText, userId);
        
        aiResponse = await this.saveMessage(
          userId,
          response.message,
          true,
          response.type === 'error' ? 'error' : 'text',
          { actions: response.actions || [] },
          activeSessionId
        );
        
        break;
      } catch (error) {
        attempts++;
        console.error(`AI response attempt ${attempts} failed:`, error);
        
        if (attempts >= this.maxRetries) {
          aiResponse = await this.saveMessage(
            userId,
            "I apologize, but I'm experiencing technical difficulties. Please try again or contact support directly.",
            true,
            'error',
            {},
            activeSessionId
          );
        } else {
          await this.sleep(this.retryDelay * attempts);
        }
      }
    }

    // Update session activity
    await this.updateSessionActivity(activeSessionId);

    return { userMessage, aiResponse: aiResponse! };
  }

  private async saveMessage(
    userId: string,
    messageText: string,
    isBot: boolean,
    messageType: 'text' | 'action' | 'system' | 'error',
    metadata: Record<string, any>,
    sessionId: string
  ): Promise<ChatMessage> {
    const message = {
      user_id: userId,
      message_text: messageText,
      is_bot: isBot,
      message_type: messageType,
      metadata,
      session_id: sessionId
    };

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;

      const savedMessage = data as ChatMessage;
      
      // Update cache
      const sessionMessages = this.messageCache.get(sessionId) || [];
      sessionMessages.push(savedMessage);
      this.messageCache.set(sessionId, sessionMessages);

      return savedMessage;
    } catch (error) {
      console.error('Failed to save message:', error);
      
      // Fallback to offline storage
      const offlineMessage: ChatMessage = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        message_text: messageText,
        is_bot: isBot,
        message_type: messageType,
        metadata,
        session_id: sessionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.storeOfflineMessage(offlineMessage);
      return offlineMessage;
    }
  }

  async getMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    // Check cache first
    const cachedMessages = this.messageCache.get(sessionId);
    if (cachedMessages && cachedMessages.length > 0) {
      return cachedMessages.slice(-limit);
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      const messages = data as ChatMessage[];
      this.messageCache.set(sessionId, messages);
      
      return messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      
      // Fallback to offline storage
      return this.getOfflineMessages(sessionId);
    }
  }

  // AI Response Generation
  private async generateAIResponse(message: string, userId: string): Promise<AIResponse> {
    const intent = await this.analyzeIntent(message);
    const response = this.generateContextualResponse(message, intent);
    const actions = this.generateQuickReplies(intent);

    return {
      message: response,
      actions: actions.slice(0, 3),
      type: 'success'
    };
  }

  private async analyzeIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('password') || lowerMessage.includes('login') || lowerMessage.includes('access')) {
      return 'authentication';
    } else if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('broken')) {
      return 'technical_issue';
    } else if (lowerMessage.includes('account') || lowerMessage.includes('profile')) {
      return 'account_management';
    } else if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      return 'billing';
    }
    
    return 'general';
  }

  private generateContextualResponse(message: string, intent: string): string {
    const responses: Record<string, string[]> = {
      authentication: [
        "I can help you with login and authentication issues! Let me guide you through the process.",
        "Authentication problems can be frustrating. I'm here to help you get back into your account quickly.",
        "Let's resolve your login issue. I can assist with password resets, account lockouts, and more."
      ],
      technical_issue: [
        "Technical issues can be complex, but I'm here to help troubleshoot and find a solution.",
        "I understand you're experiencing a technical problem. Let me help you identify and resolve it.",
        "Technical difficulties happen, but together we can work through this step by step."
      ],
      account_management: [
        "I can help you manage your account settings and profile information.",
        "Account management is important for keeping your information secure and up-to-date.",
        "Let me assist you with any account-related changes or questions you have."
      ],
      billing: [
        "I can help you with billing inquiries, payment issues, and subscription management.",
        "Billing questions are important, and I'm here to help clarify any concerns you have.",
        "Let me assist you with your billing and payment-related needs."
      ],
      general: [
        "I'm here to help! Can you tell me more about what you need assistance with?",
        "I understand you need support. Let me help you find the best solution for your needs.",
        "Thank you for reaching out! I'm ready to assist you with whatever you need."
      ]
    };

    const intentResponses = responses[intent] || responses.general;
    return intentResponses[Math.floor(Math.random() * intentResponses.length)];
  }

  private generateQuickReplies(intent: string): Array<{ text: string; action: string }> {
    const quickReplies: Record<string, Array<{ text: string; action: string }>> = {
      authentication: [
        { text: "Reset my password", action: "password_reset" },
        { text: "Account locked", action: "account_unlock" },
        { text: "Two-factor authentication", action: "2fa_help" }
      ],
      technical_issue: [
        { text: "Report a bug", action: "create_ticket" },
        { text: "System status", action: "system_status" },
        { text: "Clear browser cache", action: "cache_help" }
      ],
      account_management: [
        { text: "Update profile", action: "profile_edit" },
        { text: "Change email", action: "email_change" },
        { text: "Privacy settings", action: "privacy_settings" }
      ],
      billing: [
        { text: "View invoices", action: "view_billing" },
        { text: "Update payment method", action: "payment_update" },
        { text: "Billing support", action: "billing_contact" }
      ],
      general: [
        { text: "Create support ticket", action: "create_ticket" },
        { text: "Contact human agent", action: "human_agent" },
        { text: "Help center", action: "help_center" }
      ]
    };

    return quickReplies[intent] || quickReplies.general;
  }

  // Offline Support
  private storeOfflineMessage(message: ChatMessage) {
    try {
      const offlineMessages = this.getOfflineMessages(message.session_id);
      offlineMessages.push(message);
      localStorage.setItem(`offline_messages_${message.session_id}`, JSON.stringify(offlineMessages));
    } catch (error) {
      console.error('Failed to store offline message:', error);
    }
  }

  private getOfflineMessages(sessionId: string): ChatMessage[] {
    try {
      const stored = localStorage.getItem(`offline_messages_${sessionId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline messages:', error);
      return [];
    }
  }

  private storeOfflineSession(session: ChatSession) {
    try {
      localStorage.setItem(`offline_session_${session.id}`, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store offline session:', error);
    }
  }

  // Utility Methods
  private async updateSessionActivity(sessionId: string) {
    try {
      await supabase
        .from('chat_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public getters
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Cleanup
  async disconnect() {
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.connectionStatus = 'disconnected';
    this.currentSessionId = null;
    this.messageCache.clear();
  }
}

export const enhancedChatService = EnhancedChatService.getInstance();