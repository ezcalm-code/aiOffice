<script setup lang="ts">
/**
 * Department View - Organization structure management
 * Requirements: 6.1, 6.2, 6.3, 6.4 - Department management functionality
 */

import { ref, computed, onMounted } from 'vue';
import { useDepartmentStore } from '../stores/department';
import DeptTree from '../components/department/DeptTree.vue';
import DeptForm from '../components/department/DeptForm.vue';
import { AppLayout } from '../components/common';
import type { 
  Department, 
  DepartmentUser,
  CreateDepartmentRequest, 
  UpdateDepartmentRequest 
} from '../types/department';

const departmentStore = useDepartmentStore();

// UI state
const showForm = ref(false);
const showMemberPanel = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedDepartment = ref<Department | null>(null);
const parentDepartment = ref<Department | null>(null);
const expandedIds = ref<string[]>([]);
const newUserId = ref('');

// Computed properties
const departments = computed(() => departmentStore.departments);
const members = computed(() => departmentStore.currentDepartment?.users || []);
const loading = computed(() => departmentStore.isLoading);
const currentDepartment = computed(() => departmentStore.currentDepartment);

// Load departments on mount
onMounted(async () => {
  await departmentStore.fetchDepartments();
});

// Handle department selection
async function handleSelectDepartment(dept: Department) {
  selectedDepartment.value = dept;
  await departmentStore.fetchDepartmentById(dept.id);
  showMemberPanel.value = true;
}

// Handle expand
function handleExpand(id: string) {
  if (!expandedIds.value.includes(id)) {
    expandedIds.value = [...expandedIds.value, id];
  }
}

// Handle collapse
function handleCollapse(id: string) {
  expandedIds.value = expandedIds.value.filter(i => i !== id);
}


// Show create form (root level)
function showCreateForm() {
  formMode.value = 'create';
  selectedDepartment.value = null;
  parentDepartment.value = null;
  showForm.value = true;
}

// Show create child form
function showCreateChildForm(parent: Department) {
  formMode.value = 'create';
  selectedDepartment.value = null;
  parentDepartment.value = parent;
  showForm.value = true;
}

// Show edit form
function showEditForm(dept: Department) {
  formMode.value = 'edit';
  selectedDepartment.value = dept;
  parentDepartment.value = null;
  showForm.value = true;
}

// Close form
function closeForm() {
  showForm.value = false;
  selectedDepartment.value = null;
  parentDepartment.value = null;
}

// Handle form submit
async function handleFormSubmit(data: CreateDepartmentRequest | UpdateDepartmentRequest) {
  try {
    if (formMode.value === 'edit' && 'id' in data) {
      await departmentStore.updateExistingDepartment(data as UpdateDepartmentRequest);
    } else {
      await departmentStore.createNewDepartment(data as CreateDepartmentRequest);
    }
    closeForm();
  } catch (error) {
    console.error('Failed to save department:', error);
  }
}

// Handle delete department
async function handleDeleteDepartment(dept: Department) {
  const hasChildren = dept.child && dept.child.length > 0;
  const message = hasChildren 
    ? `部门 "${dept.name}" 下有子部门，确定要删除吗？这将同时删除所有子部门。`
    : `确定要删除部门 "${dept.name}" 吗？`;
  
  if (!confirm(message)) return;
  
  try {
    await departmentStore.removeExistingDepartment(dept.id);
    if (selectedDepartment.value?.id === dept.id) {
      selectedDepartment.value = null;
      showMemberPanel.value = false;
    }
  } catch (error) {
    console.error('Failed to delete department:', error);
  }
}

// Close member panel
function closeMemberPanel() {
  showMemberPanel.value = false;
  selectedDepartment.value = null;
  departmentStore.clearMembers();
}

// Handle add user to department
async function handleAddUser() {
  if (!selectedDepartment.value || !newUserId.value.trim()) return;
  
  try {
    await departmentStore.addUserToDept(selectedDepartment.value.id, newUserId.value.trim());
    // Refresh department info to get updated users
    await departmentStore.fetchDepartmentById(selectedDepartment.value.id);
    newUserId.value = '';
  } catch (error) {
    console.error('Failed to add user:', error);
  }
}

// Handle remove user from department
async function handleRemoveUser(user: DepartmentUser) {
  if (!selectedDepartment.value) return;
  if (!confirm(`确定要将 "${user.userName}" 从部门中移除吗？`)) return;
  
  try {
    await departmentStore.removeUserFromDept(selectedDepartment.value.id, user.userId);
    // Refresh department info to get updated users
    await departmentStore.fetchDepartmentById(selectedDepartment.value.id);
  } catch (error) {
    console.error('Failed to remove user:', error);
  }
}

// Get department path for display
function getDepartmentPathText(dept: Department): string {
  const path = departmentStore.getDepartmentPath(dept.id);
  return path.map(d => d.name).join(' > ');
}
</script>


<template>
  <AppLayout>
    <div class="department-view">
      <!-- Header -->
      <div class="view-header">
      <h1 class="view-title">部门管理</h1>
      <button class="btn btn-primary" @click="showCreateForm">
        + 新建部门
      </button>
    </div>
    
    <div class="department-content">
      <!-- Department Tree -->
      <div class="tree-section">
        <div class="section-header">
          <h2>组织架构</h2>
        </div>
        
        <div v-if="loading" class="loading-state">
          加载中...
        </div>
        
        <DeptTree
          v-else
          :departments="departments"
          :selected-id="selectedDepartment?.id || ''"
          :expanded-ids="expandedIds"
          @select="handleSelectDepartment"
          @expand="handleExpand"
          @collapse="handleCollapse"
          @edit="showEditForm"
          @delete="handleDeleteDepartment"
          @add-child="showCreateChildForm"
        />
      </div>
      
      <!-- Member Panel -->
      <div v-if="showMemberPanel && selectedDepartment" class="member-section">
        <div class="section-header">
          <h2>{{ selectedDepartment.name }}</h2>
          <button class="btn-close" @click="closeMemberPanel">×</button>
        </div>
        
        <div class="department-info">
          <p><strong>部门路径:</strong> {{ getDepartmentPathText(selectedDepartment) }}</p>
          <p v-if="selectedDepartment.leader"><strong>负责人:</strong> {{ selectedDepartment.leader }}</p>
          <p><strong>成员数量:</strong> {{ selectedDepartment.count || members.length }}人</p>
        </div>
        
        <!-- Add User Form -->
        <div class="add-user-form">
          <input
            v-model="newUserId"
            type="text"
            class="form-input"
            placeholder="输入用户ID添加成员"
          />
          <button 
            class="btn btn-primary btn-small"
            :disabled="!newUserId.trim()"
            @click="handleAddUser"
          >
            添加
          </button>
        </div>
        
        <!-- Member List -->
        <div class="member-list">
          <h3>部门成员</h3>
          
          <div v-if="members.length > 0" class="members">
            <div v-for="member in members" :key="member.id" class="member-item">
              <div class="member-info">
                <span class="member-avatar">👤</span>
                <span class="member-name">{{ member.userName }}</span>
              </div>
              <button 
                class="btn-icon btn-danger"
                title="移除成员"
                @click="handleRemoveUser(member)"
              >
                ✕
              </button>
            </div>
          </div>
          
          <p v-else class="no-members">暂无成员</p>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!showMemberPanel" class="empty-panel">
        <p>选择一个部门查看详情</p>
      </div>
    </div>
    
      <!-- Create/Edit Form Modal -->
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal-content">
          <DeptForm
            :department="selectedDepartment"
            :parent-department="parentDepartment"
            :departments="departments"
            :mode="formMode"
            @submit="handleFormSubmit"
            @cancel="closeForm"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>


<style scoped>
.department-view {
  padding: 24px;
  max-width: 1400px;
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

.department-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 500px;
}

.tree-section,
.member-section,
.empty-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.department-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.department-info p {
  margin: 0 0 8px;
  font-size: 14px;
  color: #606266;
}

.department-info p:last-child {
  margin-bottom: 0;
}

.add-user-form {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.member-list h3 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.members {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: background 0.2s;
}

.member-item:hover {
  background: #ecf5ff;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-avatar {
  font-size: 18px;
}

.member-name {
  font-size: 14px;
  color: #303133;
}

.no-members {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px;
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
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

.btn-primary:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
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

.btn-icon {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #fef0f0;
}

.btn-icon.btn-danger {
  color: #f56c6c;
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
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .department-view {
    padding: 16px;
  }
  
  .view-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .department-content {
    grid-template-columns: 1fr;
  }
}
</style>
