/**
 * Todo API Service
 * Requirements: 4.1, 4.2, 4.3 - Todo management API operations
 */

import { get, post, put, del } from '../http';
import type { 
  Todo, 
  TodoRecord, 
  CreateTodoRequest, 
  UpdateTodoRequest,
  AddTodoRecordRequest 
} from '../../types/todo';
import type { ApiResponse } from '../../types';

// API endpoints - use /api prefix which gets rewritten to /v1 by Vite proxy
const TODO_BASE = '/api/todo';

/**
 * Todo list response from API
 */
export interface TodoListResponse {
  count: number;
  data: Todo[];
}

/**
 * Todo list request parameters
 */
export interface TodoListParams {
  id?: string;
  userId?: string;
  page?: number;
  count?: number;
  startTime?: number;
  endTime?: number;
}

/**
 * Get todo list with optional filters
 * Requirements: 4.1 - WHEN a user views the Todo_Module THEN display a list of todos
 * 
 * @param params Optional filter parameters
 * @returns Promise with todo list response
 */
export async function getTodos(params?: TodoListParams): Promise<ApiResponse<TodoListResponse>> {
  return get<TodoListResponse>(`${TODO_BASE}/list`, params);
}

/**
 * Get single todo by ID
 * 
 * @param id Todo ID
 * @returns Promise with todo details
 */
export async function getTodoById(id: string): Promise<ApiResponse<Todo>> {
  return get<Todo>(`${TODO_BASE}/${id}`);
}


/**
 * Create a new todo
 * Requirements: 4.2 - WHEN a user creates a new todo THEN submit the todo data
 * 
 * @param data Todo creation data
 * @returns Promise with created todo ID
 */
export async function createTodo(data: CreateTodoRequest): Promise<ApiResponse<{ id: string }>> {
  return post<{ id: string }>(TODO_BASE, data);
}

/**
 * Update an existing todo
 * Requirements: 4.3 - WHEN a user marks a todo as complete THEN update the todo status
 * 
 * @param data Todo update data
 * @returns Promise with API response
 */
export async function updateTodo(data: UpdateTodoRequest): Promise<ApiResponse<void>> {
  return put<void>(TODO_BASE, data);
}

/**
 * Delete a todo
 * 
 * @param id Todo ID to delete
 * @returns Promise with API response
 */
export async function deleteTodo(id: string): Promise<ApiResponse<void>> {
  return del<void>(`${TODO_BASE}/${id}`);
}

/**
 * Mark a todo as finished
 * Requirements: 4.3 - WHEN a user marks a todo as complete THEN update the todo status
 * 
 * @param userId User ID
 * @param todoId Todo ID
 * @returns Promise with API response
 */
export async function finishTodo(userId: string, todoId: string): Promise<ApiResponse<void>> {
  return post<void>(`${TODO_BASE}/finish`, { userId, todoId });
}

/**
 * Add a record to a todo
 * Requirements: 4.4 - WHEN a user adds a record to a todo THEN append the record
 * 
 * @param data Record data
 * @returns Promise with API response
 */
export async function addTodoRecord(data: AddTodoRecordRequest): Promise<ApiResponse<void>> {
  return post<void>(`${TODO_BASE}/record`, data);
}

// Export default object with all methods
export default {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  finishTodo,
  addTodoRecord,
};
