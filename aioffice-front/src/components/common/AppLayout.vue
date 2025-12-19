<script setup lang="ts">
/**
 * App Layout Component
 * Main layout wrapper with header, sidebar, and content area
 * Requirements: 8.1, 8.2, 8.3 - Responsive layout for mobile, tablet, and desktop
 */

import { ref, onMounted, onUnmounted } from 'vue';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';

// Sidebar state
const sidebarCollapsed = ref(true);

// Viewport breakpoints
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Toggle sidebar visibility
 */
function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

/**
 * Close sidebar (for mobile navigation)
 */
function closeSidebar(): void {
  sidebarCollapsed.value = true;
}

/**
 * Handle window resize to manage sidebar state
 * Requirements: 8.3 - Desktop layout with sidebar navigation
 */
function handleResize(): void {
  const width = window.innerWidth;
  
  // On desktop, sidebar is always visible
  if (width > TABLET_BREAKPOINT) {
    sidebarCollapsed.value = false;
  } else {
    // On tablet/mobile, sidebar is collapsed by default
    sidebarCollapsed.value = true;
  }
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="app-layout">
    <AppHeader 
      :sidebar-collapsed="sidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
    />
    
    <AppSidebar 
      :collapsed="sidebarCollapsed"
      @close="closeSidebar"
    />
    
    <main class="app-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-main {
  margin-top: 60px;
  margin-left: 220px;
  min-height: calc(100vh - 60px);
  transition: margin-left 0.3s ease;
}

/* Tablet: 768px - 1024px */
@media (max-width: 1024px) {
  .app-main {
    margin-left: 0;
  }
}

/* Mobile: < 768px */
@media (max-width: 768px) {
  .app-main {
    margin-left: 0;
  }
}
</style>
