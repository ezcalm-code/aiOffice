<script setup lang="ts">
/**
 * ChatWindow Component - Main chat window container
 * Requirements: 2.1, 2.2, 3.2 - AI Chat and real-time messaging
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import MessageItem from './MessageItem.vue';
import AIChatInput from './AIChatInput.vue';
import type { ChatMessage, AIChatMessage, ConnectionStatus } from '../../types/chat';

interface Props {
  messages?: (ChatMessage | AIChatMessage)[];
  currentUserId?: string;
  connectionStatus?: ConnectionStatus;
  loading?: boolean;
  type?: 'chat' | 'ai';
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
  currentUserId: '',
  connectionStatus: 'disconnected',
  loading: false,
  type: 'ai',
  title: 'AI 助手',
});

const emit = defineEmits<{
  (e: 'send', message: string): void;
  (e: 'upload', file: File): void;
}>();

const messagesContainerRef = ref<HTMLElement | null>(null);

// Connection status display
const connectionStatusText = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return '已连接';
    case 'connecting':
      return '连接中...';
    case 'reconnecting':
      return '重新连接中...';
    case 'disconnected':
    default:
      return '未连接';
  }
});

const connectionStatusClass = computed(() => {
  return `status-${props.connectionStatus}`;
});

/**
 * Scroll to bottom of messages
 */
function scrollToBottom(): void {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
    }
  });
}

/**
 * Handle send message
 */
function handleSend(message: string): void {
  emit('send', message);
}

/**
 * Handle file upload
 */
function handleUpload(file: File): void {
  emit('upload', file);
}

// Auto-scroll when new messages arrive
watch(
  () => props.messages.length,
  () => {
    scrollToBottom();
  }
);

// Scroll to bottom on mount
onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="chat-window">
    <!-- Header -->
    <div class="chat-header">
      <div class="chat-title">{{ title }}</div>
      <div class="chat-status" :class="connectionStatusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ connectionStatusText }}</span>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="messagesContainerRef" class="messages-container">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <div class="empty-text">开始对话吧</div>
      </div>
      
      <template v-else>
        <MessageItem
          v-for="(message, index) in messages"
          :key="'role' in message ? message.id : `${message.conversationId}-${index}`"
          :message="message"
          :current-user-id="currentUserId"
          :type="type"
        />
      </template>
      
      <!-- Loading indicator -->
      <div v-if="loading" class="loading-indicator">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="loading-text">AI 正在思考...</span>
      </div>
    </div>

    <!-- Input Area -->
    <AIChatInput
      :disabled="connectionStatus === 'disconnected' && type === 'chat'"
      :loading="loading"
      :placeholder="type === 'ai' ? '向 AI 助手提问...' : '输入消息...'"
      @send="handleSend"
      @upload="handleUpload"
    />
  </div>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-connected .status-dot {
  background-color: #67c23a;
}

.status-connected .status-text {
  color: #67c23a;
}

.status-connecting .status-dot,
.status-reconnecting .status-dot {
  background-color: #e6a23c;
  animation: pulse 1s infinite;
}

.status-connecting .status-text,
.status-reconnecting .status-text {
  color: #e6a23c;
}

.status-disconnected .status-dot {
  background-color: #909399;
}

.status-disconnected .status-text {
  color: #909399;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  background-color: #fafafa;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  color: #909399;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #67c23a;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: 13px;
}
</style>
