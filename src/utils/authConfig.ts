
export const authConfig = {
  // Development mode detection - DISABLED for production
  isDevelopment: false,
  
  // Admin configuration
  adminEmail: 'murari.mirthipati@authexa.me',
  adminPassword: 'Authexa@2024!Admin',
  adminUserId: '000001',
  
  // MFA configuration
  mfaSettings: {
    tokenLength: 6,
    expirationMinutes: 10,
    bypassInDev: false, // Always require MFA
  },
  
  // Captcha configuration  
  captchaSettings: {
    bypassInDev: false, // Always require captcha
    required: true, // Always require captcha
  },
  
  // Session configuration
  sessionSettings: {
    timeoutMinutes: 30, // Standard 30 minute timeout
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  },
  
  // Logging configuration
  logging: {
    verbose: false, // Disable verbose logging
    logMFACodes: false, // Never log MFA codes
    logAuthEvents: true, // Keep auth event logging
  }
};

export const getAuthMode = () => {
  return 'PRODUCTION';
};

export const shouldBypassCaptcha = () => {
  return false; // Never bypass captcha
};

export const shouldBypassMFA = (email?: string) => {
  return false; // Never bypass MFA
};

export const logAuthEvent = (event: string, data?: any) => {
  if (authConfig.logging.logAuthEvents) {
    console.log(`🔐 [PRODUCTION] ${event}:`, data);
  }
};
