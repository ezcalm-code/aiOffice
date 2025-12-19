<script setup lang="ts">
/**
 * Loading Spinner Component
 * A reusable loading indicator with customizable size and text
 * Requirements: 8.1, 8.2, 8.3 - Responsive UI components
 */

interface Props {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullscreen?: boolean;
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
  text: '',
  fullscreen: false,
});
</script>

<template>
  <div 
    class="loading-spinner" 
    :class="[`size-${size}`, { fullscreen }]"
  >
    <div class="spinner"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-spinner.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  border-color: #409eff transparent transparent transparent;
  animation: spin 1s linear infinite;
}

/* Size variants */
.size-small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.size-medium .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.size-large .spinner {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.loading-text {
  font-size: 14px;
  color: #606266;
}

.size-small .loading-text {
  font-size: 12px;
}

.size-large .loading-text {
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
