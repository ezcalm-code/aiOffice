/**
 * Todo type definitions
 * Requirements: 4.1 - Todo management
 */

export interface Todo {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  deadlineAt: number; // Unix timestamp
  desc: string;
  status: number;
  records: TodoRecord[];
  executeIds: string[];
  todoStatus: number;
}

export interface TodoRecord {
  todoId: string;
  userId: string;
  userName: string;
  content: string;
  image: string;
  createAt: number;
}

export interface TodoFilters {
  status?: number;
  startDate?: number;
  endDate?: number;
}

export interface TodoState {
  todos: Todo[];
  loading: boolean;
  filters: TodoFilters;
}

export interface CreateTodoRequest {
  title: string;
  desc: string;
  deadlineAt: number;
  executeIds: string[];
}

export interface UpdateTodoRequest {
  id: string;
  title?: string;
  desc?: string;
  deadlineAt?: number;
  status?: number;
  executeIds?: string[];
}

export interface AddTodoRecordRequest {
  todoId: string;
  content: string;
  image?: string;
}
