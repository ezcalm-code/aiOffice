/**
 * Knowledge Base API Service
 * Requirements: 7.1, 7.2, 7.3 - Knowledge base query and file upload
 */

import { post, upload } from '../http';
import type { ApiResponse } from '../../types';
import type { 
  KnowledgeQueryRequest, 
  KnowledgeQueryResult, 
  KnowledgeUploadResponse,
  AIChatResponse 
} from '../../types/chat';

/**
 * Allowed file extensions for knowledge base upload
 * Requirements: 7.2 - Support .md, .pdf, .docx, .txt formats
 */
export const ALLOWED_FILE_EXTENSIONS = ['.md', '.pdf', '.docx', '.txt'];

/**
 * Validate file type for knowledge base upload
 * Requirements: 7.2 - WHEN an admin uploads a document to Knowledge_Base 
 * THEN the AIOffice_Frontend SHALL support .md, .pdf, .docx, .txt formats
 * 
 * @param filename - The name of the file to validate
 * @returns true if file type is allowed, false otherwise
 */
export function validateKnowledgeFileType(filename: string): boolean {
  if (!filename) return false;
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.includes(extension);
}

/**
 * Get file extension from filename
 * @param filename - The name of the file
 * @returns The file extension including the dot (e.g., '.pdf')
 */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return '.' + parts.pop()?.toLowerCase();
}

/**
 * Query knowledge base
 * Requirements: 7.1 - WHEN a user queries the Knowledge_Base 
 * THEN the AIOffice_Frontend SHALL send the query and display relevant answers
 * 
 * @param query - The query string
 * @returns Promise with knowledge query result
 */
export async function queryKnowledge(query: string): Promise<ApiResponse<AIChatResponse>> {
  const request: KnowledgeQueryRequest = {
    prompts: query,
    chatType: 3, // Knowledge query type
    relationId: 0,
  };
  
  return post<AIChatResponse>('/api/chat', request);
}

/**
 * Upload file to knowledge base
 * Requirements: 7.2 - WHEN an admin uploads a document to Knowledge_Base
 * 
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @returns Promise with upload response
 */
export async function uploadKnowledgeFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<KnowledgeUploadResponse>> {
  // Validate file type before upload
  if (!validateKnowledgeFileType(file.name)) {
    return {
      code: -1,
      data: { host: '', file: '', filename: '' },
      msg: `不支持的文件类型。请上传以下格式的文件：${ALLOWED_FILE_EXTENSIONS.join(', ')}`,
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  return upload<KnowledgeUploadResponse>('/api/upload/file', formData, onProgress);
}

/**
 * Parse knowledge query response
 * Requirements: 7.3 - WHEN Knowledge_Base returns results 
 * THEN the AIOffice_Frontend SHALL display the answer with source references
 * 
 * @param response - The AI chat response
 * @returns Parsed knowledge query result
 */
export function parseKnowledgeResponse(response: AIChatResponse): KnowledgeQueryResult {
  const result: KnowledgeQueryResult = {
    answer: '',
    sources: [],
  };

  if (typeof response.data === 'string') {
    result.answer = response.data;
  } else if (response.data && typeof response.data === 'object') {
    const data = response.data as Record<string, unknown>;
    
    // Extract answer
    if (typeof data.answer === 'string') {
      result.answer = data.answer;
    } else if (typeof data.content === 'string') {
      result.answer = data.content;
    } else {
      result.answer = JSON.stringify(data, null, 2);
    }

    // Extract sources if available
    if (Array.isArray(data.sources)) {
      result.sources = data.sources.map((source: unknown) => {
        if (typeof source === 'object' && source !== null) {
          const s = source as Record<string, unknown>;
          return {
            title: String(s.title || ''),
            content: String(s.content || ''),
            filename: s.filename ? String(s.filename) : undefined,
          };
        }
        return { title: '', content: String(source) };
      });
    }
  }

  return result;
}

export default {
  queryKnowledge,
  uploadKnowledgeFile,
  validateKnowledgeFileType,
  parseKnowledgeResponse,
  ALLOWED_FILE_EXTENSIONS,
};
