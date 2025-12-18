<script setup lang="ts">
/**
 * TodoList Component - Displays a list of todo items
 * Requirements: 4.1 - Display a list of todos with title, deadline, status, and assignees
 * Property 6: Todo List Rendering Completeness
 */

import { computed } from 'vue';
import type { Todo } from '../../types/todo';
import TodoCard from './TodoCard.vue';

interface Props {
  todos: (Todo & { hasDeadlineWarning?: boolean })[];
  loading?: boolean;
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: '暂无待办事项',
});

const emit = defineEmits<{
  (e: 'select', todo: Todo): void;
  (e: 'finish', todo: Todo): void;
  (e: 'delete', todo: Todo): void;
}>();

// Check if list is empty
const isEmpty = computed(() => props.todos.length === 0);

// Handle todo card click
function handleTodoClick(todo: Todo) {
  emit('select', todo);
}

// Handle finish action
function handleFinish(todo: Todo) {
  emit('finish', todo);
}

// Handle delete action
function handleDelete(todo: Todo) {
  emit('delete', todo);
}
</script>

<template>
  <div class="todo-list">
    <!-- Loading state -->
    <div v-if="loading" class="todo-list-loading">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="isEmpty" class="todo-list-empty">
      <div class="empty-icon">📋</div>
      <p>{{ emptyText }}</p>
    </div>
    
    <!-- Todo items -->
    <div v-else class="todo-list-content">
      <TodoCard
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @click="handleTodoClick"
        @finish="handleFinish"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>


<style scoped>
.todo-list {
  width: 100%;
}

.todo-list-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.todo-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.todo-list-empty p {
  margin: 0;
  font-size: 14px;
}

.todo-list-content {
  display: flex;
  flex-direction: column;
}
</style>
