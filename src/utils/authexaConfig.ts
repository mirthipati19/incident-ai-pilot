
// Authexa Support Configuration
export const AUTHEXA_CONFIG = {
  SUPPORT_NAME: 'Authexa Support',
  COMPANY_NAME: 'Authexa',
  LOGO_URL: '/lovable-uploads/c94935e4-6231-41ae-993c-155a820c9885.png',
  BACKGROUND_IMAGE: '/lovable-uploads/c94935e4-6231-41ae-993c-155a820c9885.png',
  
  // Chat Support Webhook - Updated for Authexa
  CHAT_WEBHOOK_URL: 'https://authexa.app.n8n.cloud/webhook-test/64d38da4-3add-46d8-a8d2-88eea11f29b6',
  
  // Voice Assistant Configuration
  VAPI_CONFIG: {
    API_KEY: '2474c624-2391-475a-a306-71d6c4642924',
    ASSISTANT_ID: '8352c787-40ac-44e6-b77e-b8a903b3f2d9',
    WEBHOOK_URL: 'https://api.authexa.com/webhook/voice-support'
  },
  
  // Admin Configuration
  ADMIN_EMAIL: 'murari.mirthipati@authexa.me',
  ADMIN_PASSWORD: 'Qwertyuiop@0987654321',
  
  // Auto-resolution settings
  AUTO_RESOLUTION: {
    ENABLED: true,
    TIMEOUT_SECONDS: 30, // Auto-close resolved incidents after 30 seconds
    AI_CONFIDENCE_THRESHOLD: 0.75
  },
  
  // Session management
  SESSION_CONFIG: {
    CALL_TIMEOUT_MINUTES: 30,
    IDLE_TIMEOUT_MINUTES: 15,
    LOG_SESSIONS: true
  }
};

// Helper functions
export const getAuthexaConfig = () => AUTHEXA_CONFIG;

export const isAdminUser = (email?: string) => {
  return email === AUTHEXA_CONFIG.ADMIN_EMAIL;
};

export const getWebhookUrl = (type: 'chat' | 'voice') => {
  switch (type) {
    case 'chat':
      return AUTHEXA_CONFIG.CHAT_WEBHOOK_URL;
    case 'voice':
      return AUTHEXA_CONFIG.VAPI_CONFIG.WEBHOOK_URL;
    default:
      return '';
  }
};
