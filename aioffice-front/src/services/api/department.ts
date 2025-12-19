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
// Backend uses /v1/dep as the route group
const DEPARTMENT_BASE = '/api/dep';

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
 * Get department SOA (tree structure with users)
 * Requirements: 6.1 - WHEN a user views the Department_Module THEN display the department tree structure
 * 
 * @returns Promise with department SOA response
 */
export async function getDepartmentSoa(): Promise<ApiResponse<Department>> {
  return get<Department>(`${DEPARTMENT_BASE}/soa`);
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
 * Set department users
 * Requirements: 6.3 - WHEN an admin assigns users to a department THEN update the department member list
 * 
 * @param data Set department users request data
 * @returns Promise with API response
 */
export async function setDepartmentUsers(data: AssignUsersRequest): Promise<ApiResponse<void>> {
  return post<void>(`${DEPARTMENT_BASE}/user`, data);
}

/**
 * Add user to department
 * Requirements: 6.3 - Department member management
 * 
 * @param depId Department ID
 * @param userId User ID to add
 * @returns Promise with API response
 */
export async function addDepartmentUser(depId: string, userId: string): Promise<ApiResponse<void>> {
  return post<void>(`${DEPARTMENT_BASE}/user/add`, { depId, userId });
}

/**
 * Remove user from department
 * Requirements: 6.3 - Department member management
 * 
 * @param depId Department ID
 * @param userId User ID to remove
 * @returns Promise with API response
 */
export async function removeDepartmentUser(depId: string, userId: string): Promise<ApiResponse<void>> {
  return del<void>(`${DEPARTMENT_BASE}/user/remove`, { data: { depId, userId } });
}

// Export default object with all methods
export default {
  getDepartmentSoa,
  getDepartmentById,
  getUserDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  setDepartmentUsers,
  addDepartmentUser,
  removeDepartmentUser,
};
