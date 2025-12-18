<script setup lang="ts">
/**
 * Dashboard View - Main landing page after login
 * Placeholder component - will be implemented in task 16.2
 */
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
</script>

<template>
  <div class="dashboard-container">
    <h1>欢迎回来，{{ userStore.name || '用户' }}</h1>
    <p>AIOffice 智能办公系统</p>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 24px;
}
</style>
