
// Enhanced URL obfuscation and security utility
export const encodeUrlParam = (value: string): string => {
  try {
    // Add timestamp and random salt for additional security
    const timestamp = Date.now().toString(36);
    const salt = Math.random().toString(36).substring(2, 15);
    const payload = JSON.stringify({ value, timestamp, salt });
    
    return btoa(encodeURIComponent(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch {
    return '';
  }
};

export const decodeUrlParam = (encoded: string): string => {
  try {
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const decoded = decodeURIComponent(atob(padded));
    const payload = JSON.parse(decoded);
    
    // Check if the timestamp is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timestamp = parseInt(payload.timestamp, 36);
    
    if (Date.now() - timestamp > maxAge) {
      console.warn('URL parameter has expired');
      return '';
    }
    
    return payload.value || '';
  } catch {
    return '';
  }
};

export const generateSessionToken = (): string => {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return btoa(`${timestamp}_${random1}_${random2}`);
};

export const validateSessionToken = (token: string): boolean => {
  try {
    const decoded = atob(token);
    const parts = decoded.split('_');
    
    if (parts.length !== 3) return false;
    
    const timestamp = parseInt(parts[0], 36);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return (Date.now() - timestamp) <= maxAge;
  } catch {
    return false;
  }
};

// Security headers utility
export const getSecurityHeaders = () => {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
};

// Rate limiting utility
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    return true;
  };
};
