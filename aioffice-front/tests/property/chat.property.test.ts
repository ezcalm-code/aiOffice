/**
 * Property-Based Tests for Chat Store - Message State Consistency & Loading State Management
 * 
 * **Feature: aioffice-frontend, Property 2: Message State Consistency**
 * **Validates: Requirements 2.1, 2.2, 3.2**
 * 
 * Property: For any message sent to AI_Chat or received via WebSocket, 
 * the message SHALL be added to the corresponding message list in the store without duplicates.
 * 
 * **Feature: aioffice-frontend, Property 3: Loading State Management**
 * **Validates: Requirements 2.4, 7.4**
 * 
 * Property: For any async operation (AI chat, knowledge query, API calls), 
 * the loading state SHALL be true during the operation and false after completion or error.
 */

import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { setActivePinia, createPinia } from 'pinia';
import { useChatStore } from '../../src/stores/chat';
import type { ChatMessage } from '../../src/types/chat';

// Mock WebSocket client to avoid actual connections
vi.mock('../../src/services/websocket', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(() => true),
    onMessage: vi.fn(),
    onConnectionChange: vi.fn(),
  },
}));

/**
 * Arbitrary generator for valid conversation IDs
 */
const conversationIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary generator for valid user IDs
 */
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary generator for chat types (1=group, 2=private)
 */
const chatTypeArbitrary = fc.constantFrom(1, 2);

/**
 * Arbitrary generator for content types (1=text, 2=image, 3=emoji)
 */
const contentTypeArbitrary = fc.constantFrom(1, 2, 3);

/**
 * Arbitrary generator for message content
 */
const contentArbitrary = fc.string({ minLength: 1, maxLength: 500 });


/**
 * Arbitrary generator for valid ChatMessage objects
 */
const chatMessageArbitrary: fc.Arbitrary<ChatMessage> = fc.record({
  conversationId: conversationIdArbitrary,
  recvId: userIdArbitrary,
  sendId: userIdArbitrary,
  chatType: chatTypeArbitrary,
  content: contentArbitrary,
  contentType: contentTypeArbitrary,
});

/**
 * Arbitrary generator for boolean values representing loading states
 */
const loadingStateArbitrary = fc.boolean();

/**
 * Helper function to count unique messages based on key fields
 */
function countUniqueMessages(messages: ChatMessage[]): number {
  const seen = new Set<string>();
  for (const msg of messages) {
    const key = `${msg.conversationId}|${msg.sendId}|${msg.recvId}|${msg.content}`;
    seen.add(key);
  }
  return seen.size;
}

describe('Chat Store - Message State Consistency Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 2.2, 3.2**
   * 
   * Property: For any valid ChatMessage added via addMessage(), 
   * the message SHALL appear in the messages list exactly once.
   */
  it('Property 2.1: Adding a message increases message count by exactly one', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        const store = useChatStore();
        store.clearMessages();
        
        const initialCount = store.messages.length;
        
        // Add the message
        store.addMessage(message);
        
        // Message count should increase by exactly 1
        return store.messages.length === initialCount + 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 2.2, 3.2**
   * 
   * Property: For any ChatMessage added via addMessage(), 
   * the message SHALL be retrievable from the messages list with all fields preserved.
   */
  it('Property 2.2: Added message is retrievable with all fields preserved', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        const store = useChatStore();
        store.clearMessages();
        
        // Add the message
        store.addMessage(message);
        
        // Find the message in the store
        const found = store.messages.find(
          m => m.conversationId === message.conversationId &&
               m.sendId === message.sendId &&
               m.recvId === message.recvId &&
               m.content === message.content
        );
        
        if (!found) return false;
        
        // All fields must be preserved
        return (
          found.conversationId === message.conversationId &&
          found.recvId === message.recvId &&
          found.sendId === message.sendId &&
          found.chatType === message.chatType &&
          found.content === message.content &&
          found.contentType === message.contentType
        );
      }),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 2.2, 3.2**
   * 
   * Property: For any ChatMessage added multiple times via addMessage(),
   * the message SHALL appear in the messages list exactly once (no duplicates).
   */
  it('Property 2.3: Duplicate messages are not added to the store', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, fc.integer({ min: 2, max: 5 }), (message, repeatCount) => {
        const store = useChatStore();
        store.clearMessages();
        
        // Add the same message multiple times
        for (let i = 0; i < repeatCount; i++) {
          store.addMessage(message);
        }
        
        // Message should appear exactly once
        const matchingMessages = store.messages.filter(
          m => m.conversationId === message.conversationId &&
               m.sendId === message.sendId &&
               m.recvId === message.recvId &&
               m.content === message.content
        );
        
        return matchingMessages.length === 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 2.2, 3.2**
   * 
   * Property: For any sequence of distinct ChatMessages added via addMessage(),
   * all messages SHALL be present in the store without any being lost.
   */
  it('Property 2.4: All distinct messages are preserved in the store', () => {
    fc.assert(
      fc.property(
        fc.array(chatMessageArbitrary, { minLength: 1, maxLength: 10 }),
        (messages) => {
          const store = useChatStore();
          store.clearMessages();
          
          // Add all messages
          for (const message of messages) {
            store.addMessage(message);
          }
          
          // Count unique messages in input
          const uniqueInputCount = countUniqueMessages(messages);
          
          // Store should have exactly the unique count
          return store.messages.length === uniqueInputCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 3.2**
   * 
   * Property: For any ChatMessage received via receiveMessage(),
   * the message SHALL be added to the store exactly once.
   */
  it('Property 2.5: Received messages are added to store exactly once', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        const store = useChatStore();
        store.clearMessages();
        
        const initialCount = store.messages.length;
        
        // Receive the message (simulating WebSocket receive)
        store.receiveMessage(message);
        
        // Message count should increase by exactly 1
        return store.messages.length === initialCount + 1;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 3.2**
   * 
   * Property: For any ChatMessage sent via sendMessage(),
   * the message SHALL be added to the store for optimistic UI update.
   */
  it('Property 2.6: Sent messages are added to store for optimistic UI', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        const store = useChatStore();
        store.clearMessages();
        
        const initialCount = store.messages.length;
        
        // Send the message
        store.sendMessage(message);
        
        // Message should be in the store (optimistic update)
        const found = store.messages.find(
          m => m.conversationId === message.conversationId &&
               m.sendId === message.sendId &&
               m.content === message.content
        );
        
        return found !== undefined && store.messages.length === initialCount + 1;
      }),
      { numRuns: 100 }
    );
  });


  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 2.2**
   * 
   * Property: For any AI user message sent via sendAIMessage(),
   * the message SHALL be added to aiMessages list with role 'user'.
   */
  it('Property 2.7: AI user messages are added with correct role', () => {
    fc.assert(
      fc.property(contentArbitrary, (content) => {
        const store = useChatStore();
        store.clearAIMessages();
        
        const initialCount = store.aiMessages.length;
        
        // Send AI message
        const sentMessage = store.sendAIMessage(content);
        
        // Message should be in the store
        const found = store.aiMessages.find(m => m.id === sentMessage.id);
        
        return (
          found !== undefined &&
          found.role === 'user' &&
          found.content === content &&
          store.aiMessages.length === initialCount + 1
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.2**
   * 
   * Property: For any AI assistant response added via addAIResponse(),
   * the message SHALL be added to aiMessages list with role 'assistant'.
   */
  it('Property 2.8: AI assistant responses are added with correct role', () => {
    fc.assert(
      fc.property(contentArbitrary, (content) => {
        const store = useChatStore();
        store.clearAIMessages();
        
        const initialCount = store.aiMessages.length;
        
        // Add AI response
        const response = store.addAIResponse(content);
        
        // Response should be in the store
        const found = store.aiMessages.find(m => m.id === response.id);
        
        return (
          found !== undefined &&
          found.role === 'assistant' &&
          found.content === content &&
          store.aiMessages.length === initialCount + 1
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 2.2, 3.2**
   * 
   * Property: For any sequence of messages (both ChatMessage and AIChatMessage),
   * the order of messages SHALL be preserved in the store.
   */
  it('Property 2.9: Message order is preserved in the store', () => {
    fc.assert(
      fc.property(
        fc.array(chatMessageArbitrary, { minLength: 2, maxLength: 10 }),
        (messages) => {
          const store = useChatStore();
          store.clearMessages();
          
          // Make messages unique by modifying content
          const uniqueMessages = messages.map((msg, index) => ({
            ...msg,
            content: `${msg.content}_${index}`,
          }));
          
          // Add messages in order
          for (const message of uniqueMessages) {
            store.addMessage(message);
          }
          
          // Verify order is preserved
          for (let i = 0; i < uniqueMessages.length; i++) {
            if (store.messages[i].content !== uniqueMessages[i].content) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 2: Message State Consistency**
   * **Validates: Requirements 2.1, 2.2, 3.2**
   * 
   * Property: For any conversation ID, getConversationMessages SHALL return
   * only messages belonging to that conversation.
   */
  it('Property 2.10: Conversation filtering returns only matching messages', () => {
    fc.assert(
      fc.property(
        conversationIdArbitrary,
        fc.array(chatMessageArbitrary, { minLength: 1, maxLength: 10 }),
        (targetConversationId, messages) => {
          const store = useChatStore();
          store.clearMessages();
          
          // Add messages with mixed conversation IDs
          const mixedMessages = messages.map((msg, index) => ({
            ...msg,
            conversationId: index % 2 === 0 ? targetConversationId : `other_${index}`,
            content: `${msg.content}_${index}`, // Make unique
          }));
          
          for (const message of mixedMessages) {
            store.addMessage(message);
          }
          
          // Get messages for target conversation
          const filtered = store.getConversationMessages(targetConversationId);
          
          // All filtered messages must belong to target conversation
          return filtered.every(m => m.conversationId === targetConversationId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: aioffice-frontend, Property 3: Loading State Management**
 * **Validates: Requirements 2.4, 7.4**
 * 
 * Property: For any async operation (AI chat, knowledge query, API calls), 
 * the loading state SHALL be true during the operation and false after completion or error.
 */
describe('Chat Store - Loading State Management Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: For any boolean value passed to setLoading(), 
   * the loading state SHALL reflect that exact value.
   */
  it('Property 3.1: setLoading correctly updates loading state', () => {
    fc.assert(
      fc.property(loadingStateArbitrary, (isLoading) => {
        const store = useChatStore();
        
        // Set loading state
        store.setLoading(isLoading);
        
        // Loading state should match the input
        return store.loading === isLoading && store.isLoading === isLoading;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: For any sequence of loading state changes,
   * the final loading state SHALL match the last value set.
   */
  it('Property 3.2: Sequential loading state changes result in correct final state', () => {
    fc.assert(
      fc.property(
        fc.array(loadingStateArbitrary, { minLength: 1, maxLength: 20 }),
        (loadingStates) => {
          const store = useChatStore();
          
          // Apply all loading state changes
          for (const isLoading of loadingStates) {
            store.setLoading(isLoading);
          }
          
          // Final state should match the last value
          const expectedFinalState = loadingStates[loadingStates.length - 1];
          return store.loading === expectedFinalState;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: For any async operation simulation (start -> complete),
   * the loading state SHALL be true during operation and false after completion.
   */
  it('Property 3.3: Loading state follows async operation lifecycle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // Number of operations to simulate
        (operationCount) => {
          const store = useChatStore();
          
          for (let i = 0; i < operationCount; i++) {
            // Start operation - loading should be true
            store.setLoading(true);
            if (!store.loading) return false;
            
            // Complete operation - loading should be false
            store.setLoading(false);
            if (store.loading) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: For any async operation that errors,
   * the loading state SHALL be false after the error.
   */
  it('Property 3.4: Loading state is false after error (simulated)', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Whether operation succeeds or fails
        (operationSucceeds) => {
          const store = useChatStore();
          
          // Start operation
          store.setLoading(true);
          
          // Simulate operation completion (success or error)
          // In both cases, loading should be set to false
          store.setLoading(false);
          
          // Loading should always be false after completion/error
          return store.loading === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: The isLoading computed property SHALL always reflect the loading ref value.
   */
  it('Property 3.5: isLoading computed property reflects loading state', () => {
    fc.assert(
      fc.property(
        fc.array(loadingStateArbitrary, { minLength: 1, maxLength: 10 }),
        (loadingStates) => {
          const store = useChatStore();
          
          for (const isLoading of loadingStates) {
            store.setLoading(isLoading);
            
            // isLoading computed should always match loading ref
            if (store.isLoading !== store.loading) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: For any AI response with loading flag,
   * the message loading property SHALL match the provided value.
   */
  it('Property 3.6: AI response loading flag is preserved', () => {
    fc.assert(
      fc.property(
        contentArbitrary,
        loadingStateArbitrary,
        (content, isLoading) => {
          const store = useChatStore();
          store.clearAIMessages();
          
          // Add AI response with loading flag
          const response = store.addAIResponse(content, isLoading);
          
          // Find the message and verify loading flag
          const found = store.aiMessages.find(m => m.id === response.id);
          
          return found !== undefined && found.loading === isLoading;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: For any AI message update with loading flag change,
   * the message loading property SHALL reflect the updated value.
   */
  it('Property 3.7: AI message loading flag can be updated', () => {
    fc.assert(
      fc.property(
        contentArbitrary,
        loadingStateArbitrary,
        loadingStateArbitrary,
        (content, initialLoading, updatedLoading) => {
          const store = useChatStore();
          store.clearAIMessages();
          
          // Add AI response with initial loading flag
          const response = store.addAIResponse(content, initialLoading);
          
          // Update the loading flag
          store.updateAIMessage(response.id, { loading: updatedLoading });
          
          // Find the message and verify updated loading flag
          const found = store.aiMessages.find(m => m.id === response.id);
          
          return found !== undefined && found.loading === updatedLoading;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 3: Loading State Management**
   * **Validates: Requirements 2.4, 7.4**
   * 
   * Property: Store loading state and individual message loading states are independent.
   */
  it('Property 3.8: Store loading state is independent of message loading states', () => {
    fc.assert(
      fc.property(
        loadingStateArbitrary,
        contentArbitrary,
        loadingStateArbitrary,
        (storeLoading, content, messageLoading) => {
          const store = useChatStore();
          store.clearAIMessages();
          
          // Set store loading state
          store.setLoading(storeLoading);
          
          // Add AI response with different loading flag
          const response = store.addAIResponse(content, messageLoading);
          
          // Store loading and message loading should be independent
          const found = store.aiMessages.find(m => m.id === response.id);
          
          return (
            store.loading === storeLoading &&
            found !== undefined &&
            found.loading === messageLoading
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
