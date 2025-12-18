<script setup lang="ts">
/**
 * KnowledgeUpload Component - File upload for knowledge base
 * Requirements: 7.2 - WHEN an admin uploads a document to Knowledge_Base 
 * THEN the AIOffice_Frontend SHALL support .md, .pdf, .docx, .txt formats
 */

import { ref, computed } from 'vue';
import { 
  uploadKnowledgeFile, 
  validateKnowledgeFileType, 
  ALLOWED_FILE_EXTENSIONS 
} from '../../services/api/knowledge';

interface Props {
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'success', filename: string): void;
  (e: 'error', message: string): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const dragOver = ref(false);

const acceptedExtensions = computed(() => ALLOWED_FILE_EXTENSIONS.join(','));

/**
 * Trigger file input click
 */
function triggerFileSelect(): void {
  if (!props.disabled && !isUploading.value) {
    fileInputRef.value?.click();
  }
}

/**
 * Handle file selection from input
 */
function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    uploadFile(file);
  }
  // Reset input for re-selection of same file
  target.value = '';
}

/**
 * Handle drag over event
 */
function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  if (!props.disabled && !isUploading.value) {
    dragOver.value = true;
  }
}

/**
 * Handle drag leave event
 */
function handleDragLeave(): void {
  dragOver.value = false;
}

/**
 * Handle file drop
 */
function handleDrop(event: DragEvent): void {
  event.preventDefault();
  dragOver.value = false;
  
  if (props.disabled || isUploading.value) return;
  
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    uploadFile(file);
  }
}

/**
 * Upload file to knowledge base
 * Requirements: 7.2 - Support .md, .pdf, .docx, .txt formats
 */
async function uploadFile(file: File): Promise<void> {
  // Validate file type
  if (!validateKnowledgeFileType(file.name)) {
    emit('error', `不支持的文件类型。请上传以下格式的文件：${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    const response = await uploadKnowledgeFile(file, (progress) => {
      uploadProgress.value = progress;
    });

    if (response.code === 0 && response.data) {
      emit('success', file.name);
    } else {
      emit('error', response.msg || '上传失败');
    }
  } catch (error) {
    console.error('Upload error:', error);
    emit('error', '上传失败，请稍后重试');
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}
</script>

<template>
  <div 
    class="knowledge-upload"
    :class="{ 
      'drag-over': dragOver, 
      'disabled': disabled,
      'uploading': isUploading 
    }"
    @click="triggerFileSelect"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <input
      ref="fileInputRef"
      type="file"
      class="file-input"
      :accept="acceptedExtensions"
      :disabled="disabled || isUploading"
      @change="handleFileSelect"
    />

    <div v-if="isUploading" class="upload-progress">
      <div class="progress-circle">
        <svg viewBox="0 0 36 36">
          <path
            class="progress-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="progress-fill"
            :stroke-dasharray="`${uploadProgress}, 100`"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span class="progress-text">{{ uploadProgress }}%</span>
      </div>
      <div class="upload-label">上传中...</div>
    </div>

    <div v-else class="upload-content">
      <div class="upload-icon">📄</div>
      <div class="upload-text">
        <span class="upload-main">点击或拖拽文件到此处上传</span>
        <span class="upload-hint">支持格式：{{ ALLOWED_FILE_EXTENSIONS.join(', ') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 120px;
}

.knowledge-upload:hover:not(.disabled):not(.uploading) {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.knowledge-upload.drag-over {
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.knowledge-upload.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.knowledge-upload.uploading {
  cursor: default;
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 32px;
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-main {
  font-size: 14px;
  color: #606266;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.progress-circle {
  position: relative;
  width: 60px;
  height: 60px;
}

.progress-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: #e4e7ed;
  stroke-width: 3;
}

.progress-fill {
  fill: none;
  stroke: #67c23a;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 500;
  color: #67c23a;
}

.upload-label {
  font-size: 14px;
  color: #606266;
}
</style>
