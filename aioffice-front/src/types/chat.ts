/**
 * Chat type definitions
 * Requirements: 2.1 - AI Chat, 3.1 - Real-time messaging
 */

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface ChatMessage {
  conversationId: string;
  recvId: string;
  sendId: string;
  chatType: number; // 1=群聊, 2=私聊
  content: string;
  contentType: number; // 1=文字, 2=图片, 3=表情
}

export interface AIChatRequest {
  prompts: string;
  chatType: number;
  relationId: number;
}

export interface AIChatResponse {
  chatType: number;
  data: unknown; // 可能是字符串或结构化数据
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  loading?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  aiMessages: AIChatMessage[];
  connectionStatus: ConnectionStatus;
  currentConversation: string | null;
}

/**
 * Knowledge Base types
 * Requirements: 7.1, 7.3 - Knowledge base query and result display
 */

export interface KnowledgeQueryRequest {
  prompts: string;
  chatType: number; // 3 = knowledge query
  relationId: number;
}

export interface KnowledgeQueryResult {
  answer: string;
  sources?: KnowledgeSource[];
}

export interface KnowledgeSource {
  title: string;
  content: string;
  filename?: string;
}

export interface KnowledgeUploadResponse {
  host: string;
  file: string;
  filename: string;
}
