/**
 * Approval type definitions
 * Requirements: 5.1 - Approval management
 */

// 审批人信息
export interface Approver {
  userId: string;
  userName: string;
  status: number;
  reason?: string;
}

export interface Approval {
  id: string;
  userId: string;
  no: string;
  type: number; // 1=事假, 2=调休, 3=病假, 4=年假, 5=产假, 6=陪产假, 7=婚假, 8=丧假, 9=哺乳假
  status: number; // 0=未开始, 1=进行中, 2=已通过, 3=已撤销, 4=已拒绝
  title: string;
  abstract: string;
  reason: string;
  // 详情接口返回的额外字段
  user?: Approver;
  approver?: Approver;
  approvers?: Approver[];
  copyPersons?: Approver[];
  // 完成时间相关
  finishAt?: number;
  finishDay?: number;
  finishMonth?: number;
  finishYeas?: number;
  // 具体审批类型数据
  leave?: LeaveInfo;
  goOut?: GoOutInfo;
  makeCard?: MakeCardInfo;
  createAt: number;
  updateAt: number;
}

export interface LeaveInfo {
  type: number;
  startTime: number;
  endTime: number;
  duration: number;
  reason: string;
  timeType: number; // 1=小时, 2=天
}

export interface GoOutInfo {
  startTime: number;
  endTime: number;
  duration: number;
  reason: string;
}

export interface MakeCardInfo {
  date?: number;           // 补卡时间
  reason?: string;         // 补卡理由
  day?: number;            // 补卡日期(20221011)
  workCheckType?: number;  // 补卡类型
}

export interface ApprovalState {
  approvals: Approval[];
  loading: boolean;
  currentApproval: Approval | null;
}

// 创建审批的基础字段
export interface CreateApprovalBase {
  userId: string;       // 用户ID
  type: number;         // 审批类型
  title?: string;       // 标题
  abstract?: string;    // 摘要
  reason?: string;      // 原因
}

// 创建请假审批
export interface CreateLeaveApprovalRequest extends CreateApprovalBase {
  leave: LeaveInfo;
}

// 创建外出审批
export interface CreateGoOutApprovalRequest extends CreateApprovalBase {
  goOut: GoOutInfo;
}

// 创建补卡审批
export interface CreateMakeCardApprovalRequest extends CreateApprovalBase {
  makeCard: MakeCardInfo;
}

export interface DisposeApprovalRequest {
  status: number;      // 审批状态
  reason: string;      // 审批理由
  approvalId: string;  // 审批ID
}

// Approval type constants
export const ApprovalType = {
  PERSONAL_LEAVE: 1,  // 事假
  COMPENSATORY: 2,    // 调休
  SICK_LEAVE: 3,      // 病假
  ANNUAL_LEAVE: 4,    // 年假
  MATERNITY: 5,       // 产假
  PATERNITY: 6,       // 陪产假
  MARRIAGE: 7,        // 婚假
  BEREAVEMENT: 8,     // 丧假
  NURSING: 9,         // 哺乳假
} as const;

// Approval status constants
export const ApprovalStatus = {
  NOT_STARTED: 0,     // 未开始
  IN_PROGRESS: 1,     // 进行中
  APPROVED: 2,        // 已通过
  CANCELLED: 3,       // 已撤销
  REJECTED: 4,        // 已拒绝
} as const;
