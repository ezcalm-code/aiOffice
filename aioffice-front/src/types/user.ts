/**
 * User type definitions
 * Requirements: 1.1 - User authentication
 */

export interface User {
  id: string;
  name: string;
  password?: string;
  status: number; // 0=禁用, 1=启用
}

export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  token: string;
  accessExpire: number;
}

export interface UserState {
  id: string;
  name: string;
  token: string;
  isAuthenticated: boolean;
}
