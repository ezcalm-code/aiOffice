<script setup lang="ts">
/**
 * MessageItem Component - Displays a single chat message
 * Requirements: 2.1, 2.2, 3.2 - Display messages in chat interface
 */

import { computed } from 'vue';
import type { ChatMessage, AIChatMessage } from '../../types/chat';
import { formatDateTime } from '../../utils/date';

interface Props {
  message: ChatMessage | AIChatMessage;
  currentUserId?: string;
  type?: 'chat' | 'ai';
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: '',
  type: 'chat',
});

// Determine if this is an AI message
const isAIMessage = computed(() => {
  return props.type === 'ai' || 'role' in props.message;
});

// Determine if message is from current user
const isOwnMessage = computed(() => {
  if (isAIMessage.value) {
    return (props.message as AIChatMessage).role === 'user';
  }
  return (props.message as ChatMessage).sendId === props.currentUserId;
});

// Get message content
const content = computed(() => props.message.content);

// Get timestamp for display
const timestamp = computed(() => {
  if (isAIMessage.value) {
    return formatDateTime((props.message as AIChatMessage).timestamp);
  }
  return '';
});

// Check if message is loading (AI messages only)
const isLoading = computed(() => {
  if (isAIMessage.value) {
    return (props.message as AIChatMessage).loading ?? false;
  }
  return false;
});

// Get message role for AI messages
const role = computed(() => {
  if (isAIMessage.value) {
    return (props.message as AIChatMessage).role;
  }
  return 'user';
});
</script>

<template>
  <div 
    class="message-item"
    :class="{
      'message-own': isOwnMessage,
      'message-other': !isOwnMessage,
      'message-ai': isAIMessage && role === 'assistant',
      'message-user': isAIMessage && role === 'user',
    }"
  >
    <div class="message-avatar">
      <div class="avatar" :class="{ 'avatar-ai': role === 'assistant' }">
        {{ role === 'assistant' ? 'AI' : 'U' }}
      </div>
    </div>
    
    <div class="message-content-wrapper">
      <div class="message-bubble">
        <div v-if="isLoading" class="message-loading">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
        <div v-else class="message-text">{{ content }}</div>
      </div>
      
      <div v-if="timestamp" class="message-time">
        {{ timestamp }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  margin-bottom: 16px;
  padding: 0 16px;
}

.message-own {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin: 0 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.avatar-ai {
  background-color: #67c23a;
}

.message-content-wrapper {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-own .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  word-break: break-word;
  line-height: 1.5;
}

.message-own .message-bubble {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-other .message-bubble {
  background-color: #f4f4f5;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.message-ai .message-bubble {
  background-color: #f0f9eb;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.message-loading {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #67c23a;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
