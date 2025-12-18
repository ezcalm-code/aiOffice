/**
 * Chat Store - Pinia state management for chat functionality
 * Requirements: 2.1, 2.2, 3.2 - AI Chat and real-time messaging
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  ChatMessage, 
  AIChatMessage, 
  ConnectionStatus, 
  ChatState 
} from '../types/chat';
import websocketClient from '../services/websocket';

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<ChatMessage[]>([]);
  const aiMessages = ref<AIChatMessage[]>([]);
  const connectionStatus = ref<ConnectionStatus>('disconnected');
  const currentConversation = ref<string | null>(null);
  const loading = ref<boolean>(false);

  // Getters
  const chatState = computed<ChatState>(() => ({
    messages: messages.value,
    aiMessages: aiMessages.value,
    connectionStatus: connectionStatus.value,
    currentConversation: currentConversation.value,
  }));

  const isConnected = computed(() => connectionStatus.value === 'connected');
  const isLoading = computed(() => loading.value);

  /**
   * Get messages for a specific conversation
   */
  const getConversationMessages = computed(() => {
    return (conversationId: string) => 
      messages.value.filter(msg => msg.conversationId === conversationId);
  });

  /**
   * Initialize WebSocket connection and listeners
   * Requirements: 3.1 - WHEN a user opens the chat module THEN establish connection
   */
  function initializeWebSocket(): void {
    // Register connection status callback
    websocketClient.onConnectionChange((status: ConnectionStatus) => {
      connectionStatus.value = status;
    });

    // Register message callback
    websocketClient.onMessage((message: ChatMessage) => {
      receiveMessage(message);
    });

    // Connect to WebSocket server
    websocketClient.connect();
  }

  /**
   * Disconnect WebSocket
   */
  function disconnectWebSocket(): void {
    websocketClient.disconnect();
  }

  /**
   * Send a chat message via WebSocket
   * Requirements: 2.1 - WHEN a user sends a message THEN display and send to backend
   * Requirements: 3.3, 3.4 - Send private/group messages
   * 
   * @param message ChatMessage to send
   * @returns true if message was sent successfully
   */
  function sendMessage(message: ChatMessage): boolean {
    // Add message to local state immediately for optimistic UI
    addMessage(message);
    
    // Send via WebSocket
    const sent = websocketClient.send(message);
    
    if (!sent) {
      // Mark message as failed if send failed
      console.error('Failed to send message:', message);
    }
    
    return sent;
  }

  /**
   * Receive a message from WebSocket
   * Requirements: 2.2 - WHEN AI_Chat receives a response THEN render in chat window
   * Requirements: 3.2 - WHEN WebSocket receives a message THEN display in real-time
   * 
   * @param message ChatMessage received
   */
  function receiveMessage(message: ChatMessage): void {
    addMessage(message);
  }

  /**
   * Add a message to the messages list without duplicates
   * Property 2: Message State Consistency - no duplicates
   * 
   * @param message ChatMessage to add
   */
  function addMessage(message: ChatMessage): void {
    // Check for duplicates based on conversationId, sendId, content, and timestamp-like uniqueness
    const isDuplicate = messages.value.some(
      (m) =>
        m.conversationId === message.conversationId &&
        m.sendId === message.sendId &&
        m.content === message.content &&
        m.recvId === message.recvId
    );

    if (!isDuplicate) {
      messages.value.push(message);
    }
  }

  /**
   * Send an AI chat message
   * Requirements: 2.1 - Send message to AI_Chat
   * 
   * @param content Message content
   * @returns The created AI message
   */
  function sendAIMessage(content: string): AIChatMessage {
    const userMessage: AIChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    aiMessages.value.push(userMessage);
    return userMessage;
  }

  /**
   * Add AI assistant response
   * Requirements: 2.2 - Render AI response in chat window
   * 
   * @param content Response content
   * @param isLoading Whether the message is still loading
   * @returns The created AI message
   */
  function addAIResponse(content: string, isLoading = false): AIChatMessage {
    const assistantMessage: AIChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      loading: isLoading,
    };

    // Check for duplicates
    const isDuplicate = aiMessages.value.some(
      (m) => m.role === 'assistant' && m.content === content && m.timestamp === assistantMessage.timestamp
    );

    if (!isDuplicate) {
      aiMessages.value.push(assistantMessage);
    }

    return assistantMessage;
  }

  /**
   * Update an existing AI message (e.g., when streaming completes)
   * 
   * @param id Message ID to update
   * @param updates Partial updates to apply
   */
  function updateAIMessage(id: string, updates: Partial<AIChatMessage>): void {
    const index = aiMessages.value.findIndex((m) => m.id === id);
    if (index !== -1) {
      aiMessages.value[index] = { ...aiMessages.value[index], ...updates };
    }
  }

  /**
   * Set loading state
   * Requirements: 2.4 - WHILE AI_Chat is processing THEN display loading indicator
   * Property 3: Loading State Management
   * 
   * @param isLoading Loading state
   */
  function setLoading(isLoading: boolean): void {
    loading.value = isLoading;
  }

  /**
   * Set current conversation
   * 
   * @param conversationId Conversation ID
   */
  function setCurrentConversation(conversationId: string | null): void {
    currentConversation.value = conversationId;
  }

  /**
   * Clear all messages
   */
  function clearMessages(): void {
    messages.value = [];
  }

  /**
   * Clear AI messages
   */
  function clearAIMessages(): void {
    aiMessages.value = [];
  }

  /**
   * Generate a unique message ID
   */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  return {
    // State
    messages,
    aiMessages,
    connectionStatus,
    currentConversation,
    loading,

    // Getters
    chatState,
    isConnected,
    isLoading,
    getConversationMessages,

    // Actions
    initializeWebSocket,
    disconnectWebSocket,
    sendMessage,
    receiveMessage,
    addMessage,
    sendAIMessage,
    addAIResponse,
    updateAIMessage,
    setLoading,
    setCurrentConversation,
    clearMessages,
    clearAIMessages,
  };
});
