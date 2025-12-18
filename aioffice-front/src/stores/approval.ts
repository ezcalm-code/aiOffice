/**
 * Approval Store - Pinia state management for approval functionality
 * Requirements: 5.4, 5.6 - Approval management
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  Approval, 
  ApprovalState,
  CreateLeaveApprovalRequest,
  CreateGoOutApprovalRequest,
  CreateMakeCardApprovalRequest,
  DisposeApprovalRequest
} from '../types/approval';
import { ApprovalStatus } from '../types/approval';
import { 
  getApprovals, 
  getApprovalDetail, 
  createLeaveApproval,
  createGoOutApproval,
  createMakeCardApproval,
  disposeApproval,
  cancelApproval,
  type ApprovalListParams
} from '../services/api/approval';

/**
 * Status display mapping
 * Requirements: 5.4 - Display approvals with status indicators (pending, approved, rejected, cancelled)
 * Property 13: Approval Status Display
 */
export interface StatusDisplay {
  label: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export const STATUS_DISPLAY_MAP: Record<number, StatusDisplay> = {
  [ApprovalStatus.NOT_STARTED]: { label: '未开始', type: 'info' },
  [ApprovalStatus.IN_PROGRESS]: { label: '审批中', type: 'warning' },
  [ApprovalStatus.APPROVED]: { label: '已通过', type: 'success' },
  [ApprovalStatus.CANCELLED]: { label: '已撤销', type: 'info' },
  [ApprovalStatus.REJECTED]: { label: '已拒绝', type: 'danger' },
};

/**
 * Get status display info for an approval status
 * Property 13: Approval Status Display - correctly map status to display
 */
export function getStatusDisplay(status: number): StatusDisplay {
  return STATUS_DISPLAY_MAP[status] || { label: '未知', type: 'info' };
}


/**
 * Approval type display mapping
 */
export const APPROVAL_TYPE_MAP: Record<number, string> = {
  1: '事假',
  2: '调休',
  3: '病假',
  4: '年假',
  5: '产假',
  6: '陪产假',
  7: '婚假',
  8: '丧假',
  9: '哺乳假',
};

/**
 * Get approval type label
 */
export function getApprovalTypeLabel(type: number): string {
  return APPROVAL_TYPE_MAP[type] || '未知类型';
}

export const useApprovalStore = defineStore('approval', () => {
  // State
  const approvals = ref<Approval[]>([]);
  const loading = ref<boolean>(false);
  const currentApproval = ref<Approval | null>(null);

  // Getters
  const approvalState = computed<ApprovalState>(() => ({
    approvals: approvals.value,
    loading: loading.value,
    currentApproval: currentApproval.value,
  }));

  const isLoading = computed(() => loading.value);

  /**
   * Get approvals with status display info
   * Property 13: Approval Status Display
   */
  const approvalsWithStatus = computed(() => {
    return approvals.value.map(approval => ({
      ...approval,
      statusDisplay: getStatusDisplay(approval.status),
      typeLabel: getApprovalTypeLabel(approval.type),
    }));
  });

  /**
   * Set loading state
   * Property 3: Loading State Management
   */
  function setLoading(isLoading: boolean): void {
    loading.value = isLoading;
  }

  /**
   * Fetch approvals from API
   * Requirements: 5.4 - WHEN a user views approval list THEN display approvals
   */
  async function fetchApprovals(params?: ApprovalListParams): Promise<void> {
    setLoading(true);
    try {
      const response = await getApprovals(params);
      if (response.code === 0 && response.data) {
        approvals.value = response.data.data || [];
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch single approval by ID
   * Requirements: 5.6 - WHEN a user views approval details THEN display complete approval chain
   * Property 14: Approval Detail Completeness
   */
  async function fetchApprovalDetail(id: string): Promise<Approval | null> {
    setLoading(true);
    try {
      const response = await getApprovalDetail(id);
      if (response.code === 0 && response.data) {
        currentApproval.value = response.data;
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch approval detail:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }


  /**
   * Create a leave approval
   * Requirements: 5.1 - WHEN a user creates a leave approval
   * Property 12: Approval Form Validation
   */
  async function createLeave(data: CreateLeaveApprovalRequest): Promise<string | null> {
    setLoading(true);
    try {
      const response = await createLeaveApproval(data);
      if (response.code === 0 && response.data) {
        await fetchApprovals();
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create leave approval:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a go-out approval
   * Requirements: 5.2 - WHEN a user creates an out-of-office approval
   * Property 12: Approval Form Validation
   */
  async function createGoOut(data: CreateGoOutApprovalRequest): Promise<string | null> {
    setLoading(true);
    try {
      const response = await createGoOutApproval(data);
      if (response.code === 0 && response.data) {
        await fetchApprovals();
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create go-out approval:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a make-card approval
   * Requirements: 5.3 - WHEN a user creates a make-up card approval
   * Property 12: Approval Form Validation
   */
  async function createMakeCard(data: CreateMakeCardApprovalRequest): Promise<string | null> {
    setLoading(true);
    try {
      const response = await createMakeCardApproval(data);
      if (response.code === 0 && response.data) {
        await fetchApprovals();
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create make-card approval:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Dispose (approve/reject) an approval
   * Requirements: 5.5 - WHEN an approver processes an approval
   */
  async function dispose(data: DisposeApprovalRequest): Promise<boolean> {
    setLoading(true);
    try {
      const response = await disposeApproval(data);
      if (response.code === 0) {
        // Update local state
        const index = approvals.value.findIndex(a => a.id === data.id);
        if (index !== -1) {
          const newStatus = data.action === 'approve' 
            ? ApprovalStatus.APPROVED 
            : ApprovalStatus.REJECTED;
          approvals.value[index] = { ...approvals.value[index], status: newStatus };
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to dispose approval:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Cancel an approval
   */
  async function cancel(id: string): Promise<boolean> {
    setLoading(true);
    try {
      const response = await cancelApproval(id);
      if (response.code === 0) {
        // Update local state
        const index = approvals.value.findIndex(a => a.id === id);
        if (index !== -1) {
          approvals.value[index] = { 
            ...approvals.value[index], 
            status: ApprovalStatus.CANCELLED 
          };
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel approval:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Clear current approval
   */
  function clearCurrentApproval(): void {
    currentApproval.value = null;
  }

  /**
   * Clear all approvals
   */
  function clearApprovals(): void {
    approvals.value = [];
    currentApproval.value = null;
  }

  return {
    // State
    approvals,
    loading,
    currentApproval,

    // Getters
    approvalState,
    isLoading,
    approvalsWithStatus,

    // Helper functions (exported for testing)
    getStatusDisplay,
    getApprovalTypeLabel,

    // Actions
    setLoading,
    fetchApprovals,
    fetchApprovalDetail,
    createLeave,
    createGoOut,
    createMakeCard,
    dispose,
    cancel,
    clearCurrentApproval,
    clearApprovals,
  };
});
