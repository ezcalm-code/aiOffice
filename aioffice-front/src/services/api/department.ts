/**
 * Department API Service
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 - Department management API operations
 */

import { get, post, put, del } from '../http';
import type { 
  Department, 
  DepartmentUser,
  CreateDepartmentRequest, 
  UpdateDepartmentRequest,
  AssignUsersRequest
} from '../../types/department';
import type { ApiResponse } from '../../types';

// API endpoints - use /api prefix which gets rewritten to /v1 by Vite proxy
const DEPARTMENT_BASE = '/api/department';

/**
 * Department list response from API
 */
export interface DepartmentListResponse {
  count: number;
  data: Department[];
}

/**
 * Department members response from API
 */
export interface DepartmentMembersResponse {
  count: number;
  data: DepartmentUser[];
}

/**
 * Department list request parameters
 */
export interface DepartmentListParams {
  parentId?: string;
  page?: number;
  count?: number;
}

/**
 * Get department tree/list
 * Requirements: 6.1 - WHEN a user views the Department_Module THEN display the department tree structure
 * 
 * @param params Optional filter parameters
 * @returns Promise with department list response
 */
export async function getDepartments(params?: DepartmentListParams): Promise<ApiResponse<DepartmentListResponse>> {
  return get<DepartmentListResponse>(`${DEPARTMENT_BASE}/list`, params);
}


/**
 * Get single department by ID
 * Requirements: 6.4 - WHEN a user views their department info THEN display the department hierarchy
 * 
 * @param id Department ID
 * @returns Promise with department details
 */
export async function getDepartmentById(id: string): Promise<ApiResponse<Department>> {
  return get<Department>(`${DEPARTMENT_BASE}/${id}`);
}

/**
 * Get user's department info with hierarchy
 * Requirements: 6.4 - WHEN a user views their department info THEN display the department hierarchy from root to current
 * 
 * @param userId User ID
 * @returns Promise with department hierarchy
 */
export async function getUserDepartment(userId: string): Promise<ApiResponse<Department>> {
  return get<Department>(`${DEPARTMENT_BASE}/user/${userId}`);
}

/**
 * Create a new department
 * Requirements: 6.2 - WHEN an admin creates a department THEN allow setting name, parent department, and leader
 * 
 * @param data Department creation data
 * @returns Promise with created department ID
 */
export async function createDepartment(data: CreateDepartmentRequest): Promise<ApiResponse<{ id: string }>> {
  return post<{ id: string }>(DEPARTMENT_BASE, data);
}

/**
 * Update an existing department
 * Requirements: 6.2 - WHEN an admin creates/updates a department
 * 
 * @param data Department update data
 * @returns Promise with API response
 */
export async function updateDepartment(data: UpdateDepartmentRequest): Promise<ApiResponse<void>> {
  return put<void>(DEPARTMENT_BASE, data);
}

/**
 * Delete a department
 * Requirements: 6.5 - WHEN an admin deletes a department THEN confirm the action and handle cascading effects
 * 
 * @param id Department ID to delete
 * @returns Promise with API response
 */
export async function deleteDepartment(id: string): Promise<ApiResponse<void>> {
  return del<void>(`${DEPARTMENT_BASE}/${id}`);
}

/**
 * Get department members
 * Requirements: 6.3 - WHEN an admin assigns users to a department THEN update the department member list
 * 
 * @param depId Department ID
 * @returns Promise with department members
 */
export async function getDepartmentMembers(depId: string): Promise<ApiResponse<DepartmentMembersResponse>> {
  return get<DepartmentMembersResponse>(`${DEPARTMENT_BASE}/${depId}/members`);
}

/**
 * Assign users to a department
 * Requirements: 6.3 - WHEN an admin assigns users to a department THEN update the department member list
 * 
 * @param data Assign users request data
 * @returns Promise with API response
 */
export async function assignUsers(data: AssignUsersRequest): Promise<ApiResponse<void>> {
  return post<void>(`${DEPARTMENT_BASE}/assign`, data);
}

/**
 * Remove user from department
 * Requirements: 6.3 - Department member management
 * 
 * @param depId Department ID
 * @param userId User ID to remove
 * @returns Promise with API response
 */
export async function removeUserFromDepartment(depId: string, userId: string): Promise<ApiResponse<void>> {
  return del<void>(`${DEPARTMENT_BASE}/${depId}/members/${userId}`);
}

// Export default object with all methods
export default {
  getDepartments,
  getDepartmentById,
  getUserDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentMembers,
  assignUsers,
  removeUserFromDepartment,
};
