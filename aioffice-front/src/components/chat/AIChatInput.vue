<script setup lang="ts">
/**
 * AIChatInput Component - Input field for AI chat messages
 * Requirements: 2.1 - Send messages to AI_Chat
 */

import { ref } from 'vue';

interface Props {
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: '输入消息...',
  loading: false,
});

const emit = defineEmits<{
  (e: 'send', message: string): void;
  (e: 'upload', file: File): void;
}>();

const inputValue = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * Handle send message
 */
function handleSend(): void {
  const message = inputValue.value.trim();
  if (message && !props.disabled && !props.loading) {
    emit('send', message);
    inputValue.value = '';
  }
}

/**
 * Handle key press (Enter to send)
 */
function handleKeyPress(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

/**
 * Trigger file input click
 */
function triggerFileUpload(): void {
  fileInputRef.value?.click();
}

/**
 * Handle file selection
 * Requirements: 2.3 - Upload file in AI_Chat
 */
function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('upload', file);
    // Reset input
    target.value = '';
  }
}
</script>

<template>
  <div class="ai-chat-input">
    <div class="input-wrapper">
      <input
        ref="fileInputRef"
        type="file"
        class="file-input"
        accept=".md,.pdf,.docx,.txt"
        @change="handleFileChange"
      />
      
      <button 
        class="upload-btn"
        :disabled="disabled || loading"
        @click="triggerFileUpload"
        title="上传文件"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>
      
      <textarea
        v-model="inputValue"
        class="message-input"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        rows="1"
        @keypress="handleKeyPress"
      />
      
      <button 
        class="send-btn"
        :disabled="!inputValue.trim() || disabled || loading"
        @click="handleSend"
      >
        <span v-if="loading" class="loading-spinner"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ai-chat-input {
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f5f7fa;
  border-radius: 24px;
  padding: 8px 12px;
}

.file-input {
  display: none;
}

.message-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  min-height: 24px;
  max-height: 120px;
  padding: 0;
}

.message-input::placeholder {
  color: #909399;
}

.message-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-btn,
.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.upload-btn {
  background-color: transparent;
  color: #909399;
}

.upload-btn:hover:not(:disabled) {
  background-color: #e4e7ed;
  color: #606266;
}

.send-btn {
  background-color: #409eff;
  color: white;
}

.send-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.send-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
