<script setup lang="ts">
/**
 * Todo View - Task management page
 * Requirements: 4.1, 4.2, 4.3, 4.4 - Todo management functionality
 */

import { ref, computed, onMounted } from 'vue';
import { useTodoStore } from '../stores/todo';
import { useUserStore } from '../stores/user';
import TodoList from '../components/todo/TodoList.vue';
import TodoForm from '../components/todo/TodoForm.vue';
import type { Todo, TodoFilters, CreateTodoRequest, UpdateTodoRequest, AddTodoRecordRequest } from '../types/todo';

const todoStore = useTodoStore();
const userStore = useUserStore();

// UI state
const showForm = ref(false);
const showDetail = ref(false);
const showRecordForm = ref(false);
const selectedTodo = ref<Todo | null>(null);
const recordContent = ref('');

// Filter state
const filterStatus = ref<number | undefined>(undefined);
const filterStartDate = ref<string>('');
const filterEndDate = ref<string>('');

// Computed properties
const todos = computed(() => todoStore.todosWithWarning);
const filteredTodos = computed(() => todoStore.filteredTodos);
const loading = computed(() => todoStore.isLoading);
const currentTodo = computed(() => todoStore.currentTodo);

// Status options for filter
const statusOptions = [
  { value: undefined, label: '全部' },
  { value: 0, label: '待处理' },
  { value: 1, label: '已完成' },
  { value: 2, label: '已取消' },
];

// Load todos on mount
onMounted(async () => {
  await todoStore.fetchTodos();
});


// Apply filters
function applyFilters() {
  const filters: TodoFilters = {};
  
  if (filterStatus.value !== undefined) {
    filters.status = filterStatus.value;
  }
  
  if (filterStartDate.value) {
    filters.startDate = Math.floor(new Date(filterStartDate.value).getTime() / 1000);
  }
  
  if (filterEndDate.value) {
    filters.endDate = Math.floor(new Date(filterEndDate.value).getTime() / 1000);
  }
  
  todoStore.setFilters(filters);
}

// Clear filters
function clearFilters() {
  filterStatus.value = undefined;
  filterStartDate.value = '';
  filterEndDate.value = '';
  todoStore.clearFilters();
}

// Show create form
function showCreateForm() {
  selectedTodo.value = null;
  showForm.value = true;
}

// Show edit form
function showEditForm(todo: Todo) {
  selectedTodo.value = todo;
  showForm.value = true;
}

// Close form
function closeForm() {
  showForm.value = false;
  selectedTodo.value = null;
}

// Handle form submit
async function handleFormSubmit(data: CreateTodoRequest | UpdateTodoRequest) {
  try {
    if ('id' in data && data.id) {
      await todoStore.updateExistingTodo(data as UpdateTodoRequest);
    } else {
      await todoStore.createNewTodo(data as CreateTodoRequest);
    }
    closeForm();
  } catch (error) {
    console.error('Failed to save todo:', error);
  }
}

// Handle todo selection (show detail)
async function handleTodoSelect(todo: Todo) {
  await todoStore.fetchTodoById(todo.id);
  showDetail.value = true;
}

// Close detail view
function closeDetail() {
  showDetail.value = false;
}


// Handle finish todo
async function handleFinishTodo(todo: Todo) {
  if (!userStore.id) {
    console.error('User not logged in');
    return;
  }
  
  try {
    await todoStore.markTodoAsFinished(userStore.id, todo.id);
  } catch (error) {
    console.error('Failed to finish todo:', error);
  }
}

// Handle delete todo
async function handleDeleteTodo(todo: Todo) {
  if (!confirm('确定要删除这个待办事项吗？')) return;
  
  try {
    await todoStore.removeExistingTodo(todo.id);
    if (showDetail.value) {
      closeDetail();
    }
  } catch (error) {
    console.error('Failed to delete todo:', error);
  }
}

// Show record form
function showAddRecordForm() {
  recordContent.value = '';
  showRecordForm.value = true;
}

// Close record form
function closeRecordForm() {
  showRecordForm.value = false;
  recordContent.value = '';
}

// Handle add record
async function handleAddRecord() {
  if (!currentTodo.value || !recordContent.value.trim()) return;
  
  const data: AddTodoRecordRequest = {
    todoId: currentTodo.value.id,
    content: recordContent.value.trim(),
  };
  
  try {
    await todoStore.addRecordToTodo(data);
    closeRecordForm();
  } catch (error) {
    console.error('Failed to add record:', error);
  }
}

// Format timestamp for display
function formatDateTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN');
}
</script>


<template>
  <div class="todo-view">
    <!-- Header -->
    <div class="view-header">
      <h1 class="view-title">待办事项</h1>
      <button class="btn btn-primary" @click="showCreateForm">
        + 新建待办
      </button>
    </div>
    
    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label class="filter-label">状态</label>
        <select v-model="filterStatus" class="filter-select" @change="applyFilters">
          <option v-for="opt in statusOptions" :key="opt.label" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">开始日期</label>
        <input 
          v-model="filterStartDate" 
          type="date" 
          class="filter-input"
          @change="applyFilters"
        />
      </div>
      
      <div class="filter-group">
        <label class="filter-label">结束日期</label>
        <input 
          v-model="filterEndDate" 
          type="date" 
          class="filter-input"
          @change="applyFilters"
        />
      </div>
      
      <button class="btn btn-secondary" @click="clearFilters">
        清除筛选
      </button>
    </div>
    
    <!-- Todo List -->
    <div class="todo-list-section">
      <TodoList
        :todos="filteredTodos.length > 0 || Object.keys(todoStore.filters).length > 0 
          ? filteredTodos.map(t => ({ ...t, hasDeadlineWarning: todoStore.isDeadlineApproaching(t) }))
          : todos"
        :loading="loading"
        @select="handleTodoSelect"
        @finish="handleFinishTodo"
        @delete="handleDeleteTodo"
      />
    </div>
    
    <!-- Create/Edit Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content">
        <TodoForm
          :todo="selectedTodo"
          :loading="loading"
          @submit="handleFormSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>

    
    <!-- Detail Modal -->
    <div v-if="showDetail && currentTodo" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content detail-modal">
        <div class="detail-header">
          <h2>{{ currentTodo.title }}</h2>
          <button class="btn-close" @click="closeDetail">×</button>
        </div>
        
        <div class="detail-body">
          <div class="detail-info">
            <p><strong>描述:</strong> {{ currentTodo.desc || '无' }}</p>
            <p><strong>截止时间:</strong> {{ formatDateTime(currentTodo.deadlineAt) }}</p>
            <p><strong>创建人:</strong> {{ currentTodo.creatorName }}</p>
            <p><strong>状态:</strong> 
              <span :class="'status-' + currentTodo.todoStatus">
                {{ currentTodo.todoStatus === 0 ? '待处理' : currentTodo.todoStatus === 1 ? '已完成' : '已取消' }}
              </span>
            </p>
          </div>
          
          <!-- Records Section -->
          <div class="records-section">
            <div class="records-header">
              <h3>操作记录</h3>
              <button class="btn btn-small" @click="showAddRecordForm">+ 添加记录</button>
            </div>
            
            <div v-if="currentTodo.records && currentTodo.records.length > 0" class="records-list">
              <div v-for="record in currentTodo.records" :key="record.createAt" class="record-item">
                <div class="record-header">
                  <span class="record-user">{{ record.userName }}</span>
                  <span class="record-time">{{ formatDateTime(record.createAt) }}</span>
                </div>
                <p class="record-content">{{ record.content }}</p>
              </div>
            </div>
            <p v-else class="no-records">暂无操作记录</p>
          </div>
        </div>
        
        <div class="detail-actions">
          <button class="btn btn-secondary" @click="showEditForm(currentTodo)">编辑</button>
          <button 
            v-if="currentTodo.todoStatus === 0" 
            class="btn btn-success"
            @click="handleFinishTodo(currentTodo)"
          >
            完成
          </button>
          <button class="btn btn-danger" @click="handleDeleteTodo(currentTodo)">删除</button>
        </div>
      </div>
    </div>
    
    <!-- Add Record Modal -->
    <div v-if="showRecordForm" class="modal-overlay" @click.self="closeRecordForm">
      <div class="modal-content record-modal">
        <h3>添加操作记录</h3>
        <textarea 
          v-model="recordContent" 
          class="record-textarea"
          placeholder="请输入记录内容"
          rows="4"
        ></textarea>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeRecordForm">取消</button>
          <button class="btn btn-primary" @click="handleAddRecord" :disabled="!recordContent.trim()">
            添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.todo-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.view-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.todo-list-section {
  min-height: 400px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #409eff;
  color: #fff;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-secondary {
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-secondary:hover {
  background: #e4e7ed;
}

.btn-success {
  background: #67c23a;
  color: #fff;
}

.btn-success:hover {
  background: #85ce61;
}

.btn-danger {
  background: #f56c6c;
  color: #fff;
}

.btn-danger:hover {
  background: #f78989;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.detail-modal {
  max-width: 700px;
}

.record-modal {
  padding: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
}

.detail-header h2 {
  margin: 0;
  font-size: 18px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}

.btn-close:hover {
  color: #303133;
}

.detail-body {
  padding: 24px;
}

.detail-info p {
  margin: 0 0 12px;
  font-size: 14px;
  color: #606266;
}

.status-0 { color: #409eff; }
.status-1 { color: #67c23a; }
.status-2 { color: #f56c6c; }

.records-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.records-header h3 {
  margin: 0;
  font-size: 16px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.record-user {
  font-weight: 500;
  color: #303133;
}

.record-time {
  color: #909399;
}

.record-content {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.no-records {
  color: #909399;
  font-size: 14px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
}

.record-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  margin: 16px 0;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .todo-view {
    padding: 16px;
  }
  
  .view-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-select,
  .filter-input {
    width: 100%;
  }
}
</style>
