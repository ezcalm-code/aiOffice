<script setup lang="ts">
/**
 * ApprovalView - Approval workflow management
 * Requirements: 5.1, 5.4, 5.6 - Approval list, creation, and details
 */

import { ref, onMounted, computed } from 'vue';
import { useApprovalStore } from '../stores/approval';
import ApprovalList from '../components/approval/ApprovalList.vue';
import ApprovalForm from '../components/approval/ApprovalForm.vue';
import ApprovalCard from '../components/approval/ApprovalCard.vue';
import type { 
  Approval,
  CreateLeaveApprovalRequest,
  CreateGoOutApprovalRequest,
  CreateMakeCardApprovalRequest
} from '../types/approval';
import { formatDateTime } from '../utils/date';

const approvalStore = useApprovalStore();

// View state
const showCreateForm = ref(false);
const showDetail = ref(false);
const selectedApproval = ref<Approval | null>(null);

// Computed
const approvals = computed(() => approvalStore.approvals);
const loading = computed(() => approvalStore.loading);
const currentApproval = computed(() => approvalStore.currentApproval);

// Fetch approvals on mount
onMounted(async () => {
  await approvalStore.fetchApprovals();
});

// Handle create button click
function handleCreate() {
  showCreateForm.value = true;
  showDetail.value = false;
}

// Handle form submission
async function handleFormSubmit(
  data: CreateLeaveApprovalRequest | CreateGoOutApprovalRequest | CreateMakeCardApprovalRequest
) {
  try {
    // Determine which type of approval to create based on the data structure
    if ('type' in data && 'timeType' in data) {
      await approvalStore.createLeave(data as CreateLeaveApprovalRequest);
    } else if ('duration' in data && !('checkType' in data)) {
      await approvalStore.createGoOut(data as CreateGoOutApprovalRequest);
    } else {
      await approvalStore.createMakeCard(data as CreateMakeCardApprovalRequest);
    }
    showCreateForm.value = false;
  } catch (error) {
    console.error('Failed to create approval:', error);
  }
}


// Handle form cancel
function handleFormCancel() {
  showCreateForm.value = false;
}

// Handle approval card click - show detail
async function handleApprovalClick(approval: Approval) {
  selectedApproval.value = approval;
  await approvalStore.fetchApprovalDetail(approval.id);
  showDetail.value = true;
  showCreateForm.value = false;
}

// Handle approve action
async function handleApprove(approval: Approval) {
  try {
    await approvalStore.dispose({
      id: approval.id,
      action: 'approve',
    });
  } catch (error) {
    console.error('Failed to approve:', error);
  }
}

// Handle reject action
async function handleReject(approval: Approval) {
  try {
    await approvalStore.dispose({
      id: approval.id,
      action: 'reject',
    });
  } catch (error) {
    console.error('Failed to reject:', error);
  }
}

// Handle cancel action
async function handleCancel(approval: Approval) {
  try {
    await approvalStore.cancel(approval.id);
  } catch (error) {
    console.error('Failed to cancel:', error);
  }
}

// Close detail view
function closeDetail() {
  showDetail.value = false;
  selectedApproval.value = null;
  approvalStore.clearCurrentApproval();
}

// Format timestamp for display
function formatTime(timestamp: number): string {
  if (!timestamp) return '未知';
  return formatDateTime(timestamp * 1000);
}
</script>

<template>
  <div class="approval-view">
    <div class="view-header">
      <h1 class="view-title">审批管理</h1>
      <button class="btn btn-primary" @click="handleCreate">
        新建审批
      </button>
    </div>

    <div class="view-content">
      <!-- Create Form -->
      <div v-if="showCreateForm" class="form-section">
        <div class="section-header">
          <h2>新建审批</h2>
          <button class="btn-close" @click="handleFormCancel">×</button>
        </div>
        <ApprovalForm
          :loading="loading"
          @submit="handleFormSubmit"
          @cancel="handleFormCancel"
        />
      </div>

      <!-- Detail View -->
      <div v-else-if="showDetail && currentApproval" class="detail-section">
        <div class="section-header">
          <h2>审批详情</h2>
          <button class="btn-close" @click="closeDetail">×</button>
        </div>
        <div class="detail-content">
          <div class="detail-item">
            <span class="detail-label">审批编号:</span>
            <span class="detail-value">{{ currentApproval.no }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">审批标题:</span>
            <span class="detail-value">{{ currentApproval.title }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">审批状态:</span>
            <span class="detail-value">
              {{ approvalStore.getStatusDisplay(currentApproval.status).label }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">审批类型:</span>
            <span class="detail-value">
              {{ approvalStore.getApprovalTypeLabel(currentApproval.type) }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">申请原因:</span>
            <span class="detail-value">{{ currentApproval.reason }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间:</span>
            <span class="detail-value">{{ formatTime(currentApproval.createAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">更新时间:</span>
            <span class="detail-value">{{ formatTime(currentApproval.updateAt) }}</span>
          </div>
          
          <!-- Leave specific info -->
          <template v-if="currentApproval.leave">
            <div class="detail-item">
              <span class="detail-label">开始时间:</span>
              <span class="detail-value">{{ formatTime(currentApproval.leave.startTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">结束时间:</span>
              <span class="detail-value">{{ formatTime(currentApproval.leave.endTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">时长:</span>
              <span class="detail-value">
                {{ currentApproval.leave.duration }}
                {{ currentApproval.leave.timeType === 1 ? '小时' : '天' }}
              </span>
            </div>
          </template>
          
          <!-- Go-out specific info -->
          <template v-if="currentApproval.goOut">
            <div class="detail-item">
              <span class="detail-label">外出开始:</span>
              <span class="detail-value">{{ formatTime(currentApproval.goOut.startTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">外出结束:</span>
              <span class="detail-value">{{ formatTime(currentApproval.goOut.endTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">时长:</span>
              <span class="detail-value">{{ currentApproval.goOut.duration }} 小时</span>
            </div>
          </template>
          
          <!-- Make-card specific info -->
          <template v-if="currentApproval.makeCard">
            <div class="detail-item">
              <span class="detail-label">补卡日期:</span>
              <span class="detail-value">{{ formatTime(currentApproval.makeCard.date) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">补卡类型:</span>
              <span class="detail-value">
                {{ currentApproval.makeCard.checkType === 1 ? '上班打卡' : '下班打卡' }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- Approval List -->
      <div v-else class="list-section">
        <ApprovalList
          :approvals="approvals"
          :loading="loading"
          @click="handleApprovalClick"
          @approve="handleApprove"
          @reject="handleReject"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>


<style scoped>
.approval-view {
  padding: 24px;
  max-width: 1200px;
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

.view-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f5f7fa;
  color: #606266;
}

.form-section,
.detail-section {
  padding: 0;
}

.form-section :deep(.approval-form) {
  border-radius: 0 0 8px 8px;
}

.detail-content {
  padding: 20px;
}

.detail-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  width: 120px;
  flex-shrink: 0;
  color: #909399;
  font-size: 14px;
}

.detail-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
}

.list-section {
  padding: 20px;
}

@media (max-width: 768px) {
  .approval-view {
    padding: 16px;
  }
  
  .view-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .detail-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .detail-label {
    width: auto;
  }
}
</style>
