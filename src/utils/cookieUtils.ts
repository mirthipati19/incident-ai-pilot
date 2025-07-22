
export interface SessionCookie {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  sessionToken?: string; // Add session token for tracking
}

const COOKIE_NAME = 'authexa_session';
const COOKIE_EXPIRY_DAYS = 7;

export const cookieUtils = {
  setSessionCookie: (sessionData: SessionCookie): void => {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
      
      const cookieValue = JSON.stringify(sessionData);
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(cookieValue)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax; Secure`;
      
      console.log('✅ Session cookie set successfully with session management');
    } catch (error) {
      console.error('❌ Failed to set session cookie:', error);
    }
  },

  getSessionCookie: (): SessionCookie | null => {
    try {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${COOKIE_NAME}=`)
      );
      
      if (!sessionCookie) {
        console.log('🍪 No session cookie found');
        return null;
      }
      
      const cookieValue = sessionCookie.split('=')[1];
      const sessionData = JSON.parse(decodeURIComponent(cookieValue));
      
      // Check if session is expired
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        console.log('⏰ Session cookie expired');
        cookieUtils.clearSessionCookie();
        return null;
      }
      
      console.log('✅ Session cookie retrieved successfully');
      return sessionData;
    } catch (error) {
      console.error('❌ Failed to get session cookie:', error);
      cookieUtils.clearSessionCookie();
      return null;
    }
  },

  clearSessionCookie: (): void => {
    try {
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
      console.log('🗑️ Session cookie cleared');
    } catch (error) {
      console.error('❌ Failed to clear session cookie:', error);
    }
  },

  updateSessionExpiry: (): void => {
    const sessionData = cookieUtils.getSessionCookie();
    if (sessionData) {
      const updatedSession = {
        ...sessionData,
        expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes from now
      };
      cookieUtils.setSessionCookie(updatedSession);
      console.log('🔄 Session expiry updated for session management');
    }
  },

  // New method to generate session token for tracking
  generateSessionToken: (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `session_${timestamp}_${random}`;
  }
};
