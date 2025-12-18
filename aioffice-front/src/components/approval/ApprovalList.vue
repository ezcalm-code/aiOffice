<script setup lang="ts">
/**
 * ApprovalList Component - Displays a list of approvals
 * Requirements: 5.4 - Display approvals with status indicators
 */

import { computed } from 'vue';
import type { Approval } from '../../types/approval';
import ApprovalCard from './ApprovalCard.vue';

interface Props {
  approvals: Approval[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'click', approval: Approval): void;
  (e: 'approve', approval: Approval): void;
  (e: 'reject', approval: Approval): void;
  (e: 'cancel', approval: Approval): void;
}>();

const hasApprovals = computed(() => props.approvals.length > 0);

function handleClick(approval: Approval) {
  emit('click', approval);
}

function handleApprove(approval: Approval) {
  emit('approve', approval);
}

function handleReject(approval: Approval) {
  emit('reject', approval);
}

function handleCancel(approval: Approval) {
  emit('cancel', approval);
}
</script>

<template>
  <div class="approval-list">
    <div v-if="loading" class="loading-state">
      <span class="loading-spinner"></span>
      <span>加载中...</span>
    </div>
    
    <div v-else-if="!hasApprovals" class="empty-state">
      <p>暂无审批记录</p>
    </div>
    
    <div v-else class="approval-items">
      <ApprovalCard
        v-for="approval in approvals"
        :key="approval.id"
        :approval="approval"
        @click="handleClick"
        @approve="handleApprove"
        @reject="handleReject"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<style scoped>
.approval-list {
  width: 100%;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.approval-items {
  display: flex;
  flex-direction: column;
}
</style>
