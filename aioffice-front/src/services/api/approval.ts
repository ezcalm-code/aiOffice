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
  // 后端是 POST /list，不是 GET
  // 过滤掉空值参数，避免传空字符串导致后端报错
  const cleanParams: Record<string, unknown> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
  }
  return post<ApprovalListResponse>(`${APPROVAL_BASE}/list`, Object.keys(cleanParams).length > 0 ? cleanParams : {});
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
 * Create an approval (unified endpoint for all types)
 * Requirements: 5.1, 5.2, 5.3 - Create approval with type-specific data
 * 
 * @param data Approval creation data (leave, goOut, or makeCard)
 * @returns Promise with created approval ID
 */
export async function createApproval(data: CreateLeaveApprovalRequest | CreateGoOutApprovalRequest | CreateMakeCardApprovalRequest): Promise<ApiResponse<{ id: string }>> {
  console.log('Creating approval with data:', JSON.stringify(data, null, 2));
  return post<{ id: string }>(APPROVAL_BASE, data);
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

// Export default object with all methods
export default {
  getApprovals,
  getApprovalDetail,
  createApproval,
  disposeApproval,
};
