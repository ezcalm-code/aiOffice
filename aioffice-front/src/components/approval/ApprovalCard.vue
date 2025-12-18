<script setup lang="ts">
/**
 * ApprovalCard Component - Displays a single approval item
 * Requirements: 5.4 - Display approvals with status indicators
 * Property 13: Approval Status Display
 */

import { computed } from 'vue';
import type { Approval } from '../../types/approval';
import { formatDateTime } from '../../utils/date';
import { getStatusDisplay, getApprovalTypeLabel } from '../../stores/approval';

interface Props {
  approval: Approval;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'click', approval: Approval): void;
  (e: 'approve', approval: Approval): void;
  (e: 'reject', approval: Approval): void;
  (e: 'cancel', approval: Approval): void;
}>();

// Get status display info
const statusDisplay = computed(() => getStatusDisplay(props.approval.status));

// Get approval type label
const typeLabel = computed(() => getApprovalTypeLabel(props.approval.type));

// Format create time
const formattedCreateTime = computed(() => {
  if (!props.approval.createAt) return '未知';
  return formatDateTime(props.approval.createAt * 1000);
});

// Check if approval can be processed
const canProcess = computed(() => 
  props.approval.status === 0 || props.approval.status === 1
);

// Check if approval can be cancelled
const canCancel = computed(() => 
  props.approval.status === 0 || props.approval.status === 1
);

// Get status class
const statusClass = computed(() => {
  switch (statusDisplay.value.type) {
    case 'success': return 'status-success';
    case 'warning': return 'status-warning';
    case 'danger': return 'status-danger';
    default: return 'status-info';
  }
});


// Handle card click
function handleClick() {
  emit('click', props.approval);
}

// Handle approve button click
function handleApprove(event: Event) {
  event.stopPropagation();
  emit('approve', props.approval);
}

// Handle reject button click
function handleReject(event: Event) {
  event.stopPropagation();
  emit('reject', props.approval);
}

// Handle cancel button click
function handleCancel(event: Event) {
  event.stopPropagation();
  emit('cancel', props.approval);
}
</script>

<template>
  <div class="approval-card" @click="handleClick">
    <div class="approval-header">
      <h3 class="approval-title">{{ approval.title || typeLabel }}</h3>
      <span class="approval-status" :class="statusClass">{{ statusDisplay.label }}</span>
    </div>
    
    <div class="approval-info">
      <div class="info-item">
        <span class="info-label">审批类型:</span>
        <span class="info-value">{{ typeLabel }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">审批编号:</span>
        <span class="info-value">{{ approval.no }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">创建时间:</span>
        <span class="info-value">{{ formattedCreateTime }}</span>
      </div>
    </div>
    
    <p v-if="approval.abstract" class="approval-abstract">{{ approval.abstract }}</p>
    
    <div class="approval-actions">
      <button 
        v-if="canProcess" 
        class="btn btn-approve"
        @click="handleApprove"
      >
        通过
      </button>
      <button 
        v-if="canProcess" 
        class="btn btn-reject"
        @click="handleReject"
      >
        拒绝
      </button>
      <button 
        v-if="canCancel" 
        class="btn btn-cancel"
        @click="handleCancel"
      >
        撤销
      </button>
    </div>
  </div>
</template>

<style scoped>
.approval-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
}

.approval-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.approval-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.approval-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-info {
  background: #f4f4f5;
  color: #909399;
}

.status-warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-success {
  background: #f0f9eb;
  color: #67c23a;
}

.status-danger {
  background: #fef0f0;
  color: #f56c6c;
}

.approval-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  color: #909399;
  margin-right: 4px;
}

.info-value {
  color: #606266;
}

.approval-abstract {
  margin: 0 0 12px;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.approval-actions {
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

.btn-approve {
  background: #67c23a;
  color: #fff;
}

.btn-approve:hover {
  background: #85ce61;
}

.btn-reject {
  background: #f56c6c;
  color: #fff;
}

.btn-reject:hover {
  background: #f78989;
}

.btn-cancel {
  background: #909399;
  color: #fff;
}

.btn-cancel:hover {
  background: #a6a9ad;
}
</style>
