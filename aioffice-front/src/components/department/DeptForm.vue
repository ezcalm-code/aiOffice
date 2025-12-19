<script setup lang="ts">
/**
 * DeptForm Component - Form for creating/editing departments
 * Requirements: 6.2 - WHEN an admin creates a department THEN allow setting name, parent department, and leader
 * Property 16: Department Form Validation
 */

import { ref, computed, watch } from 'vue';
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '../../types/department';

interface Props {
  department?: Department | null;
  parentDepartment?: Department | null;
  departments: Department[];
  mode: 'create' | 'edit';
}

const props = withDefaults(defineProps<Props>(), {
  department: null,
  parentDepartment: null,
  mode: 'create',
});

const emit = defineEmits<{
  (e: 'submit', data: CreateDepartmentRequest | UpdateDepartmentRequest): void;
  (e: 'cancel'): void;
}>();

// Form data
const formData = ref({
  name: '',
  parentId: '',
  leaderId: '',
});

// Form errors
const errors = ref({
  name: '',
  parentId: '',
});

// Initialize form data when department changes
watch(() => props.department, (dept) => {
  if (dept && props.mode === 'edit') {
    formData.value = {
      name: dept.name,
      parentId: dept.parentId || '',
      leaderId: dept.leaderId || '',
    };
  } else {
    formData.value = {
      name: '',
      parentId: props.parentDepartment?.id || '',
      leaderId: '',
    };
  }
  clearErrors();
}, { immediate: true });

// Watch parent department for create mode
watch(() => props.parentDepartment, (parent) => {
  if (props.mode === 'create' && parent) {
    formData.value.parentId = parent.id;
  }
}, { immediate: true });


// Flatten departments for parent selection
const flatDepartments = computed(() => {
  const result: { id: string; name: string; level: number }[] = [];
  
  function flatten(depts: Department[], level: number = 0): void {
    for (const dept of depts) {
      // Exclude current department and its children in edit mode
      if (props.mode === 'edit' && props.department) {
        if (dept.id === props.department.id) continue;
        if (dept.parentPath?.includes(props.department.id)) continue;
      }
      
      result.push({
        id: dept.id,
        name: '　'.repeat(level) + dept.name,
        level,
      });
      
      if (dept.child && dept.child.length > 0) {
        flatten(dept.child, level + 1);
      }
    }
  }
  
  flatten(props.departments);
  return result;
});

// Form title
const formTitle = computed(() => {
  if (props.mode === 'edit') {
    return '编辑部门';
  }
  return props.parentDepartment ? `添加子部门 - ${props.parentDepartment.name}` : '创建部门';
});

// Clear errors
function clearErrors(): void {
  errors.value = {
    name: '',
    parentId: '',
  };
}

/**
 * Validate form data
 * Property 16: Department Form Validation - form SHALL require name field and validate parent department selection
 */
function validateForm(): boolean {
  clearErrors();
  let isValid = true;
  
  // Validate name (required)
  if (!formData.value.name.trim()) {
    errors.value.name = '部门名称不能为空';
    isValid = false;
  } else if (formData.value.name.trim().length < 2) {
    errors.value.name = '部门名称至少需要2个字符';
    isValid = false;
  } else if (formData.value.name.trim().length > 50) {
    errors.value.name = '部门名称不能超过50个字符';
    isValid = false;
  }
  
  return isValid;
}

/**
 * Check if form data is valid for submission
 * Property 16: Department Form Validation
 */
function isFormValid(): boolean {
  return formData.value.name.trim().length >= 2;
}

// Handle form submission
function handleSubmit(): void {
  if (!validateForm()) {
    return;
  }
  
  if (props.mode === 'edit' && props.department) {
    const updateData: UpdateDepartmentRequest = {
      id: props.department.id,
      name: formData.value.name.trim(),
    };
    
    if (formData.value.parentId) {
      updateData.parentId = formData.value.parentId;
    }
    
    if (formData.value.leaderId) {
      updateData.leaderId = formData.value.leaderId;
    }
    
    emit('submit', updateData);
  } else {
    const createData: CreateDepartmentRequest = {
      name: formData.value.name.trim(),
    };
    
    if (formData.value.parentId) {
      createData.parentId = formData.value.parentId;
    }
    
    if (formData.value.leaderId) {
      createData.leaderId = formData.value.leaderId;
    }
    
    emit('submit', createData);
  }
}

// Handle cancel
function handleCancel(): void {
  emit('cancel');
}

// Export validation function for testing
defineExpose({
  validateForm,
  isFormValid,
  formData,
  errors,
});
</script>

<template>
  <div class="dept-form">
    <h3 class="form-title">{{ formTitle }}</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label required">部门名称</label>
        <input
          v-model="formData.name"
          type="text"
          class="form-input"
          :class="{ 'is-error': errors.name }"
          placeholder="请输入部门名称"
          maxlength="50"
        />
        <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
      </div>
      
      <div class="form-group">
        <label class="form-label">上级部门</label>
        <select
          v-model="formData.parentId"
          class="form-select"
        >
          <option value="">无（顶级部门）</option>
          <option 
            v-for="dept in flatDepartments" 
            :key="dept.id"
            :value="dept.id"
          >
            {{ dept.name }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">部门负责人ID</label>
        <input
          v-model="formData.leaderId"
          type="text"
          class="form-input"
          placeholder="请输入负责人ID（可选）"
        />
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-cancel" @click="handleCancel">
          取消
        </button>
        <button type="submit" class="btn btn-submit" :disabled="!isFormValid()">
          {{ mode === 'edit' ? '保存' : '创建' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.dept-form {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.form-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.form-label.required::after {
  content: '*';
  color: #f56c6c;
  margin-left: 4px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #409eff;
}

.form-input.is-error {
  border-color: #f56c6c;
}

.form-error {
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

.btn-cancel {
  background: #f5f7fa;
  color: #606266;
}

.btn-cancel:hover {
  background: #e6e8eb;
}

.btn-submit {
  background: #409eff;
  color: #fff;
}

.btn-submit:hover {
  background: #66b1ff;
}

.btn-submit:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}
</style>
