/**
 * Department type definitions
 * Requirements: 6.1 - Department management
 */

export interface Department {
  id: string;
  name: string;
  parentId: string;
  parentPath: string;
  level: number;
  leaderId: string;
  leader: string;
  count: number;
  child: Department[];
  users?: DepartmentUser[];  // SOA接口返回的用户列表
}

export interface DepartmentUser {
  id: string;
  userId: string;
  depId: string;
  userName: string;
}

export interface DepartmentState {
  departments: Department[];
  currentDepartment: Department | null;
  members: DepartmentUser[];
  loading: boolean;
}

export interface CreateDepartmentRequest {
  name: string;
  parentId?: string;
  leaderId?: string;
}

export interface UpdateDepartmentRequest {
  id: string;
  name?: string;
  parentId?: string;
  leaderId?: string;
}

export interface AssignUsersRequest {
  depId: string;
  userIds: string[];
}
