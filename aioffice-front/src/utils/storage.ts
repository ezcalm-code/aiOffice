/**
 * Local storage utilities
 * Requirements: 1.1 - User authentication (token storage)
 */

const TOKEN_KEY = 'aioffice_token';
const USER_KEY = 'aioffice_user';

/**
 * Get an item from localStorage
 * @param key Storage key
 */
export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
}

/**
 * Set an item in localStorage
 * @param key Storage key
 * @param value Value to store
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Remove an item from localStorage
 * @param key Storage key
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

/**
 * Clear all items from localStorage
 */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Get JWT token from storage
 * Requirements: 1.1 - User authentication
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Set JWT token in storage
 * Requirements: 1.1 - User authentication
 * @param token JWT token
 */
export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
}

/**
 * Remove JWT token from storage
 * Requirements: 1.3 - User logout
 */
export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
}

/**
 * Check if token exists in storage
 */
export function hasToken(): boolean {
  return !!getToken();
}

/**
 * Get user info from storage
 */
export function getUser(): { id: string; name: string } | null {
  return getStorageItem<{ id: string; name: string }>(USER_KEY);
}

/**
 * Set user info in storage
 * @param user User info object
 */
export function setUser(user: { id: string; name: string }): void {
  setStorageItem(USER_KEY, user);
}

/**
 * Remove user info from storage
 */
export function removeUser(): void {
  removeStorageItem(USER_KEY);
}

/**
 * Clear all auth-related storage (token and user)
 * Requirements: 1.3 - User logout
 */
export function clearAuth(): void {
  removeToken();
  removeUser();
}
