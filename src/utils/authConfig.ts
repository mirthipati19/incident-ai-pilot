
export const authConfig = {
  // Development mode detection
  isDevelopment: import.meta.env.DEV,
  
  // Admin configuration
  adminEmail: 'murari.mirthipati@authexa.me',
  adminPassword: 'Qwertyuiop@0987654321',
  adminUserId: '000001',
  
  // MFA configuration
  mfaSettings: {
    tokenLength: 6,
    expirationMinutes: 10,
    bypassInDev: import.meta.env.DEV,
  },
  
  // Captcha configuration  
  captchaSettings: {
    bypassInDev: import.meta.env.DEV,
    required: !import.meta.env.DEV,
  },
  
  // Session configuration
  sessionSettings: {
    timeoutMinutes: import.meta.env.DEV ? 120 : 30, // Longer timeout in dev
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  },
  
  // Logging configuration
  logging: {
    verbose: import.meta.env.DEV,
    logMFACodes: import.meta.env.DEV,
    logAuthEvents: import.meta.env.DEV,
  }
};

export const getAuthMode = () => {
  return authConfig.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION';
};

export const shouldBypassCaptcha = () => {
  return authConfig.captchaSettings.bypassInDev && authConfig.isDevelopment;
};

export const shouldBypassMFA = (email?: string) => {
  // Always bypass MFA for admin in development
  if (authConfig.isDevelopment && email === authConfig.adminEmail) {
    return true;
  }
  return false;
};

export const logAuthEvent = (event: string, data?: any) => {
  if (authConfig.logging.logAuthEvents) {
    console.log(`🔐 [${getAuthMode()}] ${event}:`, data);
  }
};
