<script setup lang="ts">
/**
 * TodoCard Component - Displays a single todo item
 * Requirements: 4.1 - Display todo with title, deadline, status, and assignees
 * Property 6: Todo List Rendering Completeness
 */

import { computed } from 'vue';
import type { Todo } from '../../types/todo';
import { formatDateTime } from '../../utils/date';

interface Props {
  todo: Todo & { hasDeadlineWarning?: boolean };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'click', todo: Todo): void;
  (e: 'finish', todo: Todo): void;
  (e: 'delete', todo: Todo): void;
}>();

// Format deadline for display
const formattedDeadline = computed(() => {
  if (!props.todo.deadlineAt) return '无截止日期';
  return formatDateTime(props.todo.deadlineAt * 1000);
});

// Get status text
const statusText = computed(() => {
  switch (props.todo.todoStatus) {
    case 0: return '待处理';
    case 1: return '已完成';
    case 2: return '已取消';
    default: return '未知';
  }
});

// Get status class
const statusClass = computed(() => {
  switch (props.todo.todoStatus) {
    case 0: return 'status-pending';
    case 1: return 'status-completed';
    case 2: return 'status-cancelled';
    default: return '';
  }
});

// Check if todo is completed
const isCompleted = computed(() => props.todo.todoStatus === 1);


// Handle card click
function handleClick() {
  emit('click', props.todo);
}

// Handle finish button click
function handleFinish(event: Event) {
  event.stopPropagation();
  emit('finish', props.todo);
}

// Handle delete button click
function handleDelete(event: Event) {
  event.stopPropagation();
  emit('delete', props.todo);
}
</script>

<template>
  <div 
    class="todo-card"
    :class="{ 
      'todo-completed': isCompleted,
      'todo-warning': todo.hasDeadlineWarning && !isCompleted
    }"
    @click="handleClick"
  >
    <div class="todo-header">
      <h3 class="todo-title">{{ todo.title }}</h3>
      <span class="todo-status" :class="statusClass">{{ statusText }}</span>
    </div>
    
    <p v-if="todo.desc" class="todo-desc">{{ todo.desc }}</p>
    
    <div class="todo-meta">
      <div class="todo-deadline" :class="{ 'deadline-warning': todo.hasDeadlineWarning && !isCompleted }">
        <span class="meta-label">截止时间:</span>
        <span class="meta-value">{{ formattedDeadline }}</span>
      </div>
      
      <div v-if="todo.creatorName" class="todo-creator">
        <span class="meta-label">创建人:</span>
        <span class="meta-value">{{ todo.creatorName }}</span>
      </div>
      
      <div v-if="todo.executeIds && todo.executeIds.length > 0" class="todo-assignees">
        <span class="meta-label">执行人:</span>
        <span class="meta-value">{{ todo.executeIds.length }}人</span>
      </div>
    </div>
    
    <div class="todo-actions">
      <button 
        v-if="!isCompleted" 
        class="btn btn-finish"
        @click="handleFinish"
      >
        完成
      </button>
      <button 
        class="btn btn-delete"
        @click="handleDelete"
      >
        删除
      </button>
    </div>
  </div>
</template>


<style scoped>
.todo-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
}

.todo-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.todo-completed {
  border-left-color: #67c23a;
  opacity: 0.8;
}

.todo-warning {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.todo-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.todo-completed .todo-title {
  text-decoration: line-through;
  color: #909399;
}

.todo-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-pending {
  background: #ecf5ff;
  color: #409eff;
}

.status-completed {
  background: #f0f9eb;
  color: #67c23a;
}

.status-cancelled {
  background: #fef0f0;
  color: #f56c6c;
}

.todo-desc {
  margin: 0 0 12px;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.meta-label {
  margin-right: 4px;
}

.meta-value {
  color: #606266;
}

.deadline-warning .meta-value {
  color: #e6a23c;
  font-weight: 500;
}

.todo-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-finish {
  background: #67c23a;
  color: #fff;
}

.btn-finish:hover {
  background: #85ce61;
}

.btn-delete {
  background: #f56c6c;
  color: #fff;
}

.btn-delete:hover {
  background: #f78989;
}
</style>
