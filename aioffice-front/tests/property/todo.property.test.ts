/**
 * Property-Based Tests for Todo Store
 * 
 * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
 * **Validates: Requirements 4.1**
 * 
 * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
 * **Validates: Requirements 4.5**
 * 
 * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
 * **Validates: Requirements 4.6**
 * 
 * Property 6: For any todo in the todo list, the rendered output SHALL contain 
 * the todo's title, deadline, status, and assignee information.
 * 
 * Property 10: For any filter criteria (status, date range), the filtered todo list 
 * SHALL contain only todos matching all specified criteria.
 * 
 * Property 11: For any todo with deadline within 24 hours of current time, 
 * the todo SHALL have a warning indicator flag set to true.
 */

import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import fc from 'fast-check';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useTodoStore } from '../../src/stores/todo';
import TodoCard from '../../src/components/todo/TodoCard.vue';
import type { Todo, TodoFilters } from '../../src/types/todo';

// Mock the API module to avoid actual network calls
vi.mock('../../src/services/api/todo', () => ({
  getTodos: vi.fn(),
  getTodoById: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  finishTodo: vi.fn(),
  addTodoRecord: vi.fn(),
}));

/**
 * Arbitrary generator for valid todo IDs
 */
const todoIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary generator for valid user IDs
 */
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary generator for todo status (0=pending, 1=completed, 2=cancelled, etc.)
 */
const todoStatusArbitrary = fc.integer({ min: 0, max: 3 });

/**
 * Arbitrary generator for Unix timestamps (reasonable range)
 * Using timestamps from 2020 to 2030
 */
const timestampArbitrary = fc.integer({ 
  min: 1577836800, // 2020-01-01
  max: 1893456000  // 2030-01-01
});

/**
 * Arbitrary generator for safe text strings (no HTML special characters)
 * This avoids issues with HTML escaping in rendered output comparisons
 */
const safeTextArbitrary = (minLength: number, maxLength: number) => 
  fc.string({ minLength, maxLength })
    .map(s => s.replace(/[<>&"']/g, ''))  // Remove HTML special characters
    .filter(s => s.trim().length >= minLength);

/**
 * Arbitrary generator for valid Todo objects
 */
const todoArbitrary: fc.Arbitrary<Todo> = fc.record({
  id: todoIdArbitrary,
  creatorId: userIdArbitrary,
  creatorName: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  deadlineAt: timestampArbitrary,
  desc: fc.string({ maxLength: 500 }),
  status: fc.integer({ min: 0, max: 3 }),
  records: fc.constant([]),
  executeIds: fc.array(userIdArbitrary, { maxLength: 5 }),
  todoStatus: todoStatusArbitrary,
});

/**
 * Arbitrary generator for Todo objects with safe text for rendering tests
 * Uses alphanumeric characters to avoid HTML escaping issues
 */
const todoForRenderingArbitrary: fc.Arbitrary<Todo> = fc.record({
  id: todoIdArbitrary,
  creatorId: userIdArbitrary,
  creatorName: safeTextArbitrary(1, 50),
  title: safeTextArbitrary(1, 100),
  deadlineAt: timestampArbitrary,
  desc: fc.string({ maxLength: 500 }),
  status: fc.integer({ min: 0, max: 3 }),
  records: fc.constant([]),
  executeIds: fc.array(userIdArbitrary, { maxLength: 5 }),
  todoStatus: todoStatusArbitrary,
});


/**
 * Arbitrary generator for TodoFilters with optional fields
 */
const todoFiltersArbitrary: fc.Arbitrary<TodoFilters> = fc.record({
  status: fc.option(todoStatusArbitrary, { nil: undefined }),
  startDate: fc.option(timestampArbitrary, { nil: undefined }),
  endDate: fc.option(timestampArbitrary, { nil: undefined }),
});

/**
 * Generate a list of todos with diverse properties for testing
 */
const todoListArbitrary = fc.array(todoArbitrary, { minLength: 0, maxLength: 20 });

/**
 * Helper function to check if a todo matches the given filter criteria
 */
function todoMatchesFilter(todo: Todo, filter: TodoFilters): boolean {
  // Check status filter
  if (filter.status !== undefined && todo.todoStatus !== filter.status) {
    return false;
  }
  
  // Check start date filter (todo deadline must be >= startDate)
  if (filter.startDate !== undefined && todo.deadlineAt < filter.startDate) {
    return false;
  }
  
  // Check end date filter (todo deadline must be <= endDate)
  if (filter.endDate !== undefined && todo.deadlineAt > filter.endDate) {
    return false;
  }
  
  return true;
}

/**
 * Property-Based Tests for TodoCard Component - Todo List Rendering Completeness
 * 
 * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
 * **Validates: Requirements 4.1**
 * 
 * Property: For any todo in the todo list, the rendered output SHALL contain 
 * the todo's title, deadline, status, and assignee information.
 */
describe('TodoCard Component - Todo List Rendering Completeness Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any todo, the rendered TodoCard SHALL contain the todo's title.
   */
  it('Property 6.1: Rendered TodoCard contains todo title', () => {
    fc.assert(
      fc.property(todoForRenderingArbitrary, (todo) => {
        const wrapper = mount(TodoCard, {
          props: { todo },
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain the todo's title
        return html.includes(todo.title);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any todo with a deadline, the rendered TodoCard SHALL display deadline information.
   */
  it('Property 6.2: Rendered TodoCard contains deadline information', () => {
    fc.assert(
      fc.property(todoArbitrary, (todo) => {
        const wrapper = mount(TodoCard, {
          props: { todo },
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain deadline-related content
        // Either the formatted date or "无截止日期" for missing deadlines
        const hasDeadlineLabel = html.includes('截止时间');
        
        return hasDeadlineLabel;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any todo, the rendered TodoCard SHALL display status information.
   */
  it('Property 6.3: Rendered TodoCard contains status information', () => {
    fc.assert(
      fc.property(todoArbitrary, (todo) => {
        const wrapper = mount(TodoCard, {
          props: { todo },
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain one of the status texts
        const statusTexts = ['待处理', '已完成', '已取消', '未知'];
        const hasStatus = statusTexts.some(status => html.includes(status));
        
        return hasStatus;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any todo with assignees, the rendered TodoCard SHALL display assignee count.
   */
  it('Property 6.4: Rendered TodoCard contains assignee information when present', () => {
    // Generate todos that always have at least one assignee
    const todoWithAssigneesArbitrary = fc.record({
      id: todoIdArbitrary,
      creatorId: userIdArbitrary,
      creatorName: fc.string({ minLength: 1, maxLength: 50 }),
      title: fc.string({ minLength: 1, maxLength: 200 }),
      deadlineAt: timestampArbitrary,
      desc: fc.string({ maxLength: 500 }),
      status: fc.integer({ min: 0, max: 3 }),
      records: fc.constant([]),
      executeIds: fc.array(userIdArbitrary, { minLength: 1, maxLength: 5 }),
      todoStatus: todoStatusArbitrary,
    });

    fc.assert(
      fc.property(todoWithAssigneesArbitrary, (todo) => {
        const wrapper = mount(TodoCard, {
          props: { todo },
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain assignee label and count
        const hasAssigneeLabel = html.includes('执行人');
        const hasAssigneeCount = html.includes(`${todo.executeIds.length}人`);
        
        return hasAssigneeLabel && hasAssigneeCount;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any todo, the rendered TodoCard SHALL contain all required fields together.
   */
  it('Property 6.5: Rendered TodoCard contains all required fields (title, deadline, status)', () => {
    fc.assert(
      fc.property(todoForRenderingArbitrary, (todo) => {
        const wrapper = mount(TodoCard, {
          props: { todo },
        });
        
        const html = wrapper.html();
        
        // Check all required fields are present
        const hasTitle = html.includes(todo.title);
        const hasDeadlineLabel = html.includes('截止时间');
        const statusTexts = ['待处理', '已完成', '已取消', '未知'];
        const hasStatus = statusTexts.some(status => html.includes(status));
        
        return hasTitle && hasDeadlineLabel && hasStatus;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 6: Todo List Rendering Completeness**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any todo with creator name, the rendered TodoCard SHALL display creator information.
   */
  it('Property 6.6: Rendered TodoCard contains creator information when present', () => {
    // Generate todos that always have a creator name (using safe text for rendering)
    const todoWithCreatorArbitrary = fc.record({
      id: todoIdArbitrary,
      creatorId: userIdArbitrary,
      creatorName: safeTextArbitrary(1, 50),
      title: safeTextArbitrary(1, 100),
      deadlineAt: timestampArbitrary,
      desc: fc.string({ maxLength: 500 }),
      status: fc.integer({ min: 0, max: 3 }),
      records: fc.constant([]),
      executeIds: fc.array(userIdArbitrary, { maxLength: 5 }),
      todoStatus: todoStatusArbitrary,
    });

    fc.assert(
      fc.property(todoWithCreatorArbitrary, (todo) => {
        const wrapper = mount(TodoCard, {
          props: { todo },
        });
        
        const html = wrapper.html();
        
        // The rendered output must contain creator label and name
        const hasCreatorLabel = html.includes('创建人');
        const hasCreatorName = html.includes(todo.creatorName);
        
        return hasCreatorLabel && hasCreatorName;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Todo Store - Todo Filter Correctness Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any filter criteria (status, date range), the filtered todo list 
   * SHALL contain only todos matching all specified criteria.
   */
  it('Property 10.1: Filtered todos match all filter criteria', () => {
    fc.assert(
      fc.property(todoListArbitrary, todoFiltersArbitrary, (todos, filter) => {
        const store = useTodoStore();
        
        // Apply filter using the store's filterTodos function
        const filtered = store.filterTodos(todos, filter);
        
        // Every filtered todo must match all filter criteria
        return filtered.every(todo => todoMatchesFilter(todo, filter));
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any filter criteria, no matching todos are excluded from the result.
   */
  it('Property 10.2: No matching todos are excluded from filtered result', () => {
    fc.assert(
      fc.property(todoListArbitrary, todoFiltersArbitrary, (todos, filter) => {
        const store = useTodoStore();
        
        // Apply filter using the store's filterTodos function
        const filtered = store.filterTodos(todos, filter);
        
        // Count todos that should match the filter
        const expectedMatchCount = todos.filter(todo => todoMatchesFilter(todo, filter)).length;
        
        // Filtered result should have exactly the expected count
        return filtered.length === expectedMatchCount;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Filtering by status returns only todos with that exact status.
   */
  it('Property 10.3: Status filter returns only todos with matching status', () => {
    fc.assert(
      fc.property(todoListArbitrary, todoStatusArbitrary, (todos, status) => {
        const store = useTodoStore();
        const filter: TodoFilters = { status };
        
        const filtered = store.filterTodos(todos, filter);
        
        // All filtered todos must have the specified status
        return filtered.every(todo => todo.todoStatus === status);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Filtering by date range returns only todos within that range.
   */
  it('Property 10.4: Date range filter returns only todos within range', () => {
    fc.assert(
      fc.property(
        todoListArbitrary,
        timestampArbitrary,
        timestampArbitrary,
        (todos, date1, date2) => {
          const store = useTodoStore();
          
          // Ensure startDate <= endDate
          const startDate = Math.min(date1, date2);
          const endDate = Math.max(date1, date2);
          const filter: TodoFilters = { startDate, endDate };
          
          const filtered = store.filterTodos(todos, filter);
          
          // All filtered todos must have deadline within the range
          return filtered.every(todo => 
            todo.deadlineAt >= startDate && todo.deadlineAt <= endDate
          );
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Combined status and date filters return only todos matching both criteria.
   */
  it('Property 10.5: Combined filters return only todos matching all criteria', () => {
    fc.assert(
      fc.property(
        todoListArbitrary,
        todoStatusArbitrary,
        timestampArbitrary,
        timestampArbitrary,
        (todos, status, date1, date2) => {
          const store = useTodoStore();
          
          // Ensure startDate <= endDate
          const startDate = Math.min(date1, date2);
          const endDate = Math.max(date1, date2);
          const filter: TodoFilters = { status, startDate, endDate };
          
          const filtered = store.filterTodos(todos, filter);
          
          // All filtered todos must match all criteria
          return filtered.every(todo => 
            todo.todoStatus === status &&
            todo.deadlineAt >= startDate && 
            todo.deadlineAt <= endDate
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Empty filter returns all todos unchanged.
   */
  it('Property 10.6: Empty filter returns all todos', () => {
    fc.assert(
      fc.property(todoListArbitrary, (todos) => {
        const store = useTodoStore();
        const emptyFilter: TodoFilters = {};
        
        const filtered = store.filterTodos(todos, emptyFilter);
        
        // Empty filter should return all todos
        return filtered.length === todos.length;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Filtering preserves todo data integrity (no modification of todo properties).
   */
  it('Property 10.7: Filtering preserves todo data integrity', () => {
    fc.assert(
      fc.property(todoListArbitrary, todoFiltersArbitrary, (todos, filter) => {
        const store = useTodoStore();
        
        // Create deep copies of original todos for comparison
        const originalTodos = todos.map(t => ({ ...t }));
        
        const filtered = store.filterTodos(todos, filter);
        
        // Each filtered todo should have identical properties to the original
        return filtered.every(filteredTodo => {
          const original = originalTodos.find(t => t.id === filteredTodo.id);
          if (!original) return false;
          
          return (
            filteredTodo.id === original.id &&
            filteredTodo.creatorId === original.creatorId &&
            filteredTodo.creatorName === original.creatorName &&
            filteredTodo.title === original.title &&
            filteredTodo.deadlineAt === original.deadlineAt &&
            filteredTodo.desc === original.desc &&
            filteredTodo.status === original.status &&
            filteredTodo.todoStatus === original.todoStatus
          );
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Filtering is idempotent - applying the same filter twice yields the same result.
   */
  it('Property 10.8: Filtering is idempotent', () => {
    fc.assert(
      fc.property(todoListArbitrary, todoFiltersArbitrary, (todos, filter) => {
        const store = useTodoStore();
        
        const firstFilter = store.filterTodos(todos, filter);
        const secondFilter = store.filterTodos(firstFilter, filter);
        
        // Applying filter twice should yield same result
        if (firstFilter.length !== secondFilter.length) return false;
        
        return firstFilter.every((todo, index) => 
          todo.id === secondFilter[index].id
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Filtered result is always a subset of the original list.
   */
  it('Property 10.9: Filtered result is a subset of original list', () => {
    fc.assert(
      fc.property(todoListArbitrary, todoFiltersArbitrary, (todos, filter) => {
        const store = useTodoStore();
        
        const filtered = store.filterTodos(todos, filter);
        const originalIds = new Set(todos.map(t => t.id));
        
        // Every filtered todo ID must exist in original list
        return filtered.every(todo => originalIds.has(todo.id));
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 10: Todo Filter Correctness**
   * **Validates: Requirements 4.5**
   * 
   * Property: Filtered result length is always <= original list length.
   */
  it('Property 10.10: Filtered result length is bounded by original length', () => {
    fc.assert(
      fc.property(todoListArbitrary, todoFiltersArbitrary, (todos, filter) => {
        const store = useTodoStore();
        
        const filtered = store.filterTodos(todos, filter);
        
        return filtered.length <= todos.length;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property-Based Tests for Todo Store - Todo Deadline Warning
 * 
 * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
 * **Validates: Requirements 4.6**
 * 
 * Property: For any todo with deadline within 24 hours of current time, 
 * the todo SHALL have a warning indicator flag set to true.
 */
describe('Todo Store - Todo Deadline Warning Property Tests', () => {
  // 24 hours in milliseconds
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  // Use a fixed timestamp for consistent testing (2025-01-01 00:00:00 UTC)
  const FIXED_NOW_MS = 1735689600000;

  beforeEach(() => {
    // Set up fake timers BEFORE creating pinia
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW_MS);
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  /**
   * Helper to create a todo with a specific deadline
   */
  function createTodoWithDeadline(deadlineSeconds: number): Todo {
    return {
      id: 'test-id',
      creatorId: 'creator-1',
      creatorName: 'Test Creator',
      title: 'Test Todo',
      deadlineAt: deadlineSeconds,
      desc: 'Test description',
      status: 0,
      records: [],
      executeIds: [],
      todoStatus: 0,
    };
  }

  /**
   * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
   * **Validates: Requirements 4.6**
   * 
   * Property: Todos with deadline within 24 hours SHALL have warning flag true.
   */
  it('Property 11.1: Todos with deadline within 24 hours have warning flag true', () => {
    fc.assert(
      fc.property(
        // Generate offset between 1 second and 24 hours (in seconds, to avoid ms precision issues)
        fc.integer({ min: 1, max: 24 * 60 * 60 - 1 }),
        (offsetSeconds) => {
          const store = useTodoStore();
          
          // Create a todo with deadline within 24 hours from now
          const nowSeconds = Math.floor(FIXED_NOW_MS / 1000);
          const deadlineSeconds = nowSeconds + offsetSeconds;
          const todo = createTodoWithDeadline(deadlineSeconds);
          
          // The warning should be true for deadlines within 24 hours
          return store.isDeadlineApproaching(todo) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
   * **Validates: Requirements 4.6**
   * 
   * Property: Todos with deadline more than 24 hours away SHALL have warning flag false.
   */
  it('Property 11.2: Todos with deadline more than 24 hours away have warning flag false', () => {
    fc.assert(
      fc.property(
        // Generate offset more than 24 hours (24h + 1 second to 30 days, in seconds)
        fc.integer({ min: 24 * 60 * 60 + 1, max: 30 * 24 * 60 * 60 }),
        (offsetSeconds) => {
          const store = useTodoStore();
          
          // Create a todo with deadline more than 24 hours from now
          const nowSeconds = Math.floor(FIXED_NOW_MS / 1000);
          const deadlineSeconds = nowSeconds + offsetSeconds;
          const todo = createTodoWithDeadline(deadlineSeconds);
          
          // The warning should be false for deadlines more than 24 hours away
          return store.isDeadlineApproaching(todo) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
   * **Validates: Requirements 4.6**
   * 
   * Property: Todos with past deadlines SHALL have warning flag false.
   */
  it('Property 11.3: Todos with past deadlines have warning flag false', () => {
    fc.assert(
      fc.property(
        // Generate negative offset (past deadlines: 1 second to 30 days ago)
        fc.integer({ min: 1, max: 30 * 24 * 60 * 60 }),
        (offsetSeconds) => {
          const store = useTodoStore();
          
          // Create a todo with deadline in the past
          const nowSeconds = Math.floor(FIXED_NOW_MS / 1000);
          const deadlineSeconds = nowSeconds - offsetSeconds;
          const todo = createTodoWithDeadline(deadlineSeconds);
          
          // The warning should be false for past deadlines
          return store.isDeadlineApproaching(todo) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
   * **Validates: Requirements 4.6**
   * 
   * Property: Deadline exactly at 24 hours boundary triggers warning (boundary is inclusive).
   */
  it('Property 11.4: Deadline exactly at 24 hours boundary triggers warning', () => {
    const store = useTodoStore();
    
    // Create a todo with deadline exactly at 24 hours from now
    const nowSeconds = Math.floor(FIXED_NOW_MS / 1000);
    const deadlineSeconds = nowSeconds + (24 * 60 * 60); // Exactly 24 hours
    const todo = createTodoWithDeadline(deadlineSeconds);
    
    // The implementation uses <= so exactly 24h should trigger warning
    const result = store.isDeadlineApproaching(todo);
    
    // Verify the boundary condition - at exactly 24h, warning should be true
    // because timeUntilDeadline <= THRESHOLD (24h)
    expect(result).toBe(true);
  });

  /**
   * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
   * **Validates: Requirements 4.6**
   * 
   * Property: todosWithWarning computed property correctly flags all todos.
   */
  it('Property 11.5: todosWithWarning correctly flags todos based on deadline', () => {
    const nowSeconds = Math.floor(FIXED_NOW_MS / 1000);
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: todoIdArbitrary,
            creatorId: userIdArbitrary,
            creatorName: fc.string({ minLength: 1, maxLength: 50 }),
            title: fc.string({ minLength: 1, maxLength: 200 }),
            // Generate deadlines that span past, within 24h, and beyond 24h
            deadlineAt: fc.integer({ 
              min: nowSeconds - 48 * 60 * 60, // 48h ago
              max: nowSeconds + 48 * 60 * 60  // 48h from now
            }),
            desc: fc.string({ maxLength: 500 }),
            status: fc.integer({ min: 0, max: 3 }),
            records: fc.constant([] as Todo['records']),
            executeIds: fc.array(userIdArbitrary, { maxLength: 5 }),
            todoStatus: todoStatusArbitrary,
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (todos) => {
          const store = useTodoStore();
          
          // Set todos in the store (need to cast to mutable array)
          store.todos = todos.map(t => ({ ...t, records: [...t.records] }));
          
          // Get todos with warning flags
          const todosWithWarning = store.todosWithWarning;
          
          // Verify each todo's warning flag matches the isDeadlineApproaching result
          return todosWithWarning.every((todoWithWarning, index) => {
            const originalTodo = store.todos[index];
            const expectedWarning = store.isDeadlineApproaching(originalTodo);
            return todoWithWarning.hasDeadlineWarning === expectedWarning;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 11: Todo Deadline Warning**
   * **Validates: Requirements 4.6**
   * 
   * Property: Warning flag is independent of other todo properties.
   */
  it('Property 11.6: Warning flag depends only on deadline, not other properties', () => {
    fc.assert(
      fc.property(
        // Generate offset within 24 hours (in seconds)
        fc.integer({ min: 1, max: 24 * 60 * 60 - 1 }),
        todoIdArbitrary,
        todoIdArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        todoStatusArbitrary,
        todoStatusArbitrary,
        (offsetSeconds, id1, id2, title1, title2, status1, status2) => {
          const store = useTodoStore();
          
          const nowSeconds = Math.floor(FIXED_NOW_MS / 1000);
          const deadlineSeconds = nowSeconds + offsetSeconds;
          
          const todo1: Todo = {
            id: id1,
            creatorId: 'creator-1',
            creatorName: 'Creator 1',
            title: title1,
            deadlineAt: deadlineSeconds,
            desc: 'Description 1',
            status: status1,
            records: [],
            executeIds: [],
            todoStatus: status1,
          };
          
          const todo2: Todo = {
            id: id2,
            creatorId: 'creator-2',
            creatorName: 'Creator 2',
            title: title2,
            deadlineAt: deadlineSeconds,
            desc: 'Description 2',
            status: status2,
            records: [],
            executeIds: [],
            todoStatus: status2,
          };
          
          // Both todos should have the same warning flag since they have the same deadline
          return store.isDeadlineApproaching(todo1) === store.isDeadlineApproaching(todo2);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property-Based Tests for Todo Store - Todo Creation State Update
 * 
 * **Feature: aioffice-frontend, Property 7: Todo Creation State Update**
 * **Validates: Requirements 4.2**
 * 
 * Property: For any valid todo creation, the new todo SHALL appear in the 
 * todo list state after successful API response.
 */
describe('Todo Store - Todo Creation State Update Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Arbitrary generator for valid CreateTodoRequest
   */
  const createTodoRequestArbitrary = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    desc: fc.string({ maxLength: 500 }),
    deadlineAt: fc.integer({ min: 1577836800, max: 1893456000 }),
    executeIds: fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { maxLength: 5 }),
  });

  /**
   * **Feature: aioffice-frontend, Property 7: Todo Creation State Update**
   * **Validates: Requirements 4.2**
   * 
   * Property: After successful todo creation, the store's todos array length increases.
   */
  it('Property 7.1: Successful todo creation increases todos array length', async () => {
    const { createTodo, getTodos } = await import('../../src/services/api/todo');
    
    await fc.assert(
      fc.asyncProperty(
        createTodoRequestArbitrary,
        todoIdArbitrary,
        async (request, newTodoId) => {
          const store = useTodoStore();
          const initialLength = store.todos.length;
          
          // Mock successful API responses
          vi.mocked(createTodo).mockResolvedValueOnce({
            code: 0,
            data: { id: newTodoId },
            msg: 'success',
          });
          
          vi.mocked(getTodos).mockResolvedValueOnce({
            code: 0,
            data: {
              count: initialLength + 1,
              data: [
                ...store.todos,
                {
                  id: newTodoId,
                  creatorId: 'test-user',
                  creatorName: 'Test User',
                  title: request.title,
                  deadlineAt: request.deadlineAt,
                  desc: request.desc,
                  status: 0,
                  records: [],
                  executeIds: request.executeIds,
                  todoStatus: 0,
                },
              ],
            },
            msg: 'success',
          });
          
          await store.createNewTodo(request);
          
          // After creation, todos length should increase
          return store.todos.length === initialLength + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 7: Todo Creation State Update**
   * **Validates: Requirements 4.2**
   * 
   * Property: After successful todo creation, the new todo exists in the store with correct data.
   */
  it('Property 7.2: Created todo appears in store with correct title', async () => {
    const { createTodo, getTodos } = await import('../../src/services/api/todo');
    
    await fc.assert(
      fc.asyncProperty(
        createTodoRequestArbitrary,
        todoIdArbitrary,
        async (request, newTodoId) => {
          const store = useTodoStore();
          
          // Mock successful API responses
          vi.mocked(createTodo).mockResolvedValueOnce({
            code: 0,
            data: { id: newTodoId },
            msg: 'success',
          });
          
          const newTodo: Todo = {
            id: newTodoId,
            creatorId: 'test-user',
            creatorName: 'Test User',
            title: request.title,
            deadlineAt: request.deadlineAt,
            desc: request.desc,
            status: 0,
            records: [],
            executeIds: request.executeIds,
            todoStatus: 0,
          };
          
          vi.mocked(getTodos).mockResolvedValueOnce({
            code: 0,
            data: {
              count: 1,
              data: [newTodo],
            },
            msg: 'success',
          });
          
          await store.createNewTodo(request);
          
          // The created todo should exist in the store with the correct title
          const createdTodo = store.todos.find(t => t.id === newTodoId);
          return createdTodo !== undefined && createdTodo.title === request.title;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 7: Todo Creation State Update**
   * **Validates: Requirements 4.2**
   * 
   * Property: Failed todo creation does not modify the store's todos array.
   */
  it('Property 7.3: Failed todo creation does not modify todos array', async () => {
    const { createTodo } = await import('../../src/services/api/todo');
    
    await fc.assert(
      fc.asyncProperty(
        createTodoRequestArbitrary,
        fc.array(todoArbitrary, { minLength: 0, maxLength: 5 }),
        async (request, initialTodos) => {
          const store = useTodoStore();
          store.todos = [...initialTodos];
          const initialLength = store.todos.length;
          const initialIds = store.todos.map(t => t.id);
          
          // Mock failed API response
          vi.mocked(createTodo).mockResolvedValueOnce({
            code: 1,
            data: null as any,
            msg: 'error',
          });
          
          await store.createNewTodo(request);
          
          // After failed creation, todos should remain unchanged
          const currentIds = store.todos.map(t => t.id);
          return store.todos.length === initialLength && 
                 initialIds.every((id, i) => id === currentIds[i]);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property-Based Tests for Todo Store - Todo Status Update Consistency
 * 
 * **Feature: aioffice-frontend, Property 8: Todo Status Update Consistency**
 * **Validates: Requirements 4.3**
 * 
 * Property: For any todo status change (including completion), the todo's status 
 * in the store SHALL match the updated value.
 */
describe('Todo Store - Todo Status Update Consistency Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 8: Todo Status Update Consistency**
   * **Validates: Requirements 4.3**
   * 
   * Property: After successful status update, the todo's status in store matches the new value.
   */
  it('Property 8.1: Successful status update reflects in store', async () => {
    const { updateTodo } = await import('../../src/services/api/todo');
    
    await fc.assert(
      fc.asyncProperty(
        todoArbitrary,
        todoStatusArbitrary,
        async (todo, newStatus) => {
          const store = useTodoStore();
          store.todos = [{ ...todo }];
          
          // Mock successful API response
          vi.mocked(updateTodo).mockResolvedValueOnce({
            code: 0,
            data: undefined,
            msg: 'success',
          });
          
          await store.updateExistingTodo({ id: todo.id, status: newStatus });
          
          // The todo's status in store should match the new value
          const updatedTodo = store.todos.find(t => t.id === todo.id);
          return updatedTodo !== undefined && updatedTodo.status === newStatus;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 8: Todo Status Update Consistency**
   * **Validates: Requirements 4.3**
   * 
   * Property: After marking todo as finished, todoStatus becomes 1 (completed).
   */
  it('Property 8.2: Marking todo as finished sets todoStatus to 1', async () => {
    const { finishTodo } = await import('../../src/services/api/todo');
    
    await fc.assert(
      fc.asyncProperty(
        todoArbitrary,
        userIdArbitrary,
        async (todo, userId) => {
          const store = useTodoStore();
          // Ensure todo starts with non-completed status
          const initialTodo = { ...todo, todoStatus: 0 };
          store.todos = [initialTodo];
          
          // Mock successful API response
          vi.mocked(finishTodo).mockResolvedValueOnce({
            code: 0,
            data: undefined,
            msg: 'success',
          });
          
          await store.markTodoAsFinished(userId, todo.id);
          
          // The todo's todoStatus should be 1 (completed)
          const updatedTodo = store.todos.find(t => t.id === todo.id);
          return updatedTodo !== undefined && updatedTodo.todoStatus === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 8: Todo Status Update Consistency**
   * **Validates: Requirements 4.3**
   * 
   * Property: Failed status update does not modify the todo's status.
   */
  it('Property 8.3: Failed status update preserves original status', async () => {
    const { updateTodo } = await import('../../src/services/api/todo');
    
    await fc.assert(
      fc.asyncProperty(
        todoArbitrary,
        todoStatusArbitrary,
        async (todo, newStatus) => {
          const store = useTodoStore();
          const originalStatus = todo.status;
          store.todos = [{ ...todo }];
          
          // Mock failed API response
          vi.mocked(updateTodo).mockResolvedValueOnce({
            code: 1,
            data: undefined,
            msg: 'error',
          });
          
          await store.updateExistingTodo({ id: todo.id, status: newStatus });
          
          // The todo's status should remain unchanged
          const updatedTodo = store.todos.find(t => t.id === todo.id);
          return updatedTodo !== undefined && updatedTodo.status === originalStatus;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 8: Todo Status Update Consistency**
   * **Validates: Requirements 4.3**
   * 
   * Property: Status update only affects the targeted todo, not others.
   */
  it('Property 8.4: Status update only affects targeted todo', async () => {
    const { updateTodo } = await import('../../src/services/api/todo');
    
    await fc.assert(
      fc.asyncProperty(
        fc.array(todoArbitrary, { minLength: 2, maxLength: 10 }),
        fc.nat(),
        todoStatusArbitrary,
        async (todos, indexSeed, newStatus) => {
          // Ensure unique IDs
          const uniqueTodos = todos.map((t, i) => ({ ...t, id: `todo-${i}` }));
          const targetIndex = indexSeed % uniqueTodos.length;
          const targetTodo = uniqueTodos[targetIndex];
          
          const store = useTodoStore();
          store.todos = uniqueTodos.map(t => ({ ...t }));
          
          // Store original statuses of non-target todos
          const originalStatuses = uniqueTodos
            .filter((_, i) => i !== targetIndex)
            .map(t => ({ id: t.id, status: t.status }));
          
          // Mock successful API response
          vi.mocked(updateTodo).mockResolvedValueOnce({
            code: 0,
            data: undefined,
            msg: 'success',
          });
          
          await store.updateExistingTodo({ id: targetTodo.id, status: newStatus });
          
          // Other todos should have unchanged statuses
          return originalStatuses.every(orig => {
            const current = store.todos.find(t => t.id === orig.id);
            return current !== undefined && current.status === orig.status;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property-Based Tests for Todo Store - Todo Record Append
 * 
 * **Feature: aioffice-frontend, Property 9: Todo Record Append**
 * **Validates: Requirements 4.4**
 * 
 * Property: For any record added to a todo, the record SHALL be appended to 
 * the todo's records array without modifying existing records.
 */
describe('Todo Store - Todo Record Append Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Arbitrary generator for TodoRecord
   */
  const todoRecordArbitrary: fc.Arbitrary<TodoRecord> = fc.record({
    todoId: todoIdArbitrary,
    userId: userIdArbitrary,
    userName: fc.string({ minLength: 1, maxLength: 50 }),
    content: fc.string({ minLength: 1, maxLength: 500 }),
    image: fc.string({ maxLength: 200 }),
    createAt: timestampArbitrary,
  });

  /**
   * **Feature: aioffice-frontend, Property 9: Todo Record Append**
   * **Validates: Requirements 4.4**
   * 
   * Property: appendRecordLocally adds record to the end of records array.
   */
  it('Property 9.1: appendRecordLocally adds record to end of array', () => {
    fc.assert(
      fc.property(
        todoArbitrary,
        todoRecordArbitrary,
        (todo, newRecord) => {
          const store = useTodoStore();
          const todoWithRecord = { ...todo, records: [...(todo.records || [])] };
          store.todos = [todoWithRecord];
          
          const initialLength = todoWithRecord.records.length;
          const recordToAdd = { ...newRecord, todoId: todo.id };
          
          store.appendRecordLocally(todo.id, recordToAdd);
          
          const updatedTodo = store.todos.find(t => t.id === todo.id);
          if (!updatedTodo) return false;
          
          // Record should be appended at the end
          return updatedTodo.records.length === initialLength + 1 &&
                 updatedTodo.records[updatedTodo.records.length - 1].content === recordToAdd.content;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 9: Todo Record Append**
   * **Validates: Requirements 4.4**
   * 
   * Property: appendRecordLocally preserves existing records unchanged.
   */
  it('Property 9.2: appendRecordLocally preserves existing records', () => {
    fc.assert(
      fc.property(
        todoArbitrary,
        fc.array(todoRecordArbitrary, { minLength: 1, maxLength: 5 }),
        todoRecordArbitrary,
        (todo, existingRecords, newRecord) => {
          const store = useTodoStore();
          const todoWithRecords = { 
            ...todo, 
            records: existingRecords.map(r => ({ ...r, todoId: todo.id }))
          };
          store.todos = [todoWithRecords];
          
          // Store original records for comparison
          const originalRecords = todoWithRecords.records.map(r => ({ ...r }));
          const recordToAdd = { ...newRecord, todoId: todo.id };
          
          store.appendRecordLocally(todo.id, recordToAdd);
          
          const updatedTodo = store.todos.find(t => t.id === todo.id);
          if (!updatedTodo) return false;
          
          // All original records should be preserved in order
          return originalRecords.every((orig, index) => {
            const current = updatedTodo.records[index];
            return current.content === orig.content &&
                   current.userId === orig.userId &&
                   current.createAt === orig.createAt;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 9: Todo Record Append**
   * **Validates: Requirements 4.4**
   * 
   * Property: appendRecordLocally does not affect other todos.
   */
  it('Property 9.3: appendRecordLocally does not affect other todos', () => {
    fc.assert(
      fc.property(
        fc.array(todoArbitrary, { minLength: 2, maxLength: 5 }),
        fc.nat(),
        todoRecordArbitrary,
        (todos, indexSeed, newRecord) => {
          // Ensure unique IDs
          const uniqueTodos = todos.map((t, i) => ({ 
            ...t, 
            id: `todo-${i}`,
            records: [...(t.records || [])]
          }));
          const targetIndex = indexSeed % uniqueTodos.length;
          const targetTodo = uniqueTodos[targetIndex];
          
          const store = useTodoStore();
          store.todos = uniqueTodos.map(t => ({ ...t, records: [...t.records] }));
          
          // Store original record counts for non-target todos
          const originalCounts = uniqueTodos
            .filter((_, i) => i !== targetIndex)
            .map(t => ({ id: t.id, count: t.records.length }));
          
          const recordToAdd = { ...newRecord, todoId: targetTodo.id };
          store.appendRecordLocally(targetTodo.id, recordToAdd);
          
          // Other todos should have unchanged record counts
          return originalCounts.every(orig => {
            const current = store.todos.find(t => t.id === orig.id);
            return current !== undefined && current.records.length === orig.count;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 9: Todo Record Append**
   * **Validates: Requirements 4.4**
   * 
   * Property: appendRecordLocally with non-existent todoId does not throw or modify state.
   */
  it('Property 9.4: appendRecordLocally with non-existent todoId is safe', () => {
    fc.assert(
      fc.property(
        fc.array(todoArbitrary, { minLength: 0, maxLength: 5 }),
        todoRecordArbitrary,
        (todos, newRecord) => {
          // Ensure unique IDs
          const uniqueTodos = todos.map((t, i) => ({ 
            ...t, 
            id: `todo-${i}`,
            records: [...(t.records || [])]
          }));
          
          const store = useTodoStore();
          store.todos = uniqueTodos.map(t => ({ ...t, records: [...t.records] }));
          
          // Store original state
          const originalState = store.todos.map(t => ({ 
            id: t.id, 
            recordCount: t.records.length 
          }));
          
          // Try to append to non-existent todo
          const nonExistentId = 'non-existent-todo-id';
          const recordToAdd = { ...newRecord, todoId: nonExistentId };
          
          // Should not throw
          try {
            store.appendRecordLocally(nonExistentId, recordToAdd);
          } catch {
            return false;
          }
          
          // State should remain unchanged
          return originalState.every(orig => {
            const current = store.todos.find(t => t.id === orig.id);
            return current !== undefined && current.records.length === orig.recordCount;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 9: Todo Record Append**
   * **Validates: Requirements 4.4**
   * 
   * Property: Multiple sequential appends maintain correct order.
   */
  it('Property 9.5: Multiple sequential appends maintain correct order', () => {
    fc.assert(
      fc.property(
        todoArbitrary,
        fc.array(todoRecordArbitrary, { minLength: 2, maxLength: 5 }),
        (todo, recordsToAdd) => {
          const store = useTodoStore();
          const todoWithEmptyRecords = { ...todo, records: [] };
          store.todos = [todoWithEmptyRecords];
          
          // Append records sequentially
          recordsToAdd.forEach((record, index) => {
            const recordWithId = { ...record, todoId: todo.id, content: `record-${index}` };
            store.appendRecordLocally(todo.id, recordWithId);
          });
          
          const updatedTodo = store.todos.find(t => t.id === todo.id);
          if (!updatedTodo) return false;
          
          // Records should be in the order they were added
          return updatedTodo.records.length === recordsToAdd.length &&
                 updatedTodo.records.every((r, i) => r.content === `record-${i}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
