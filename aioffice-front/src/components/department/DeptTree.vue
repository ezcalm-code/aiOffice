<script setup lang="ts">
/**
 * DeptTree Component - Displays department tree structure
 * Requirements: 6.1 - WHEN a user views the Department_Module THEN display the department tree structure
 * Property 15: Department Tree Structure Preservation
 */

import { computed } from 'vue';
import type { Department } from '../../types/department';

interface Props {
  departments: Department[];
  selectedId?: string;
  expandedIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: '',
  expandedIds: () => [],
});

const emit = defineEmits<{
  (e: 'select', department: Department): void;
  (e: 'expand', departmentId: string): void;
  (e: 'collapse', departmentId: string): void;
  (e: 'edit', department: Department): void;
  (e: 'delete', department: Department): void;
  (e: 'add-child', department: Department): void;
}>();

// Check if a department is expanded
function isExpanded(id: string): boolean {
  return props.expandedIds.includes(id);
}

// Check if a department is selected
function isSelected(id: string): boolean {
  return props.selectedId === id;
}

// Handle department click
function handleSelect(dept: Department) {
  emit('select', dept);
}

// Handle expand/collapse toggle
function handleToggle(dept: Department) {
  if (isExpanded(dept.id)) {
    emit('collapse', dept.id);
  } else {
    emit('expand', dept.id);
  }
}

// Handle edit click
function handleEdit(event: Event, dept: Department) {
  event.stopPropagation();
  emit('edit', dept);
}

// Handle delete click
function handleDelete(event: Event, dept: Department) {
  event.stopPropagation();
  emit('delete', dept);
}


// Handle add child click
function handleAddChild(event: Event, dept: Department) {
  event.stopPropagation();
  emit('add-child', dept);
}

// Check if department has children
function hasChildren(dept: Department): boolean {
  return dept.child && dept.child.length > 0;
}
</script>

<template>
  <div class="dept-tree">
    <div 
      v-for="dept in departments" 
      :key="dept.id"
      class="dept-tree-node"
    >
      <div 
        class="dept-node-content"
        :class="{ 
          'is-selected': isSelected(dept.id),
          'has-children': hasChildren(dept)
        }"
        @click="handleSelect(dept)"
      >
        <span 
          v-if="hasChildren(dept)"
          class="dept-expand-icon"
          @click.stop="handleToggle(dept)"
        >
          {{ isExpanded(dept.id) ? '▼' : '▶' }}
        </span>
        <span v-else class="dept-expand-placeholder"></span>
        
        <span class="dept-icon">📁</span>
        
        <div class="dept-info">
          <span class="dept-name">{{ dept.name }}</span>
          <span v-if="dept.leader" class="dept-leader">负责人: {{ dept.leader }}</span>
          <span class="dept-count">{{ dept.count || 0 }}人</span>
        </div>
        
        <div class="dept-actions">
          <button 
            class="btn-icon"
            title="添加子部门"
            @click="handleAddChild($event, dept)"
          >
            ➕
          </button>
          <button 
            class="btn-icon"
            title="编辑"
            @click="handleEdit($event, dept)"
          >
            ✏️
          </button>
          <button 
            class="btn-icon btn-danger"
            title="删除"
            @click="handleDelete($event, dept)"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <!-- Recursive children -->
      <div 
        v-if="hasChildren(dept) && isExpanded(dept.id)"
        class="dept-children"
      >
        <DeptTree
          :departments="dept.child"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          @select="(d) => emit('select', d)"
          @expand="(id) => emit('expand', id)"
          @collapse="(id) => emit('collapse', id)"
          @edit="(d) => emit('edit', d)"
          @delete="(d) => emit('delete', d)"
          @add-child="(d) => emit('add-child', d)"
        />
      </div>
    </div>
    
    <div v-if="departments.length === 0" class="dept-empty">
      暂无部门数据
    </div>
  </div>
</template>

<style scoped>
.dept-tree {
  font-size: 14px;
}

.dept-tree-node {
  margin-bottom: 2px;
}

.dept-node-content {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.dept-node-content:hover {
  background: #f5f7fa;
}

.dept-node-content.is-selected {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.dept-expand-icon {
  width: 20px;
  font-size: 10px;
  color: #909399;
  cursor: pointer;
  user-select: none;
}

.dept-expand-placeholder {
  width: 20px;
}

.dept-icon {
  margin-right: 8px;
  font-size: 16px;
}

.dept-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dept-name {
  font-weight: 500;
  color: #303133;
}

.dept-leader {
  font-size: 12px;
  color: #909399;
}

.dept-count {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 10px;
}

.dept-actions {
  display: none;
  gap: 4px;
}

.dept-node-content:hover .dept-actions {
  display: flex;
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #e6e8eb;
}

.btn-icon.btn-danger:hover {
  background: #fef0f0;
}

.dept-children {
  margin-left: 24px;
  border-left: 1px dashed #dcdfe6;
  padding-left: 8px;
}

.dept-empty {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>
