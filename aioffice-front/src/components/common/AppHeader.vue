<script setup lang="ts">
/**
 * App Header Component
 * Top navigation bar with user info and mobile menu toggle
 * Requirements: 8.1, 8.2, 8.3 - Responsive layout with collapsible navigation
 */

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';

interface Props {
  sidebarCollapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sidebarCollapsed: false,
});

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void;
}>();

const router = useRouter();
const userStore = useUserStore();

const userName = computed(() => userStore.name || '用户');

/**
 * Handle logout action
 * Requirements: 1.3 - WHEN a user clicks logout THEN clear JWT_Token and redirect
 */
function handleLogout(): void {
  userStore.logout();
  router.push('/login');
}

/**
 * Toggle sidebar visibility (for mobile)
 */
function toggleSidebar(): void {
  emit('toggle-sidebar');
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button 
        class="menu-toggle" 
        @click="toggleSidebar"
        :aria-label="sidebarCollapsed ? '展开菜单' : '收起菜单'"
      >
        <span class="menu-icon">☰</span>
      </button>
      <h1 class="app-title">AIOffice</h1>
    </div>
    
    <div class="header-right">
      <div class="user-info">
        <span class="user-avatar">{{ userName.charAt(0).toUpperCase() }}</span>
        <span class="user-name">{{ userName }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout">
        退出
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.menu-toggle:hover {
  background-color: #f5f7fa;
}

.menu-icon {
  font-size: 20px;
  color: #606266;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.logout-btn {
  padding: 6px 16px;
  background-color: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

/* Tablet: 768px - 1024px */
@media (max-width: 1024px) {
  .menu-toggle {
    display: block;
  }
  
  .user-name {
    display: none;
  }
}

/* Mobile: < 768px */
@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }
  
  .app-title {
    font-size: 18px;
  }
  
  .header-right {
    gap: 8px;
  }
  
  .logout-btn {
    padding: 4px 12px;
    font-size: 13px;
  }
}
</style>
