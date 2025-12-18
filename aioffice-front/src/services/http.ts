/**
 * HTTP Client Service
 * Requirements: 1.4 - JWT Token inclusion in all API request headers
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '../types';
import { getToken, removeToken } from '../utils/storage';

// API base URL - can be configured via environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
const TIMEOUT = 30000; // 30 seconds

/**
 * Create and configure Axios instance
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds JWT token to all requests
 * Requirements: 1.4 - WHILE a user is authenticated THEN the AIOffice_Frontend 
 * SHALL include the JWT_Token in all API request headers
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors globally
 * Requirements: 1.2 - WHEN a user's JWT_Token expires THEN redirect to login page
 */
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status } = error.response;
      
      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        removeToken();
        // Redirect to login page
        window.location.href = '/login';
      }
      
      // Handle 403 Forbidden - permission denied
      if (status === 403) {
        console.error('Permission denied');
      }
      
      // Handle 500 Server Error
      if (status >= 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error: No response received');
    }
    
    return Promise.reject(error);
  }
);

/**
 * HTTP GET request
 * @param url Request URL
 * @param params Query parameters
 */
export async function get<T>(url: string, params?: object): Promise<ApiResponse<T>> {
  const response = await httpClient.get<ApiResponse<T>>(url, { params });
  return response.data;
}

/**
 * HTTP POST request
 * @param url Request URL
 * @param data Request body
 */
export async function post<T>(url: string, data?: object): Promise<ApiResponse<T>> {
  const response = await httpClient.post<ApiResponse<T>>(url, data);
  return response.data;
}

/**
 * HTTP PUT request
 * @param url Request URL
 * @param data Request body
 */
export async function put<T>(url: string, data?: object): Promise<ApiResponse<T>> {
  const response = await httpClient.put<ApiResponse<T>>(url, data);
  return response.data;
}

/**
 * HTTP DELETE request
 * @param url Request URL
 */
export async function del<T>(url: string): Promise<ApiResponse<T>> {
  const response = await httpClient.delete<ApiResponse<T>>(url);
  return response.data;
}

/**
 * Upload file with multipart/form-data
 * @param url Request URL
 * @param formData FormData object containing file
 * @param onProgress Progress callback
 */
export async function upload<T>(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<T>> {
  const response = await httpClient.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
  return response.data;
}

// Export the axios instance for advanced usage
export { httpClient };

// Export default object with all methods
export default {
  get,
  post,
  put,
  delete: del,
  upload,
};
