<script setup lang="ts">
/**
 * TodoForm Component - Form for creating/editing todos
 * Requirements: 4.2 - Create new todo with title, deadline, description
 */

import { ref, computed, watch } from 'vue';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../types/todo';

interface Props {
  todo?: Todo | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  todo: null,
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit', data: CreateTodoRequest | UpdateTodoRequest): void;
  (e: 'cancel'): void;
}>();

// Form data
const title = ref('');
const desc = ref('');
const deadlineAt = ref<string>('');
const executeIds = ref<string[]>([]);

// Form validation errors
const errors = ref<Record<string, string>>({});

// Check if editing existing todo
const isEditing = computed(() => !!props.todo?.id);

// Form title
const formTitle = computed(() => isEditing.value ? '编辑待办' : '新建待办');

// Initialize form with todo data when editing
watch(() => props.todo, (newTodo) => {
  if (newTodo) {
    title.value = newTodo.title || '';
    desc.value = newTodo.desc || '';
    if (newTodo.deadlineAt) {
      // Convert timestamp to datetime-local format
      const date = new Date(newTodo.deadlineAt * 1000);
      deadlineAt.value = formatDateTimeLocal(date);
    }
    executeIds.value = newTodo.executeIds || [];
  } else {
    resetForm();
  }
}, { immediate: true });

// Format date for datetime-local input
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


// Validate form
function validate(): boolean {
  errors.value = {};
  
  if (!title.value.trim()) {
    errors.value.title = '请输入待办标题';
  }
  
  if (!deadlineAt.value) {
    errors.value.deadlineAt = '请选择截止时间';
  }
  
  return Object.keys(errors.value).length === 0;
}

// Handle form submission
function handleSubmit() {
  if (!validate()) return;
  
  // Convert datetime-local to timestamp
  const deadlineTimestamp = Math.floor(new Date(deadlineAt.value).getTime() / 1000);
  
  if (isEditing.value && props.todo) {
    const updateData: UpdateTodoRequest = {
      id: props.todo.id,
      title: title.value.trim(),
      desc: desc.value.trim(),
      deadlineAt: deadlineTimestamp,
      executeIds: executeIds.value,
    };
    emit('submit', updateData);
  } else {
    const createData: CreateTodoRequest = {
      title: title.value.trim(),
      desc: desc.value.trim(),
      deadlineAt: deadlineTimestamp,
      executeIds: executeIds.value,
    };
    emit('submit', createData);
  }
}

// Handle cancel
function handleCancel() {
  emit('cancel');
}

// Reset form
function resetForm() {
  title.value = '';
  desc.value = '';
  deadlineAt.value = '';
  executeIds.value = [];
  errors.value = {};
}
</script>

<template>
  <div class="todo-form">
    <h3 class="form-title">{{ formTitle }}</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title" class="form-label">标题 <span class="required">*</span></label>
        <input
          id="title"
          v-model="title"
          type="text"
          class="form-input"
          :class="{ 'input-error': errors.title }"
          placeholder="请输入待办标题"
          :disabled="loading"
        />
        <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
      </div>
      
      <div class="form-group">
        <label for="deadline" class="form-label">截止时间 <span class="required">*</span></label>
        <input
          id="deadline"
          v-model="deadlineAt"
          type="datetime-local"
          class="form-input"
          :class="{ 'input-error': errors.deadlineAt }"
          :disabled="loading"
        />
        <span v-if="errors.deadlineAt" class="error-message">{{ errors.deadlineAt }}</span>
      </div>
      
      <div class="form-group">
        <label for="desc" class="form-label">描述</label>
        <textarea
          id="desc"
          v-model="desc"
          class="form-textarea"
          placeholder="请输入待办描述（可选）"
          rows="4"
          :disabled="loading"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button 
          type="button" 
          class="btn btn-cancel"
          :disabled="loading"
          @click="handleCancel"
        >
          取消
        </button>
        <button 
          type="submit" 
          class="btn btn-submit"
          :disabled="loading"
        >
          {{ loading ? '提交中...' : (isEditing ? '保存' : '创建') }}
        </button>
      </div>
    </form>
  </div>
</template>


<style scoped>
.todo-form {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.form-title {
  margin: 0 0 24px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.required {
  color: #f56c6c;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #303133;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.form-input:disabled,
.form-textarea:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

.input-error {
  border-color: #f56c6c;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.error-message {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-cancel:hover:not(:disabled) {
  background: #e4e7ed;
}

.btn-submit {
  background: #409eff;
  color: #fff;
}

.btn-submit:hover:not(:disabled) {
  background: #66b1ff;
}
</style>
