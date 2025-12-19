/**
 * Authentication Service
 * Requirements: 1.1, 1.2, 1.3 - User authentication, token expiry, logout
 */

import { post } from './http';
import type { LoginRequest, LoginResponse } from '../types';
import { 
  getToken as getStoredToken, 
  setToken, 
  setUser, 
  clearAuth 
} from '../utils/storage';

// Token expiry time storage key
const TOKEN_EXPIRE_KEY = 'aioffice_token_expire';

/**
 * Login user with credentials
 * Requirements: 1.1 - WHEN a user submits valid credentials THEN the AIOffice_Frontend 
 * SHALL authenticate the user and store the JWT_Token securely
 * 
 * @param name Username
 * @param password User password
 * @returns Login response with user info and token
 */
export async function login(name: string, password: string): Promise<LoginResponse> {
  const request: LoginRequest = { name, password };
  const response = await post<LoginResponse>('/api/user/login', request);
  
  // Backend returns code 200 for success
  if (response.code === 200 && response.data) {
    const { id, name: userName, token, accessExpire } = response.data;
    
    // Store token securely
    setToken(token);
    
    // Store token expiry time
    const expireTime = Date.now() + accessExpire * 1000;
    localStorage.setItem(TOKEN_EXPIRE_KEY, expireTime.toString());
    
    // Store user info
    setUser({ id, name: userName });
    
    return response.data;
  }
  
  throw new Error(response.msg || 'Login failed');
}

/**
 * Logout user and clear all auth data
 * Requirements: 1.3 - WHEN a user clicks logout THEN the AIOffice_Frontend 
 * SHALL clear the JWT_Token and redirect to the login page
 */
export function logout(): void {
  // Clear all auth-related storage
  clearAuth();
  
  // Clear token expiry
  localStorage.removeItem(TOKEN_EXPIRE_KEY);
  
  // Redirect to login page
  window.location.href = '/login';
}

/**
 * Get current JWT token
 * @returns JWT token or null if not authenticated
 */
export function getToken(): string | null {
  return getStoredToken();
}

/**
 * Check if user is authenticated
 * Requirements: 1.2 - WHEN a user's JWT_Token expires THEN redirect to login page
 * 
 * @returns true if user has valid token, false otherwise
 */
export function isAuthenticated(): boolean {
  const token = getStoredToken();
  
  if (!token) {
    return false;
  }
  
  // Check if token has expired
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY);
  if (expireTimeStr) {
    const expireTime = parseInt(expireTimeStr, 10);
    if (Date.now() >= expireTime) {
      // Token expired - clear auth and return false
      clearAuth();
      localStorage.removeItem(TOKEN_EXPIRE_KEY);
      return false;
    }
  }
  
  return true;
}

/**
 * Check token validity and redirect if expired
 * Requirements: 1.2 - WHEN a user's JWT_Token expires THEN redirect to login page
 */
export function checkTokenExpiry(): void {
  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = '/login';
  }
}

/**
 * Get token expiry time
 * @returns Expiry timestamp in milliseconds, or null if not set
 */
export function getTokenExpiry(): number | null {
  const expireTimeStr = localStorage.getItem(TOKEN_EXPIRE_KEY);
  if (expireTimeStr) {
    return parseInt(expireTimeStr, 10);
  }
  return null;
}

/**
 * Get remaining token validity time in milliseconds
 * @returns Remaining time in ms, or 0 if expired/not set
 */
export function getTokenRemainingTime(): number {
  const expireTime = getTokenExpiry();
  if (!expireTime) {
    return 0;
  }
  
  const remaining = expireTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

// Export default object with all methods
export default {
  login,
  logout,
  getToken,
  isAuthenticated,
  checkTokenExpiry,
  getTokenExpiry,
  getTokenRemainingTime,
};
