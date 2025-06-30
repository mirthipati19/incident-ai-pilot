
// Authentication configuration with environment-based modes
export interface AuthConfig {
  developerMode: boolean;
  bypassMFA: boolean;
  bypassCaptcha: boolean;
  enableConsoleOTP: boolean;
  mockAdminLogin: boolean;
}

export const getAuthConfig = (): AuthConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.DEV;
  
  return {
    developerMode: isDevelopment,
    bypassMFA: isDevelopment,
    bypassCaptcha: isDevelopment,
    enableConsoleOTP: isDevelopment,
    mockAdminLogin: isDevelopment
  };
};

// Admin configuration
export const ADMIN_CONFIG = {
  SUPER_ADMIN_EMAIL: 'murari.mirthipati@authexa.me',
  SUPER_ADMIN_PASSWORD: 'Qwertyuiop@0987654321',
  DEFAULT_ADMIN_USER_ID: '000001'
};

// Development mode helpers
export const DEV_HELPERS = {
  logAuthFlow: (step: string, data: any) => {
    if (getAuthConfig().developerMode) {
      console.log(`🔐 [DEV AUTH] ${step}:`, data);
    }
  },
  logMFACode: (email: string, code: string) => {
    if (getAuthConfig().enableConsoleOTP) {
      console.log(`📱 [DEV MFA] OTP for ${email}: ${code}`);
      console.log('💡 Copy this code to the MFA input field');
    }
  }
};
