/**
 * Department Store - Pinia state management for department functionality
 * Requirements: 6.1, 6.3 - Department management
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  Department, 
  DepartmentUser,
  DepartmentState,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  AssignUsersRequest
} from '../types/department';
import { 
  getDepartmentSoa, 
  getDepartmentById,
  getUserDepartment,
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  setDepartmentUsers,
  addDepartmentUser,
  removeDepartmentUser
} from '../services/api/department';

export const useDepartmentStore = defineStore('department', () => {
  // State
  const departments = ref<Department[]>([]);
  const currentDepartment = ref<Department | null>(null);
  const members = ref<DepartmentUser[]>([]);
  const loading = ref<boolean>(false);

  // Getters
  const departmentState = computed<DepartmentState>(() => ({
    departments: departments.value,
    currentDepartment: currentDepartment.value,
    members: members.value,
    loading: loading.value,
  }));

  const isLoading = computed(() => loading.value);


  /**
   * Build flat list from department tree
   * Property 15: Department Tree Structure Preservation
   */
  const flatDepartmentList = computed(() => {
    const result: Department[] = [];
    
    function flatten(depts: Department[]): void {
      for (const dept of depts) {
        result.push(dept);
        if (dept.child && dept.child.length > 0) {
          flatten(dept.child);
        }
      }
    }
    
    flatten(departments.value);
    return result;
  });

  /**
   * Validate department tree structure - ensures parent-child relationships are preserved
   * Property 15: Department Tree Structure Preservation
   * 
   * @param depts Department array to validate
   * @returns true if tree structure is valid
   */
  function validateTreeStructure(depts: Department[]): boolean {
    function validateNode(dept: Department, expectedParentId: string): boolean {
      // Check parent ID matches expected
      if (dept.parentId !== expectedParentId) {
        return false;
      }
      
      // Recursively validate children
      if (dept.child && dept.child.length > 0) {
        return dept.child.every(child => validateNode(child, dept.id));
      }
      
      return true;
    }
    
    // Root departments should have empty parentId
    return depts.every(dept => validateNode(dept, ''));
  }

  /**
   * Find department by ID in tree
   * 
   * @param id Department ID to find
   * @param depts Department array to search (defaults to store departments)
   * @returns Found department or null
   */
  function findDepartmentById(id: string, depts: Department[] = departments.value): Department | null {
    for (const dept of depts) {
      if (dept.id === id) {
        return dept;
      }
      if (dept.child && dept.child.length > 0) {
        const found = findDepartmentById(id, dept.child);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Get department hierarchy path from root to specified department
   * Requirements: 6.4 - Display the department hierarchy from root to current
   * 
   * @param id Department ID
   * @returns Array of departments from root to target
   */
  function getDepartmentPath(id: string): Department[] {
    const path: Department[] = [];
    
    function findPath(depts: Department[], targetId: string): boolean {
      for (const dept of depts) {
        if (dept.id === targetId) {
          path.push(dept);
          return true;
        }
        if (dept.child && dept.child.length > 0) {
          if (findPath(dept.child, targetId)) {
            path.unshift(dept);
            return true;
          }
        }
      }
      return false;
    }
    
    findPath(departments.value, id);
    return path;
  }

  /**
   * Set loading state
   * Property 3: Loading State Management
   */
  function setLoading(isLoading: boolean): void {
    loading.value = isLoading;
  }

  /**
   * Fetch departments from API (SOA endpoint returns tree structure)
   * Requirements: 6.1 - WHEN a user views the Department_Module THEN display the department tree structure
   */
  async function fetchDepartments(): Promise<void> {
    setLoading(true);
    try {
      const response = await getDepartmentSoa();
      if (response.code === 200 && response.data) {
        // SOA returns a single root department with children
        departments.value = response.data.child || [response.data];
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch single department by ID
   */
  async function fetchDepartmentById(id: string): Promise<Department | null> {
    setLoading(true);
    try {
      const response = await getDepartmentById(id);
      if (response.code === 200 && response.data) {
        currentDepartment.value = response.data;
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch department:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch user's department with hierarchy
   * Requirements: 6.4 - WHEN a user views their department info THEN display the department hierarchy
   */
  async function fetchUserDepartment(userId: string): Promise<Department | null> {
    setLoading(true);
    try {
      const response = await getUserDepartment(userId);
      if (response.code === 200 && response.data) {
        currentDepartment.value = response.data;
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user department:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }


  /**
   * Create a new department
   * Requirements: 6.2 - WHEN an admin creates a department THEN allow setting name, parent department, and leader
   * Property 16: Department Form Validation
   */
  async function createNewDepartment(data: CreateDepartmentRequest): Promise<string | null> {
    setLoading(true);
    try {
      const response = await createDepartment(data);
      if (response.code === 200 && response.data) {
        // Refresh the department list to include the new item
        await fetchDepartments();
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create department:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update an existing department
   * Requirements: 6.2 - Department management
   */
  async function updateExistingDepartment(data: UpdateDepartmentRequest): Promise<boolean> {
    setLoading(true);
    try {
      const response = await updateDepartment(data);
      if (response.code === 200) {
        // Refresh the department list
        await fetchDepartments();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update department:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a department
   * Requirements: 6.5 - WHEN an admin deletes a department THEN confirm the action and handle cascading effects
   */
  async function removeExistingDepartment(id: string): Promise<boolean> {
    setLoading(true);
    try {
      const response = await deleteDepartment(id);
      if (response.code === 200) {
        // Refresh the department list
        await fetchDepartments();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete department:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Set users to a department (replace all users)
   * Requirements: 6.3 - WHEN an admin assigns users to a department THEN update the department member list
   * Property 17: Department Member List Update
   */
  async function assignUsersToDepartment(data: AssignUsersRequest): Promise<boolean> {
    setLoading(true);
    try {
      const response = await setDepartmentUsers(data);
      if (response.code === 200) {
        // Refresh the department list to get updated members
        await fetchDepartments();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to assign users:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Add user to department
   * Requirements: 6.3 - Department member management
   * Property 17: Department Member List Update
   */
  async function addUserToDept(depId: string, userId: string): Promise<boolean> {
    setLoading(true);
    try {
      const response = await addDepartmentUser(depId, userId);
      if (response.code === 200) {
        await fetchDepartments();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add user to department:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Remove user from department
   * Requirements: 6.3 - Department member management
   * Property 17: Department Member List Update
   */
  async function removeUserFromDept(depId: string, userId: string): Promise<boolean> {
    setLoading(true);
    try {
      const response = await removeDepartmentUser(depId, userId);
      if (response.code === 200) {
        // Update local state - remove user from members list
        members.value = members.value.filter(m => m.userId !== userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove user from department:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update members list locally (for optimistic updates)
   * Property 17: Department Member List Update
   */
  function updateMembersLocally(newMembers: DepartmentUser[]): void {
    members.value = [...newMembers];
  }

  /**
   * Add member to local state
   * Property 17: Department Member List Update
   */
  function addMemberLocally(member: DepartmentUser): void {
    // Check if member already exists
    const exists = members.value.some(m => m.userId === member.userId);
    if (!exists) {
      members.value = [...members.value, member];
    }
  }

  /**
   * Clear current department
   */
  function clearCurrentDepartment(): void {
    currentDepartment.value = null;
  }

  /**
   * Clear members
   */
  function clearMembers(): void {
    members.value = [];
  }

  /**
   * Clear all department data
   */
  function clearDepartments(): void {
    departments.value = [];
    currentDepartment.value = null;
    members.value = [];
  }

  return {
    // State
    departments,
    currentDepartment,
    members,
    loading,

    // Getters
    departmentState,
    isLoading,
    flatDepartmentList,

    // Helper functions (exported for testing)
    validateTreeStructure,
    findDepartmentById,
    getDepartmentPath,

    // Actions
    setLoading,
    fetchDepartments,
    fetchDepartmentById,
    fetchUserDepartment,
    createNewDepartment,
    updateExistingDepartment,
    removeExistingDepartment,
    assignUsersToDepartment,
    addUserToDept,
    removeUserFromDept,
    updateMembersLocally,
    addMemberLocally,
    clearCurrentDepartment,
    clearMembers,
    clearDepartments,
  };
});
