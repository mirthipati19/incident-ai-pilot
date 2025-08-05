import { supabase } from '@/integrations/supabase/client';

export interface AIMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isTyping?: boolean;
  actions?: Array<{
    text: string;
    action: string;
  }>;
}

export class AIChatService {
  private static instance: AIChatService;
  
  static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  async sendMessage(message: string, userId: string): Promise<AIMessage> {
    try {
      // Fallback intelligent response system
      const intent = await this.analyzeIntent(message);
      const response = this.generateContextualResponse(message, intent);
      const actions = this.generateQuickReplies(intent);

      return {
        id: Date.now().toString(),
        text: response,
        isBot: true,
        timestamp: new Date(),
        actions: actions.slice(0, 3) // Limit to 3 actions
      };
    } catch (error) {
      console.error('AI Chat Service Error:', error);
      return {
        id: Date.now().toString(),
        text: "I'm experiencing some technical difficulties. Please try again or contact support directly.",
        isBot: true,
        timestamp: new Date()
      };
    }
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

  async analyzeIntent(message: string): Promise<string> {
    // Simple intent analysis - can be enhanced with more sophisticated NLP
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

  generateQuickReplies(intent: string): Array<{ text: string; action: string }> {
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
        { text: "Delete account", action: "account_deletion" }
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
}