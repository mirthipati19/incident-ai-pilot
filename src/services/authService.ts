
// Legacy auth service - now delegates to unified auth service
import { unifiedAuthService, AuthResult } from './unifiedAuthService';
import { getAuthConfig, ADMIN_CONFIG, DEV_HELPERS } from '@/config/authConfig';

// Re-export types for backward compatibility
export type { AuthResult };

// Legacy function wrappers for backward compatibility
export const createAdminUserIfNeeded = async (): Promise<boolean> => {
  try {
    DEV_HELPERS.logAuthFlow('LEGACY_ADMIN_CREATE_CALLED', {});
    // The unified auth service handles admin creation automatically
    return true;
  } catch (error) {
    DEV_HELPERS.logAuthFlow('LEGACY_ADMIN_CREATE_ERROR', error);
    return false;
  }
};

export const adminDirectLogin = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
  DEV_HELPERS.logAuthFlow('LEGACY_ADMIN_LOGIN_CALLED', { email });
  return unifiedAuthService.signIn(email, password, true, captchaToken);
};

export const regularUserLogin = async (email: string, password: string, captchaToken?: string): Promise<AuthResult> => {
  DEV_HELPERS.logAuthFlow('LEGACY_USER_LOGIN_CALLED', { email });
  return unifiedAuthService.signIn(email, password, false, captchaToken);
};

export const completeMFALogin = async (email: string, password: string, mfaCode: string, captchaToken?: string): Promise<AuthResult> => {
  DEV_HELPERS.logAuthFlow('LEGACY_MFA_COMPLETE_CALLED', { email });
  return unifiedAuthService.verifyMFA(email, mfaCode, password, captchaToken);
};
