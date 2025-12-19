<script setup lang="ts">
/**
 * Chat View - AI Chat and real-time messaging
 * Requirements: 2.1, 2.2, 2.4, 3.1 - AI Chat and real-time messaging
 * Requirements: 7.1, 7.3 - Knowledge base query integration
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../stores/chat';
import { useUserStore } from '../stores/user';
import ChatWindow from '../components/chat/ChatWindow.vue';
import { AppLayout } from '../components/common';
import { post, upload } from '../services/http';
import { uploadKnowledgeFile, validateKnowledgeFileType, ALLOWED_FILE_EXTENSIONS } from '../services/api/knowledge';
import type { AIChatRequest, AIChatResponse, AIChatMessage } from '../types/chat';

const chatStore = useChatStore();
const userStore = useUserStore();

// Local state
const uploadProgress = ref(0);
const isUploading = ref(false);
const pendingFile = ref<File | null>(null);

// Computed properties
const connectionStatus = computed(() => chatStore.connectionStatus);
const isLoading = computed(() => chatStore.isLoading);
const currentUserId = computed(() => userStore.id);

// Chat mode: 'ai' for general AI chat, 'knowledge' for knowledge base queries
const chatMode = ref<'ai' | 'knowledge'>('ai');

// 根据模式显示不同的消息列表
const currentMessages = computed(() => {
  return chatMode.value === 'ai' ? chatStore.aiMessages : chatStore.knowledgeMessages;
});

/**
 * Toggle chat mode between AI and Knowledge base
 */
function toggleChatMode(): void {
  chatMode.value = chatMode.value === 'ai' ? 'knowledge' : 'ai';
}

/**
 * Send message to AI or Knowledge base
 * Requirements: 2.1 - WHEN a user sends a message to AI_Chat THEN display and send to backend
 * Requirements: 7.1 - WHEN a user queries the Knowledge_Base THEN send query and display answers
 */
async function handleSendMessage(content: string): Promise<void> {
  if (!content.trim()) return;

  // Check if this is a knowledge query (starts with /kb or in knowledge mode)
  const isKnowledgeQuery = content.startsWith('/kb ') || chatMode.value === 'knowledge';
  const queryContent = content.startsWith('/kb ') ? content.substring(4).trim() : content;

  if (isKnowledgeQuery) {
    // Requirements: 7.1 - Knowledge base query
    await chatStore.sendKnowledgeQuery(queryContent);
    return;
  }

  // Regular AI chat
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
    const response = await post<AIChatResponse>('/api/chat', request);

    // Requirements: 2.2 - WHEN AI_Chat receives a response THEN render in chat window
    if (response.code === 200 && response.data) {
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
 * Handle file selection - store file for later upload
 */
function handleFileSelect(file: File): void {
  // Validate file type
  if (!validateKnowledgeFileType(file.name)) {
    chatStore.addAIResponse(`不支持的文件类型。请上传以下格式的文件：${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
    return;
  }
  pendingFile.value = file;
}

/**
 * Cancel pending file
 */
function cancelPendingFile(): void {
  pendingFile.value = null;
}

/**
 * Handle file upload to knowledge base
 * Requirements: 2.3 - WHEN a user uploads a file in AI_Chat THEN upload and display progress
 * Requirements: 7.2 - WHEN an admin uploads a document to Knowledge_Base THEN support .md, .pdf, .docx, .txt formats
 */
async function uploadPendingFile(): Promise<void> {
  if (isUploading.value || !pendingFile.value) return;

  const file = pendingFile.value;
  const isKnowledgeMode = chatMode.value === 'knowledge';
  
  isUploading.value = true;
  uploadProgress.value = 0;
  pendingFile.value = null;

  // Add user message about upload
  const targetText = isKnowledgeMode ? '知识库' : '服务器';
  chatStore.sendAIMessage(`正在上传文件到${targetText}: ${file.name}`);

  try {
    // Use knowledge base upload service, only add to knowledge when in knowledge mode
    const response = await uploadKnowledgeFile(file, isKnowledgeMode, (progress) => {
      uploadProgress.value = progress;
    });

    if (response.code === 200 && response.data) {
      if (isKnowledgeMode) {
        chatStore.addKnowledgeResponse(`文件 "${file.name}" 已成功上传到知识库！您现在可以查询相关内容。`);
      } else {
        chatStore.addAIResponse(`文件 "${file.name}" 上传成功！`);
      }
    } else {
      const addResponse = isKnowledgeMode ? chatStore.addKnowledgeResponse : chatStore.addAIResponse;
      addResponse(`文件上传失败: ${response.msg || '未知错误'}`);
    }
  } catch (error) {
    console.error('File upload error:', error);
    const addResponse = isKnowledgeMode ? chatStore.addKnowledgeResponse : chatStore.addAIResponse;
    addResponse('文件上传失败，请稍后重试。');
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
  <AppLayout>
    <div class="chat-view">
      <!-- Mode Toggle -->
      <div class="mode-toggle">
      <button 
        class="mode-btn"
        :class="{ active: chatMode === 'ai' }"
        @click="chatMode = 'ai'"
      >
        🤖 AI 助手
      </button>
      <button 
        class="mode-btn"
        :class="{ active: chatMode === 'knowledge' }"
        @click="chatMode = 'knowledge'"
      >
        📚 知识库
      </button>
    </div>

    <div class="chat-main">
      <ChatWindow
        :messages="currentMessages"
        :current-user-id="currentUserId"
        :connection-status="connectionStatus"
        :loading="isLoading"
        type="ai"
        :title="chatMode === 'knowledge' ? '知识库查询' : 'AI 智能助手'"
        :pending-file="pendingFile"
        @send="handleSendMessage"
        @upload="handleFileSelect"
        @cancel-file="cancelPendingFile"
        @confirm-upload="uploadPendingFile"
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
  </AppLayout>
</template>

<style scoped>
.chat-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.mode-toggle {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.mode-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  background-color: #fff;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.mode-btn.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.mode-btn.active:nth-child(2) {
  background-color: #67c23a;
  border-color: #67c23a;
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
