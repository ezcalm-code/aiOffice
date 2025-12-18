<script setup lang="ts">
/**
 * Chat View - AI Chat and real-time messaging
 * Requirements: 2.1, 2.2, 2.4, 3.1 - AI Chat and real-time messaging
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../stores/chat';
import { useUserStore } from '../stores/user';
import ChatWindow from '../components/chat/ChatWindow.vue';
import { post, upload } from '../services/http';
import type { AIChatRequest, AIChatResponse, AIChatMessage } from '../types/chat';

const chatStore = useChatStore();
const userStore = useUserStore();

// Local state
const uploadProgress = ref(0);
const isUploading = ref(false);

// Computed properties
const aiMessages = computed(() => chatStore.aiMessages);
const connectionStatus = computed(() => chatStore.connectionStatus);
const isLoading = computed(() => chatStore.isLoading);
const currentUserId = computed(() => userStore.id);

/**
 * Send message to AI
 * Requirements: 2.1 - WHEN a user sends a message to AI_Chat THEN display and send to backend
 */
async function handleSendMessage(content: string): Promise<void> {
  if (!content.trim()) return;

  // Add user message to store
  chatStore.sendAIMessage(content);

  // Set loading state
  // Requirements: 2.4 - WHILE AI_Chat is processing THEN display loading indicator
  chatStore.setLoading(true);

  try {
    // Prepare AI chat request
    const request: AIChatRequest = {
      prompts: content,
      chatType: 1, // Default chat type
      relationId: 0,
    };

    // Send to backend
    const response = await post<AIChatResponse>('/api/chat/ai', request);

    // Requirements: 2.2 - WHEN AI_Chat receives a response THEN render in chat window
    if (response.code === 0 && response.data) {
      const aiResponse = response.data;
      let responseContent: string;

      // Handle different response types
      if (typeof aiResponse.data === 'string') {
        responseContent = aiResponse.data;
      } else if (aiResponse.data && typeof aiResponse.data === 'object') {
        // Requirements: 2.5 - Render structured data as interactive card
        responseContent = JSON.stringify(aiResponse.data, null, 2);
      } else {
        responseContent = '收到响应，但内容为空';
      }

      chatStore.addAIResponse(responseContent);
    } else {
      chatStore.addAIResponse('抱歉，处理您的请求时出现了问题。请稍后重试。');
    }
  } catch (error) {
    console.error('AI Chat error:', error);
    chatStore.addAIResponse('网络错误，请检查您的网络连接后重试。');
  } finally {
    chatStore.setLoading(false);
  }
}

/**
 * Handle file upload
 * Requirements: 2.3 - WHEN a user uploads a file in AI_Chat THEN upload and display progress
 */
async function handleFileUpload(file: File): Promise<void> {
  if (isUploading.value) return;

  // Validate file type
  const allowedTypes = ['.md', '.pdf', '.docx', '.txt'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!allowedTypes.includes(fileExtension)) {
    chatStore.addAIResponse(`不支持的文件类型。请上传以下格式的文件：${allowedTypes.join(', ')}`);
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  // Add user message about upload
  chatStore.sendAIMessage(`正在上传文件: ${file.name}`);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await upload<{ url: string }>('/api/upload', formData, (progress) => {
      uploadProgress.value = progress;
    });

    if (response.code === 0) {
      chatStore.addAIResponse(`文件 "${file.name}" 上传成功！`);
    } else {
      chatStore.addAIResponse(`文件上传失败: ${response.msg || '未知错误'}`);
    }
  } catch (error) {
    console.error('File upload error:', error);
    chatStore.addAIResponse('文件上传失败，请稍后重试。');
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}

/**
 * Initialize WebSocket connection
 * Requirements: 3.1 - WHEN a user opens the chat module THEN establish WebSocket connection
 */
onMounted(() => {
  chatStore.initializeWebSocket();
});

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  // Don't disconnect WebSocket on unmount to maintain connection
  // chatStore.disconnectWebSocket();
});
</script>

<template>
  <div class="chat-view">
    <div class="chat-main">
      <ChatWindow
        :messages="aiMessages"
        :current-user-id="currentUserId"
        :connection-status="connectionStatus"
        :loading="isLoading"
        type="ai"
        title="AI 智能助手"
        @send="handleSendMessage"
        @upload="handleFileUpload"
      />
    </div>

    <!-- Upload Progress Overlay -->
    <div v-if="isUploading" class="upload-overlay">
      <div class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        <div class="progress-text">上传中... {{ uploadProgress }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chat-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 16px;
}

.chat-main > * {
  flex: 1;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.upload-progress {
  background-color: #fff;
  padding: 24px 32px;
  border-radius: 8px;
  min-width: 300px;
  text-align: center;
}

.progress-bar {
  height: 8px;
  background-color: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background-color: #409eff;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #606266;
}

/* Responsive styles */
@media (max-width: 768px) {
  .chat-main {
    padding: 8px;
  }
}
</style>
