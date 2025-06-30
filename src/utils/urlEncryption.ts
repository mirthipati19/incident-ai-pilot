
// Simple URL obfuscation utility
export const encodeUrlParam = (value: string): string => {
  return btoa(encodeURIComponent(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const decodeUrlParam = (encoded: string): string => {
  try {
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return decodeURIComponent(atob(padded));
  } catch {
    return '';
  }
};

export const generateSessionToken = (): string => {
  return btoa(Date.now() + '_' + Math.random().toString(36).substring(2));
};
