/**
 * Todo Store - Pinia state management for todo functionality
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6 - Todo management
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  Todo, 
  TodoRecord, 
  TodoFilters, 
  TodoState,
  CreateTodoRequest,
  UpdateTodoRequest,
  AddTodoRecordRequest
} from '../types/todo';
import { 
  getTodos, 
  getTodoById, 
  createTodo, 
  updateTodo, 
  deleteTodo, 
  finishTodo,
  addTodoRecord,
  type TodoListParams
} from '../services/api/todo';

// 24 hours in milliseconds for deadline warning
const DEADLINE_WARNING_THRESHOLD = 24 * 60 * 60 * 1000;

export const useTodoStore = defineStore('todo', () => {
  // State
  const todos = ref<Todo[]>([]);
  const loading = ref<boolean>(false);
  const filters = ref<TodoFilters>({});
  const currentTodo = ref<Todo | null>(null);

  // Getters
  const todoState = computed<TodoState>(() => ({
    todos: todos.value,
    loading: loading.value,
    filters: filters.value,
  }));

  const isLoading = computed(() => loading.value);

  /**
   * Check if a todo deadline is approaching (within 24 hours)
   * Requirements: 4.6 - WHEN a todo deadline is approaching THEN highlight with warning
   * Property 11: Todo Deadline Warning
   */
  const isDeadlineApproaching = (todo: Todo): boolean => {
    const now = Date.now();
    const deadline = todo.deadlineAt * 1000; // Convert to milliseconds
    const timeUntilDeadline = deadline - now;
    return timeUntilDeadline > 0 && timeUntilDeadline <= DEADLINE_WARNING_THRESHOLD;
  };


  /**
   * Get todos with deadline warning flag
   * Requirements: 4.6 - Highlight todos with approaching deadlines
   */
  const todosWithWarning = computed(() => {
    return todos.value.map(todo => ({
      ...todo,
      hasDeadlineWarning: isDeadlineApproaching(todo),
    }));
  });

  /**
   * Filter todos based on current filters
   * Requirements: 4.5 - WHEN a user filters todos THEN display only matching items
   * Property 10: Todo Filter Correctness
   */
  const filteredTodos = computed(() => {
    return filterTodos(todos.value, filters.value);
  });

  /**
   * Filter todos by criteria
   * Property 10: Todo Filter Correctness - filtered list contains only matching items
   * 
   * @param todoList List of todos to filter
   * @param filterCriteria Filter criteria
   * @returns Filtered todo list
   */
  function filterTodos(todoList: Todo[], filterCriteria: TodoFilters): Todo[] {
    return todoList.filter(todo => {
      // Filter by status
      if (filterCriteria.status !== undefined && todo.todoStatus !== filterCriteria.status) {
        return false;
      }
      
      // Filter by start date
      if (filterCriteria.startDate !== undefined && todo.deadlineAt < filterCriteria.startDate) {
        return false;
      }
      
      // Filter by end date
      if (filterCriteria.endDate !== undefined && todo.deadlineAt > filterCriteria.endDate) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Set loading state
   * Property 3: Loading State Management
   */
  function setLoading(isLoading: boolean): void {
    loading.value = isLoading;
  }

  /**
   * Set filter criteria
   * Requirements: 4.5 - Filter todos by status or date range
   */
  function setFilters(newFilters: TodoFilters): void {
    filters.value = { ...newFilters };
  }

  /**
   * Clear filters
   */
  function clearFilters(): void {
    filters.value = {};
  }


  /**
   * Fetch todos from API
   * Requirements: 4.1 - WHEN a user views the Todo_Module THEN display a list of todos
   */
  async function fetchTodos(params?: TodoListParams): Promise<void> {
    setLoading(true);
    try {
      const response = await getTodos(params);
      if (response.code === 200 && response.data) {
        todos.value = response.data.data || [];
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch single todo by ID
   */
  async function fetchTodoById(id: string): Promise<Todo | null> {
    setLoading(true);
    try {
      const response = await getTodoById(id);
      if (response.code === 200 && response.data) {
        currentTodo.value = response.data;
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch todo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new todo
   * Requirements: 4.2 - WHEN a user creates a new todo THEN submit and display in list
   * Property 7: Todo Creation State Update
   */
  async function createNewTodo(data: CreateTodoRequest): Promise<string | null> {
    setLoading(true);
    try {
      const response = await createTodo(data);
      if (response.code === 200 && response.data) {
        // Refresh the todo list to include the new item
        await fetchTodos();
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }


  /**
   * Update an existing todo
   * Requirements: 4.3 - WHEN a user marks a todo as complete THEN update status
   * Property 8: Todo Status Update Consistency
   */
  async function updateExistingTodo(data: UpdateTodoRequest): Promise<boolean> {
    setLoading(true);
    try {
      const response = await updateTodo(data);
      if (response.code === 200) {
        // Update local state
        const index = todos.value.findIndex(t => t.id === data.id);
        if (index !== -1) {
          todos.value[index] = { ...todos.value[index], ...data };
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a todo
   */
  async function removeExistingTodo(id: string): Promise<boolean> {
    setLoading(true);
    try {
      const response = await deleteTodo(id);
      if (response.code === 200) {
        // Remove from local state
        todos.value = todos.value.filter(t => t.id !== id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Mark a todo as finished
   * Requirements: 4.3 - WHEN a user marks a todo as complete THEN update status
   * Property 8: Todo Status Update Consistency
   */
  async function markTodoAsFinished(userId: string, todoId: string): Promise<boolean> {
    setLoading(true);
    try {
      const response = await finishTodo(userId, todoId);
      if (response.code === 200) {
        // Update local state - mark as completed (status = 1)
        const index = todos.value.findIndex(t => t.id === todoId);
        if (index !== -1) {
          todos.value[index] = { ...todos.value[index], todoStatus: 1 };
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to finish todo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }


  /**
   * Add a record to a todo
   * Requirements: 4.4 - WHEN a user adds a record THEN append to todo's history
   * Property 9: Todo Record Append
   */
  async function addRecordToTodo(data: AddTodoRecordRequest): Promise<boolean> {
    setLoading(true);
    try {
      const response = await addTodoRecord(data);
      if (response.code === 200) {
        // Refresh the specific todo to get updated records
        await fetchTodoById(data.todoId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add record:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Add a record to local todo state (for optimistic updates)
   * Property 9: Todo Record Append - append without modifying existing records
   */
  function appendRecordLocally(todoId: string, record: TodoRecord): void {
    const index = todos.value.findIndex(t => t.id === todoId);
    if (index !== -1) {
      const existingRecords = todos.value[index].records || [];
      todos.value[index] = {
        ...todos.value[index],
        records: [...existingRecords, record],
      };
    }
  }

  /**
   * Clear all todos
   */
  function clearTodos(): void {
    todos.value = [];
    currentTodo.value = null;
  }

  return {
    // State
    todos,
    loading,
    filters,
    currentTodo,

    // Getters
    todoState,
    isLoading,
    todosWithWarning,
    filteredTodos,

    // Helper functions (exported for testing)
    isDeadlineApproaching,
    filterTodos,

    // Actions
    setLoading,
    setFilters,
    clearFilters,
    fetchTodos,
    fetchTodoById,
    createNewTodo,
    updateExistingTodo,
    removeExistingTodo,
    markTodoAsFinished,
    addRecordToTodo,
    appendRecordLocally,
    clearTodos,
  };
});
