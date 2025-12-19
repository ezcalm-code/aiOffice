<script setup lang="ts">
/**
 * App Sidebar Component
 * Navigation sidebar with responsive behavior
 * Requirements: 8.1 - Mobile layout with collapsible navigation
 * Requirements: 8.2 - Tablet-optimized layout
 * Requirements: 8.3 - Desktop layout with sidebar navigation
 */

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface Props {
  collapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const route = useRoute();
const router = useRouter();

// Navigation menu items
const menuItems = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/chat', name: '智能对话', icon: '💬' },
  { path: '/todo', name: '待办事项', icon: '📋' },
  { path: '/approval', name: '审批管理', icon: '✅' },
  { path: '/department', name: '部门管理', icon: '🏢' },
];

const currentPath = computed(() => route.path);

/**
 * Navigate to a route and close sidebar on mobile
 */
function navigateTo(path: string): void {
  router.push(path);
  emit('close');
}

/**
 * Check if a menu item is active
 */
function isActive(path: string): boolean {
  return currentPath.value === path;
}
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <!-- Overlay for mobile -->
    <div 
      v-if="!collapsed" 
      class="sidebar-overlay" 
      @click="emit('close')"
    ></div>
    
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li 
          v-for="item in menuItems" 
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <button 
            class="nav-link"
            @click="navigateTo(item.path)"
            :aria-current="isActive(item.path) ? 'page' : undefined"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.name }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 220px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  z-index: 999;
  transition: transform 0.3s ease;
}

.sidebar-overlay {
  display: none;
}

.sidebar-nav {
  padding: 16px 0;
  height: 100%;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 4px 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.nav-link:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.nav-item.active .nav-link {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.nav-text {
  flex: 1;
}

/* Tablet: 768px - 1024px */
@media (max-width: 1024px) {
  .app-sidebar {
    transform: translateX(-100%);
  }
  
  .app-sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: -1;
  }
}

/* Mobile: < 768px */
@media (max-width: 768px) {
  .app-sidebar {
    width: 260px;
  }
  
  .nav-link {
    padding: 14px 16px;
    font-size: 15px;
  }
  
  .nav-icon {
    font-size: 20px;
  }
}
</style>
