/**
 * Approval type definitions
 * Requirements: 5.1 - Approval management
 */

export interface Approval {
  id: string;
  userId: string;
  no: string;
  type: number; // 1=事假, 2=调休, 3=病假, 4=年假, 5=产假, 6=陪产假, 7=婚假, 8=丧假, 9=哺乳假
  status: number; // 0=未开始, 1=进行中, 2=已通过, 3=已撤销, 4=已拒绝
  title: string;
  abstract: string;
  reason: string;
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
  date: number;
  reason: string;
  day: number;
  checkType: number;
}

export interface ApprovalState {
  approvals: Approval[];
  loading: boolean;
  currentApproval: Approval | null;
}

export interface CreateLeaveApprovalRequest {
  type: number;
  startTime: number;
  endTime: number;
  duration: number;
  reason: string;
  timeType: number;
}

export interface CreateGoOutApprovalRequest {
  startTime: number;
  endTime: number;
  duration: number;
  reason: string;
}

export interface CreateMakeCardApprovalRequest {
  date: number;
  checkType: number;
  reason: string;
}

export interface DisposeApprovalRequest {
  id: string;
  action: 'approve' | 'reject';
  comment?: string;
}

// Approval type enum
export enum ApprovalType {
  PERSONAL_LEAVE = 1,  // 事假
  COMPENSATORY = 2,    // 调休
  SICK_LEAVE = 3,      // 病假
  ANNUAL_LEAVE = 4,    // 年假
  MATERNITY = 5,       // 产假
  PATERNITY = 6,       // 陪产假
  MARRIAGE = 7,        // 婚假
  BEREAVEMENT = 8,     // 丧假
  NURSING = 9,         // 哺乳假
}

// Approval status enum
export enum ApprovalStatus {
  NOT_STARTED = 0,     // 未开始
  IN_PROGRESS = 1,     // 进行中
  APPROVED = 2,        // 已通过
  CANCELLED = 3,       // 已撤销
  REJECTED = 4,        // 已拒绝
}
