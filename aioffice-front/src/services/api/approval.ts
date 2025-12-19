/**
 * Approval API Service
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 - Approval management API operations
 */

import { get, post, put } from '../http';
import type { 
  Approval, 
  CreateLeaveApprovalRequest,
  CreateGoOutApprovalRequest,
  CreateMakeCardApprovalRequest,
  DisposeApprovalRequest
} from '../../types/approval';
import type { ApiResponse } from '../../types';

// API endpoints - use /api prefix which gets rewritten to /v1 by Vite proxy
const APPROVAL_BASE = '/api/approval';

/**
 * Approval list response from API
 */
export interface ApprovalListResponse {
  count: number;
  data: Approval[];
}

/**
 * Approval list request parameters
 */
export interface ApprovalListParams {
  userId?: string;
  type?: number;
  status?: number;
  page?: number;
  count?: number;
}

/**
 * Get approval list with optional filters
 * Requirements: 5.4 - WHEN a user views approval list THEN display approvals with status indicators
 * 
 * @param params Optional filter parameters
 * @returns Promise with approval list response
 */
export async function getApprovals(params?: ApprovalListParams): Promise<ApiResponse<ApprovalListResponse>> {
  return get<ApprovalListResponse>(`${APPROVAL_BASE}/list`, params);
}

/**
 * Get single approval by ID
 * Requirements: 5.6 - WHEN a user views approval details THEN display complete approval chain
 * 
 * @param id Approval ID
 * @returns Promise with approval details
 */
export async function getApprovalDetail(id: string): Promise<ApiResponse<Approval>> {
  return get<Approval>(`${APPROVAL_BASE}/${id}`);
}


/**
 * Create a leave approval
 * Requirements: 5.1 - WHEN a user creates a leave approval THEN collect leave type, times, duration, reason
 * 
 * @param data Leave approval creation data
 * @returns Promise with created approval ID
 */
export async function createLeaveApproval(data: CreateLeaveApprovalRequest): Promise<ApiResponse<{ id: string }>> {
  return post<{ id: string }>(`${APPROVAL_BASE}/leave`, data);
}

/**
 * Create a go-out approval
 * Requirements: 5.2 - WHEN a user creates an out-of-office approval THEN collect times, duration, reason
 * 
 * @param data Go-out approval creation data
 * @returns Promise with created approval ID
 */
export async function createGoOutApproval(data: CreateGoOutApprovalRequest): Promise<ApiResponse<{ id: string }>> {
  return post<{ id: string }>(`${APPROVAL_BASE}/goout`, data);
}

/**
 * Create a make-card approval
 * Requirements: 5.3 - WHEN a user creates a make-up card approval THEN collect date, check type, reason
 * 
 * @param data Make-card approval creation data
 * @returns Promise with created approval ID
 */
export async function createMakeCardApproval(data: CreateMakeCardApprovalRequest): Promise<ApiResponse<{ id: string }>> {
  return post<{ id: string }>(`${APPROVAL_BASE}/makecard`, data);
}

/**
 * Dispose (approve/reject) an approval
 * Requirements: 5.5 - WHEN an approver processes an approval THEN allow approve or reject with comments
 * 
 * @param data Dispose approval request data
 * @returns Promise with API response
 */
export async function disposeApproval(data: DisposeApprovalRequest): Promise<ApiResponse<void>> {
  return put<void>(`${APPROVAL_BASE}/dispose`, data);
}

/**
 * Cancel an approval
 * 
 * @param id Approval ID to cancel
 * @returns Promise with API response
 */
export async function cancelApproval(id: string): Promise<ApiResponse<void>> {
  return put<void>(`${APPROVAL_BASE}/cancel`, { id });
}

// Export default object with all methods
export default {
  getApprovals,
  getApprovalDetail,
  createLeaveApproval,
  createGoOutApproval,
  createMakeCardApproval,
  disposeApproval,
  cancelApproval,
};
