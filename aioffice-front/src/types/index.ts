/**
 * Type definitions index
 * Re-exports all type definitions for convenient imports
 */

export * from './user';
export * from './chat';
export * from './todo';
export * from './approval';
export * from './department';

// Common API response type
export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}

// Common API error type
export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
}

// Pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
