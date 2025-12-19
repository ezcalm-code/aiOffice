/**
 * User Store - Pinia state management for user authentication
 * Requirements: 1.1, 1.2, 1.3 - User authentication, token expiry, logout
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  login as authLogin, 
  logout as authLogout, 
  getToken, 
  isAuthenticated as checkAuth 
} from '../services/auth';
import { getUser, setUser } from '../utils/storage';
import type { UserState, LoginResponse } from '../types';

export const useUserStore = defineStore('user', () => {
  // State
  const id = ref<string>('');
  const name = ref<string>('');
  const token = ref<string>('');
  const isAuthenticated = ref<boolean>(false);

  // Getters
  const userState = computed<UserState>(() => ({
    id: id.value,
    name: name.value,
    token: token.value,
    isAuthenticated: isAuthenticated.value,
  }));

  const isLoggedIn = computed(() => isAuthenticated.value && !!token.value);

  /**
   * Initialize store from storage
   * Called on app startup to restore user session
   */
  function initialize(): void {
    const storedToken = getToken();
    const storedUser = getUser();
    
    if (storedToken && checkAuth()) {
      token.value = storedToken;
      isAuthenticated.value = true;
      
      if (storedUser) {
        id.value = storedUser.id;
        name.value = storedUser.name;
      }
    } else {
      // Clear invalid session
      resetState();
    }
  }

  /**
   * Login action
   * Requirements: 1.1 - WHEN a user submits valid credentials THEN authenticate and store JWT_Token
   * 
   * @param username User's name
   * @param password User's password
   * @returns Login response with user info
   */
  async function login(username: string, password: string): Promise<LoginResponse> {
    const response = await authLogin(username, password);
    
    // Update store state
    id.value = response.id;
    name.value = response.name;
    token.value = response.token;
    isAuthenticated.value = true;
    
    return response;
  }

  /**
   * Logout action
   * Requirements: 1.3 - WHEN a user clicks logout THEN clear JWT_Token and redirect to login
   */
  function logout(): void {
    // Reset store state
    resetState();
    
    // Clear storage and redirect (handled by auth service)
    authLogout();
  }

  /**
   * Reset store state to initial values
   */
  function resetState(): void {
    id.value = '';
    name.value = '';
    token.value = '';
    isAuthenticated.value = false;
  }

  /**
   * Update user info
   * @param userInfo Partial user info to update
   */
  function updateUser(userInfo: Partial<{ id: string; name: string }>): void {
    if (userInfo.id !== undefined) {
      id.value = userInfo.id;
    }
    if (userInfo.name !== undefined) {
      name.value = userInfo.name;
    }
    
    // Persist to storage
    if (id.value && name.value) {
      setUser({ id: id.value, name: name.value });
    }
  }

  /**
   * Check and refresh authentication status
   * Requirements: 1.2 - WHEN JWT_Token expires THEN redirect to login page
   * 
   * @returns true if still authenticated, false otherwise
   */
  function checkAuthentication(): boolean {
    const stillAuthenticated = checkAuth();
    
    if (!stillAuthenticated && isAuthenticated.value) {
      // Token expired - reset state
      resetState();
    }
    
    isAuthenticated.value = stillAuthenticated;
    return stillAuthenticated;
  }

  return {
    // State
    id,
    name,
    token,
    isAuthenticated,
    
    // Getters
    userState,
    isLoggedIn,
    
    // Actions
    initialize,
    login,
    logout,
    resetState,
    updateUser,
    checkAuthentication,
  };
});
