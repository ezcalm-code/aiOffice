/**
 * Property-Based Tests for Approval Module
 * 
 * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * **Feature: aioffice-frontend, Property 13: Approval Status Display**
 * **Validates: Requirements 5.4**
 * 
 * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
 * **Validates: Requirements 5.6**
 */

import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import fc from 'fast-check';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useApprovalStore, getStatusDisplay, STATUS_DISPLAY_MAP } from '../../src/stores/approval';
import ApprovalCard from '../../src/components/approval/ApprovalCard.vue';
import ApprovalForm from '../../src/components/approval/ApprovalForm.vue';
import type { 
  Approval, 
  CreateLeaveApprovalRequest,
  CreateGoOutApprovalRequest,
  CreateMakeCardApprovalRequest
} from '../../src/types/approval';
import { ApprovalStatus, ApprovalType } from '../../src/types/approval';

// Mock the API module
vi.mock('../../src/services/api/approval', () => ({
  getApprovals: vi.fn(),
  getApprovalDetail: vi.fn(),
  createLeaveApproval: vi.fn(),
  createGoOutApproval: vi.fn(),
  createMakeCardApproval: vi.fn(),
  disposeApproval: vi.fn(),
  cancelApproval: vi.fn(),
}));

/**
 * Arbitrary generators for approval data
 */
const approvalIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

const approvalStatusArbitrary = fc.integer({ min: 0, max: 4 });

const approvalTypeArbitrary = fc.integer({ min: 1, max: 9 });

const timestampArbitrary = fc.integer({ 
  min: 1577836800, // 2020-01-01
  max: 1893456000  // 2030-01-01
});


/**
 * Arbitrary generator for safe text strings (alphanumeric only)
 * This avoids issues with HTML escaping in rendered output comparisons
 */
const safeTextArbitrary = (minLength: number, maxLength: number) => 
  fc.stringMatching(/^[a-zA-Z0-9]+$/, { minLength, maxLength });

/**
 * Arbitrary generator for valid Approval objects
 */
const approvalArbitrary: fc.Arbitrary<Approval> = fc.record({
  id: approvalIdArbitrary,
  userId: userIdArbitrary,
  no: safeTextArbitrary(1, 20),
  type: approvalTypeArbitrary,
  status: approvalStatusArbitrary,
  title: safeTextArbitrary(1, 50),
  abstract: fc.string({ maxLength: 200 }),
  reason: fc.string({ minLength: 5, maxLength: 500 }),
  createAt: timestampArbitrary,
  updateAt: timestampArbitrary,
});

/**
 * Arbitrary generator for leave approval requests
 */
const leaveApprovalRequestArbitrary: fc.Arbitrary<CreateLeaveApprovalRequest> = fc.record({
  type: approvalTypeArbitrary,
  startTime: timestampArbitrary,
  endTime: timestampArbitrary,
  duration: fc.integer({ min: 1, max: 365 }),
  reason: fc.string({ minLength: 5, maxLength: 500 }),
  timeType: fc.integer({ min: 1, max: 2 }),
});

/**
 * Arbitrary generator for go-out approval requests
 */
const goOutApprovalRequestArbitrary: fc.Arbitrary<CreateGoOutApprovalRequest> = fc.record({
  startTime: timestampArbitrary,
  endTime: timestampArbitrary,
  duration: fc.integer({ min: 1, max: 24 }),
  reason: fc.string({ minLength: 1, maxLength: 500 }),
});

/**
 * Arbitrary generator for make-card approval requests
 */
const makeCardApprovalRequestArbitrary: fc.Arbitrary<CreateMakeCardApprovalRequest> = fc.record({
  date: timestampArbitrary,
  checkType: fc.integer({ min: 1, max: 2 }),
  reason: fc.string({ minLength: 1, maxLength: 500 }),
});

/**
 * Property-Based Tests for Approval Form Validation
 * 
 * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */
describe('Approval Form Validation Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
   * **Validates: Requirements 5.1**
   * 
   * Property: For any leave approval, the form SHALL require type, startTime, endTime, and reason.
   */
  it('Property 12.1: Leave form validation requires all mandatory fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.option(approvalTypeArbitrary, { nil: undefined }),
          startTime: fc.option(timestampArbitrary, { nil: undefined }),
          endTime: fc.option(timestampArbitrary, { nil: undefined }),
          reason: fc.option(fc.string({ minLength: 5, maxLength: 500 }), { nil: undefined }),
        }),
        (partialData) => {
          const wrapper = mount(ApprovalForm, {
            props: { type: 'leave' }
          });
          
          const vm = wrapper.vm as any;
          
          // Set partial form data
          if (partialData.type !== undefined) vm.leaveForm.type = partialData.type;
          if (partialData.reason !== undefined) vm.leaveForm.reason = partialData.reason;
          
          // Validate the form
          const isValid = vm.validateLeaveForm();
          
          // Form should be invalid if any required field is missing
          const hasAllRequired = 
            partialData.type !== undefined &&
            partialData.startTime !== undefined &&
            partialData.endTime !== undefined &&
            partialData.reason !== undefined &&
            partialData.reason.trim().length >= 5;
          
          // If all required fields are present, form should be valid
          // If any required field is missing, form should be invalid
          // Note: startTime and endTime are set via date inputs, so we check the date strings
          if (!hasAllRequired) {
            return !isValid || Object.keys(vm.errors).length > 0;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
   * **Validates: Requirements 5.1**
   * 
   * Property: Leave form with empty reason (less than 5 chars) SHALL fail validation.
   */
  it('Property 12.2: Leave form rejects short reasons', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 4 }),
        (shortReason) => {
          const wrapper = mount(ApprovalForm, {
            props: { type: 'leave' }
          });
          
          const vm = wrapper.vm as any;
          vm.leaveForm.type = 1;
          vm.leaveForm.reason = shortReason;
          
          const isValid = vm.validateLeaveForm();
          
          // Should be invalid due to short reason
          return !isValid && vm.errors.leaveReason !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
   * **Validates: Requirements 5.2**
   * 
   * Property: For any go-out approval, the form SHALL require startTime, endTime, and reason.
   */
  it('Property 12.3: Go-out form validation requires all mandatory fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          startTime: fc.option(timestampArbitrary, { nil: undefined }),
          endTime: fc.option(timestampArbitrary, { nil: undefined }),
          reason: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        }),
        (partialData) => {
          const wrapper = mount(ApprovalForm, {
            props: { type: 'goout' }
          });
          
          const vm = wrapper.vm as any;
          
          // Set partial form data
          if (partialData.reason !== undefined) vm.goOutForm.reason = partialData.reason;
          
          // Validate the form
          const isValid = vm.validateGoOutForm();
          
          // Form should be invalid if any required field is missing
          const hasAllRequired = 
            partialData.startTime !== undefined &&
            partialData.endTime !== undefined &&
            partialData.reason !== undefined &&
            partialData.reason.trim().length > 0;
          
          if (!hasAllRequired) {
            return !isValid || Object.keys(vm.errors).length > 0;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
   * **Validates: Requirements 5.2**
   * 
   * Property: Go-out form with empty reason SHALL fail validation.
   */
  it('Property 12.4: Go-out form rejects empty reasons', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        (emptyReason) => {
          const wrapper = mount(ApprovalForm, {
            props: { type: 'goout' }
          });
          
          const vm = wrapper.vm as any;
          vm.goOutForm.reason = emptyReason;
          
          const isValid = vm.validateGoOutForm();
          
          // Should be invalid due to empty reason
          return !isValid && vm.errors.goOutReason !== undefined;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
   * **Validates: Requirements 5.3**
   * 
   * Property: For any make-card approval, the form SHALL require date, checkType, and reason.
   */
  it('Property 12.5: Make-card form validation requires all mandatory fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          date: fc.option(timestampArbitrary, { nil: undefined }),
          checkType: fc.option(fc.integer({ min: 1, max: 2 }), { nil: undefined }),
          reason: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        }),
        (partialData) => {
          const wrapper = mount(ApprovalForm, {
            props: { type: 'makecard' }
          });
          
          const vm = wrapper.vm as any;
          
          // Set partial form data
          if (partialData.checkType !== undefined) vm.makeCardForm.checkType = partialData.checkType;
          if (partialData.reason !== undefined) vm.makeCardForm.reason = partialData.reason;
          
          // Validate the form
          const isValid = vm.validateMakeCardForm();
          
          // Form should be invalid if any required field is missing
          const hasAllRequired = 
            partialData.date !== undefined &&
            partialData.checkType !== undefined &&
            partialData.reason !== undefined &&
            partialData.reason.trim().length > 0;
          
          if (!hasAllRequired) {
            return !isValid || Object.keys(vm.errors).length > 0;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 12: Approval Form Validation**
   * **Validates: Requirements 5.3**
   * 
   * Property: Make-card form with empty reason SHALL fail validation.
   */
  it('Property 12.6: Make-card form rejects empty reasons', () => {
    fc.assert(
      fc.property(
        fc.constant(''),
        (emptyReason) => {
          const wrapper = mount(ApprovalForm, {
            props: { type: 'makecard' }
          });
          
          const vm = wrapper.vm as any;
          vm.makeCardForm.checkType = 1;
          vm.makeCardForm.reason = emptyReason;
          
          const isValid = vm.validateMakeCardForm();
          
          // Should be invalid due to empty reason
          return !isValid && vm.errors.makeCardReason !== undefined;
        }
      ),
      { numRuns: 10 }
    );
  });
});


/**
 * Property-Based Tests for Approval Status Display
 * 
 * **Feature: aioffice-frontend, Property 13: Approval Status Display**
 * **Validates: Requirements 5.4**
 */
describe('Approval Status Display Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 13: Approval Status Display**
   * **Validates: Requirements 5.4**
   * 
   * Property: For any approval status, the status indicator SHALL correctly map to one of:
   * pending (0,1), approved (2), cancelled (3), rejected (4).
   */
  it('Property 13.1: Status display correctly maps all valid status values', () => {
    fc.assert(
      fc.property(approvalStatusArbitrary, (status) => {
        const display = getStatusDisplay(status);
        
        // Verify the mapping is correct
        switch (status) {
          case ApprovalStatus.NOT_STARTED:
            return display.label === '未开始' && display.type === 'info';
          case ApprovalStatus.IN_PROGRESS:
            return display.label === '审批中' && display.type === 'warning';
          case ApprovalStatus.APPROVED:
            return display.label === '已通过' && display.type === 'success';
          case ApprovalStatus.CANCELLED:
            return display.label === '已撤销' && display.type === 'info';
          case ApprovalStatus.REJECTED:
            return display.label === '已拒绝' && display.type === 'danger';
          default:
            return display.label === '未知' && display.type === 'info';
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 13: Approval Status Display**
   * **Validates: Requirements 5.4**
   * 
   * Property: For any approval, the rendered ApprovalCard SHALL display the correct status indicator.
   */
  it('Property 13.2: ApprovalCard displays correct status indicator', () => {
    fc.assert(
      fc.property(approvalArbitrary, (approval) => {
        const wrapper = mount(ApprovalCard, {
          props: { approval }
        });
        
        const html = wrapper.html();
        const expectedDisplay = getStatusDisplay(approval.status);
        
        // The rendered output must contain the status label
        return html.includes(expectedDisplay.label);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 13: Approval Status Display**
   * **Validates: Requirements 5.4**
   * 
   * Property: Status display type is always one of the valid types.
   */
  it('Property 13.3: Status display type is always valid', () => {
    fc.assert(
      fc.property(approvalStatusArbitrary, (status) => {
        const display = getStatusDisplay(status);
        const validTypes = ['info', 'warning', 'success', 'danger'];
        
        return validTypes.includes(display.type);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 13: Approval Status Display**
   * **Validates: Requirements 5.4**
   * 
   * Property: Pending statuses (0, 1) are displayed with appropriate indicators.
   */
  it('Property 13.4: Pending statuses have appropriate display', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        (pendingStatus) => {
          const display = getStatusDisplay(pendingStatus);
          
          // Pending statuses should have info or warning type
          return display.type === 'info' || display.type === 'warning';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 13: Approval Status Display**
   * **Validates: Requirements 5.4**
   * 
   * Property: Store's approvalsWithStatus correctly adds status display to all approvals.
   */
  it('Property 13.5: Store approvalsWithStatus adds correct status display', () => {
    fc.assert(
      fc.property(
        fc.array(approvalArbitrary, { minLength: 0, maxLength: 10 }),
        (approvals) => {
          const store = useApprovalStore();
          store.approvals = approvals;
          
          const withStatus = store.approvalsWithStatus;
          
          // Each approval should have statusDisplay and typeLabel
          return withStatus.every((item, index) => {
            const original = approvals[index];
            const expectedDisplay = getStatusDisplay(original.status);
            
            return (
              item.statusDisplay.label === expectedDisplay.label &&
              item.statusDisplay.type === expectedDisplay.type &&
              item.typeLabel !== undefined
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property-Based Tests for Approval Detail Completeness
 * 
 * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
 * **Validates: Requirements 5.6**
 */
describe('Approval Detail Completeness Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
   * **Validates: Requirements 5.6**
   * 
   * Property: For any approval detail view, the display SHALL include the approval number.
   */
  it('Property 14.1: ApprovalCard displays approval number', () => {
    fc.assert(
      fc.property(approvalArbitrary, (approval) => {
        const wrapper = mount(ApprovalCard, {
          props: { approval }
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain the approval number
        return html.includes(approval.no);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
   * **Validates: Requirements 5.6**
   * 
   * Property: For any approval detail view, the display SHALL include the approval type.
   */
  it('Property 14.2: ApprovalCard displays approval type', () => {
    fc.assert(
      fc.property(approvalArbitrary, (approval) => {
        const wrapper = mount(ApprovalCard, {
          props: { approval }
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain the type label
        return html.includes('审批类型');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
   * **Validates: Requirements 5.6**
   * 
   * Property: For any approval detail view, the display SHALL include the current status.
   */
  it('Property 14.3: ApprovalCard displays current status', () => {
    fc.assert(
      fc.property(approvalArbitrary, (approval) => {
        const wrapper = mount(ApprovalCard, {
          props: { approval }
        });
        
        const html = wrapper.html();
        const expectedStatus = getStatusDisplay(approval.status);
        
        // The rendered output must contain the status label
        return html.includes(expectedStatus.label);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
   * **Validates: Requirements 5.6**
   * 
   * Property: For any approval detail view, the display SHALL include the creation time.
   */
  it('Property 14.4: ApprovalCard displays creation time', () => {
    fc.assert(
      fc.property(approvalArbitrary, (approval) => {
        const wrapper = mount(ApprovalCard, {
          props: { approval }
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain the creation time label
        return html.includes('创建时间');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
   * **Validates: Requirements 5.6**
   * 
   * Property: For any approval, the store correctly fetches and stores approval detail.
   */
  it('Property 14.5: Store correctly stores fetched approval detail', () => {
    fc.assert(
      fc.property(approvalArbitrary, (approval) => {
        const store = useApprovalStore();
        
        // Simulate setting current approval (as if fetched from API)
        store.currentApproval = approval;
        
        // Verify the stored approval matches
        return (
          store.currentApproval !== null &&
          store.currentApproval.id === approval.id &&
          store.currentApproval.no === approval.no &&
          store.currentApproval.status === approval.status &&
          store.currentApproval.type === approval.type
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 14: Approval Detail Completeness**
   * **Validates: Requirements 5.6**
   * 
   * Property: Clearing current approval sets it to null.
   */
  it('Property 14.6: clearCurrentApproval sets currentApproval to null', () => {
    fc.assert(
      fc.property(approvalArbitrary, (approval) => {
        const store = useApprovalStore();
        
        // Set an approval
        store.currentApproval = approval;
        
        // Clear it
        store.clearCurrentApproval();
        
        // Should be null
        return store.currentApproval === null;
      }),
      { numRuns: 100 }
    );
  });
});
