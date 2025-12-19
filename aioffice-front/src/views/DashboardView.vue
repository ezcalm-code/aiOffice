<script setup lang="ts">
/**
 * Dashboard View - Main landing page after login
 * Displays overview of all modules: todos, approvals, chat, departments
 * Requirements: 8.1, 8.2, 8.3 - Responsive layout for all devices
 */

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useTodoStore } from '../stores/todo';
import { useApprovalStore } from '../stores/approval';
import { AppLayout, LoadingSpinner } from '../components/common';

const router = useRouter();
const userStore = useUserStore();
const todoStore = useTodoStore();
const approvalStore = useApprovalStore();

const loading = ref(true);

// Computed properties for dashboard stats
const userName = computed(() => userStore.name || '用户');

const todoStats = computed(() => {
  const todos = todoStore.todos;
  const pending = todos.filter(t => t.todoStatus === 0).length;
  const completed = todos.filter(t => t.todoStatus === 1).length;
  const approaching = todos.filter(t => todoStore.isDeadlineApproaching(t)).length;
  return { total: todos.length, pending, completed, approaching };
});

const approvalStats = computed(() => {
  const approvals = approvalStore.approvals;
  const pending = approvals.filter(a => a.status === 0 || a.status === 1).length;
  const approved = approvals.filter(a => a.status === 2).length;
  const rejected = approvals.filter(a => a.status === 4).length;
  return { total: approvals.length, pending, approved, rejected };
});

// Quick action cards
const quickActions = [
  { 
    title: '智能对话', 
    icon: '💬', 
    description: '与 AI 助手对话，快速处理工作',
    path: '/chat',
    color: '#409eff'
  },
  { 
    title: '新建待办', 
    icon: '📋', 
    description: '创建新的待办事项',
    path: '/todo',
    color: '#67c23a'
  },
  { 
    title: '发起审批', 
    icon: '✅', 
    description: '提交请假、外出等审批申请',
    path: '/approval',
    color: '#e6a23c'
  },
  { 
    title: '部门管理', 
    icon: '🏢', 
    description: '查看和管理部门组织架构',
    path: '/department',
    color: '#909399'
  },
];

/**
 * Navigate to a specific module
 */
function navigateTo(path: string): void {
  router.push(path);
}

/**
 * Load dashboard data
 */
async function loadDashboardData(): Promise<void> {
  loading.value = true;
  try {
    await Promise.all([
      todoStore.fetchTodos(),
      approvalStore.fetchApprovals(),
    ]);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <AppLayout>
    <div class="dashboard-view">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <h1 class="welcome-title">欢迎回来，{{ userName }}</h1>
        <p class="welcome-subtitle">AIOffice 智能办公系统</p>
      </section>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <LoadingSpinner size="large" text="加载中..." />
      </div>

      <template v-else>
        <!-- Stats Overview -->
        <section class="stats-section">
          <div class="stats-grid">
            <!-- Todo Stats -->
            <div class="stat-card todo-card" @click="navigateTo('/todo')">
              <div class="stat-icon">📋</div>
              <div class="stat-content">
                <h3 class="stat-title">待办事项</h3>
                <div class="stat-numbers">
                  <div class="stat-item">
                    <span class="stat-value">{{ todoStats.pending }}</span>
                    <span class="stat-label">待处理</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ todoStats.completed }}</span>
                    <span class="stat-label">已完成</span>
                  </div>
                  <div v-if="todoStats.approaching > 0" class="stat-item warning">
                    <span class="stat-value">{{ todoStats.approaching }}</span>
                    <span class="stat-label">即将到期</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Approval Stats -->
            <div class="stat-card approval-card" @click="navigateTo('/approval')">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <h3 class="stat-title">审批管理</h3>
                <div class="stat-numbers">
                  <div class="stat-item">
                    <span class="stat-value">{{ approvalStats.pending }}</span>
                    <span class="stat-label">待审批</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ approvalStats.approved }}</span>
                    <span class="stat-label">已通过</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ approvalStats.rejected }}</span>
                    <span class="stat-label">已拒绝</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="actions-section">
          <h2 class="section-title">快捷操作</h2>
          <div class="actions-grid">
            <button
              v-for="action in quickActions"
              :key="action.path"
              class="action-card"
              @click="navigateTo(action.path)"
            >
              <span class="action-icon" :style="{ backgroundColor: action.color }">
                {{ action.icon }}
              </span>
              <div class="action-content">
                <h3 class="action-title">{{ action.title }}</h3>
                <p class="action-desc">{{ action.description }}</p>
              </div>
            </button>
          </div>
        </section>
      </template>
    </div>
  </AppLayout>
</template>

<style scoped>
.dashboard-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Welcome Section */
.welcome-section {
  margin-bottom: 32px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* Stats Section */
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 40px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 12px 0;
}

.stat-numbers {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-item.warning .stat-value {
  color: #e6a23c;
}

/* Actions Section */
.actions-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 16px 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: #fff;
  border: none;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 12px;
}

.action-content {
  width: 100%;
}

.action-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
}

.action-desc {
  font-size: 12px;
  color: #909399;
  margin: 0;
  line-height: 1.4;
}

/* Tablet: 768px - 1024px */
@media (max-width: 1024px) {
  .dashboard-view {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile: < 768px */
@media (max-width: 768px) {
  .dashboard-view {
    padding: 16px;
  }
  
  .welcome-title {
    font-size: 22px;
  }
  
  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 28px;
  }
  
  .stat-numbers {
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .action-card {
    padding: 16px;
  }
  
  .action-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
  
  .action-desc {
    display: none;
  }
}
</style>
