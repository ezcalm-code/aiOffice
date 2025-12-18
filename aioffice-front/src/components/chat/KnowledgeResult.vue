<script setup lang="ts">
/**
 * KnowledgeResult Component - Displays knowledge base query results with sources
 * Requirements: 7.1, 7.3 - Display knowledge query results with source references
 */

import { computed } from 'vue';
import type { KnowledgeQueryResult, KnowledgeSource } from '../../types/chat';

interface Props {
  result: KnowledgeQueryResult;
}

const props = defineProps<Props>();

const hasAnswer = computed(() => !!props.result.answer);
const hasSources = computed(() => props.result.sources && props.result.sources.length > 0);
const sources = computed(() => props.result.sources || []);
</script>

<template>
  <div class="knowledge-result">
    <!-- Answer Section -->
    <div v-if="hasAnswer" class="answer-section">
      <div class="answer-content">{{ result.answer }}</div>
    </div>

    <!-- Sources Section -->
    <div v-if="hasSources" class="sources-section">
      <div class="sources-header">
        <span class="sources-icon">📚</span>
        <span class="sources-title">参考来源</span>
      </div>
      <div class="sources-list">
        <div 
          v-for="(source, index) in sources" 
          :key="index" 
          class="source-item"
        >
          <div class="source-number">{{ index + 1 }}</div>
          <div class="source-content">
            <div class="source-title">{{ source.title || source.filename || '未知来源' }}</div>
            <div v-if="source.content" class="source-excerpt">
              {{ source.content.substring(0, 150) }}{{ source.content.length > 150 ? '...' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-if="!hasAnswer" class="no-results">
      <span class="no-results-icon">🔍</span>
      <span class="no-results-text">未找到相关信息</span>
    </div>
  </div>
</template>

<style scoped>
.knowledge-result {
  padding: 12px;
  background-color: #f0f9eb;
  border-radius: 8px;
  max-width: 100%;
}

.answer-section {
  margin-bottom: 12px;
}

.answer-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
}

.sources-section {
  border-top: 1px solid #e1f3d8;
  padding-top: 12px;
  margin-top: 8px;
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.sources-icon {
  font-size: 14px;
}

.sources-title {
  font-size: 13px;
  font-weight: 500;
  color: #67c23a;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
}

.source-number {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #67c23a;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 500;
}

.source-content {
  flex: 1;
  min-width: 0;
}

.source-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.source-excerpt {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.no-results {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #909399;
}

.no-results-icon {
  font-size: 18px;
}

.no-results-text {
  font-size: 14px;
}
</style>
