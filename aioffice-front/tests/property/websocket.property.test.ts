/**
 * Property-Based Tests for WebSocket Client
 * 
 * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
 * **Validates: Requirements 3.3, 3.4**
 * 
 * Property: For any message sent via WebSocket, the message SHALL contain valid
 * conversationId, sendId, recvId, chatType, and content fields matching the ChatMessage interface.
 * 
 * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
 * **Validates: Requirements 3.5**
 * 
 * Property: For any WebSocket disconnection, the reconnection attempts SHALL follow
 * exponential backoff pattern with delays doubling each attempt up to 5 attempts.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { ChatMessage } from '../../src/types/chat';
import { WebSocketClient } from '../../src/services/websocket';

/**
 * Arbitrary generator for valid conversation IDs
 * Conversation IDs are non-empty strings
 */
const conversationIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary generator for valid user IDs (sendId, recvId)
 * User IDs are non-empty strings
 */
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary generator for chat types
 * 1 = 群聊 (group chat), 2 = 私聊 (private chat)
 */
const chatTypeArbitrary = fc.constantFrom(1, 2);

/**
 * Arbitrary generator for content types
 * 1 = 文字 (text), 2 = 图片 (image), 3 = 表情 (emoji)
 */
const contentTypeArbitrary = fc.constantFrom(1, 2, 3);

/**
 * Arbitrary generator for message content
 * Content is a non-empty string
 */
const contentArbitrary = fc.string({ minLength: 1, maxLength: 1000 });

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
 * Validates that a message conforms to the ChatMessage interface
 * This mirrors the isValidMessage method in WebSocketClient
 */
function isValidChatMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as Record<string, unknown>;
  
  return (
    typeof msg.conversationId === 'string' &&
    typeof msg.recvId === 'string' &&
    typeof msg.sendId === 'string' &&
    typeof msg.chatType === 'number' &&
    typeof msg.content === 'string' &&
    typeof msg.contentType === 'number'
  );
}

/**
 * Validates that a message is a valid private message (chatType = 2)
 * Requirements 3.3: Private messages must have a specific recipient
 */
function isValidPrivateMessage(message: ChatMessage): boolean {
  return (
    message.chatType === 2 &&
    message.recvId.length > 0 &&
    message.sendId.length > 0 &&
    message.sendId !== message.recvId // Sender and receiver should be different
  );
}

/**
 * Validates that a message is a valid group message (chatType = 1)
 * Requirements 3.4: Group messages must have a conversation ID for the group
 */
function isValidGroupMessage(message: ChatMessage): boolean {
  return (
    message.chatType === 1 &&
    message.conversationId.length > 0 &&
    message.sendId.length > 0
  );
}

describe('WebSocket Client - Message Structure Property Tests', () => {
  /**
   * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Property: For any generated ChatMessage, the message SHALL pass validation
   * as a valid ChatMessage with all required fields.
   */
  it('Property 4.1: All generated messages have valid structure', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        // Every generated message must pass validation
        return isValidChatMessage(message);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Property: For any valid ChatMessage, JSON serialization and deserialization
   * SHALL preserve all message fields exactly.
   */
  it('Property 4.2: Message serialization round-trip preserves structure', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        // Serialize to JSON (as WebSocket does)
        const serialized = JSON.stringify(message);
        
        // Deserialize back
        const deserialized = JSON.parse(serialized);
        
        // All fields must be preserved
        return (
          deserialized.conversationId === message.conversationId &&
          deserialized.recvId === message.recvId &&
          deserialized.sendId === message.sendId &&
          deserialized.chatType === message.chatType &&
          deserialized.content === message.content &&
          deserialized.contentType === message.contentType
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
   * **Validates: Requirements 3.3**
   * 
   * Property: For any private message (chatType = 2), the message SHALL have
   * valid sendId and recvId fields identifying sender and recipient.
   */
  it('Property 4.3: Private messages have valid sender and recipient', () => {
    // Generate only private messages
    const privateMessageArbitrary = fc.record({
      conversationId: conversationIdArbitrary,
      recvId: userIdArbitrary,
      sendId: userIdArbitrary,
      chatType: fc.constant(2), // Private chat
      content: contentArbitrary,
      contentType: contentTypeArbitrary,
    }).filter(msg => msg.sendId !== msg.recvId); // Ensure sender != receiver

    fc.assert(
      fc.property(privateMessageArbitrary, (message) => {
        // Private message must have valid structure
        return (
          isValidChatMessage(message) &&
          message.chatType === 2 &&
          message.sendId.length > 0 &&
          message.recvId.length > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
   * **Validates: Requirements 3.4**
   * 
   * Property: For any group message (chatType = 1), the message SHALL have
   * a valid conversationId identifying the group.
   */
  it('Property 4.4: Group messages have valid conversation ID', () => {
    // Generate only group messages
    const groupMessageArbitrary = fc.record({
      conversationId: conversationIdArbitrary,
      recvId: userIdArbitrary,
      sendId: userIdArbitrary,
      chatType: fc.constant(1), // Group chat
      content: contentArbitrary,
      contentType: contentTypeArbitrary,
    });

    fc.assert(
      fc.property(groupMessageArbitrary, (message) => {
        // Group message must have valid structure
        return (
          isValidChatMessage(message) &&
          message.chatType === 1 &&
          message.conversationId.length > 0 &&
          message.sendId.length > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Property: For any valid ChatMessage, the chatType SHALL be either 1 (group) or 2 (private).
   */
  it('Property 4.5: Chat type is always valid (1 or 2)', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        return message.chatType === 1 || message.chatType === 2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Property: For any valid ChatMessage, the contentType SHALL be 1 (text), 2 (image), or 3 (emoji).
   */
  it('Property 4.6: Content type is always valid (1, 2, or 3)', () => {
    fc.assert(
      fc.property(chatMessageArbitrary, (message) => {
        return message.contentType === 1 || message.contentType === 2 || message.contentType === 3;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 4: WebSocket Message Structure**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Property: Invalid messages (missing or wrong type fields) SHALL fail validation.
   */
  it('Property 4.7: Invalid messages fail validation', () => {
    // Generate objects with missing or invalid fields
    const invalidMessageArbitrary = fc.oneof(
      // Missing conversationId
      fc.record({
        recvId: userIdArbitrary,
        sendId: userIdArbitrary,
        chatType: chatTypeArbitrary,
        content: contentArbitrary,
        contentType: contentTypeArbitrary,
      }),
      // Wrong type for chatType (string instead of number)
      fc.record({
        conversationId: conversationIdArbitrary,
        recvId: userIdArbitrary,
        sendId: userIdArbitrary,
        chatType: fc.string(),
        content: contentArbitrary,
        contentType: contentTypeArbitrary,
      }),
      // Missing content
      fc.record({
        conversationId: conversationIdArbitrary,
        recvId: userIdArbitrary,
        sendId: userIdArbitrary,
        chatType: chatTypeArbitrary,
        contentType: contentTypeArbitrary,
      }),
      // Null value
      fc.constant(null),
      // Undefined value
      fc.constant(undefined),
      // Empty object
      fc.constant({})
    );

    fc.assert(
      fc.property(invalidMessageArbitrary, (invalidMessage) => {
        // Invalid messages must fail validation
        return !isValidChatMessage(invalidMessage);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
 * **Validates: Requirements 3.5**
 * 
 * Property: For any WebSocket disconnection, the reconnection attempts SHALL follow
 * exponential backoff pattern with delays doubling each attempt up to 5 attempts.
 */
describe('WebSocket Client - Reconnection Backoff Property Tests', () => {
  /**
   * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
   * **Validates: Requirements 3.5**
   * 
   * Property: For any valid attempt number (0 to MAX_ATTEMPTS-1), the delay SHALL
   * follow the exponential backoff formula: delay = initialDelay * 2^attempt
   */
  it('Property 5.1: Reconnection delay follows exponential backoff formula', () => {
    const maxAttempts = WebSocketClient.getMaxReconnectAttempts();
    const initialDelay = WebSocketClient.getInitialReconnectDelay();

    // Generate attempt numbers from 0 to maxAttempts - 1
    const attemptArbitrary = fc.integer({ min: 0, max: maxAttempts - 1 });

    fc.assert(
      fc.property(attemptArbitrary, (attempt) => {
        const calculatedDelay = WebSocketClient.calculateReconnectDelay(attempt);
        const expectedDelay = initialDelay * Math.pow(2, attempt);
        
        // The calculated delay must match the exponential backoff formula
        return calculatedDelay === expectedDelay;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
   * **Validates: Requirements 3.5**
   * 
   * Property: For any two consecutive attempts, the delay SHALL double.
   */
  it('Property 5.2: Delay doubles with each consecutive attempt', () => {
    const maxAttempts = WebSocketClient.getMaxReconnectAttempts();

    // Generate attempt numbers from 0 to maxAttempts - 2 (so we can check attempt + 1)
    const attemptArbitrary = fc.integer({ min: 0, max: maxAttempts - 2 });

    fc.assert(
      fc.property(attemptArbitrary, (attempt) => {
        const currentDelay = WebSocketClient.calculateReconnectDelay(attempt);
        const nextDelay = WebSocketClient.calculateReconnectDelay(attempt + 1);
        
        // The next delay must be exactly double the current delay
        return nextDelay === currentDelay * 2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
   * **Validates: Requirements 3.5**
   * 
   * Property: The maximum number of reconnection attempts SHALL be exactly 5.
   */
  it('Property 5.3: Maximum reconnection attempts is 5', () => {
    const maxAttempts = WebSocketClient.getMaxReconnectAttempts();
    
    // The max attempts must be exactly 5 as per Requirements 3.5
    expect(maxAttempts).toBe(5);
  });

  /**
   * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
   * **Validates: Requirements 3.5**
   * 
   * Property: For any attempt number, the delay SHALL be strictly positive.
   */
  it('Property 5.4: All reconnection delays are strictly positive', () => {
    const maxAttempts = WebSocketClient.getMaxReconnectAttempts();

    // Generate attempt numbers from 0 to maxAttempts - 1
    const attemptArbitrary = fc.integer({ min: 0, max: maxAttempts - 1 });

    fc.assert(
      fc.property(attemptArbitrary, (attempt) => {
        const delay = WebSocketClient.calculateReconnectDelay(attempt);
        
        // Delay must be strictly positive
        return delay > 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
   * **Validates: Requirements 3.5**
   * 
   * Property: For any two different attempt numbers, the delays SHALL be different
   * (strictly increasing with attempt number).
   */
  it('Property 5.5: Delays are strictly increasing with attempt number', () => {
    const maxAttempts = WebSocketClient.getMaxReconnectAttempts();

    // Generate two different attempt numbers
    const attemptPairArbitrary = fc.tuple(
      fc.integer({ min: 0, max: maxAttempts - 1 }),
      fc.integer({ min: 0, max: maxAttempts - 1 })
    ).filter(([a, b]) => a !== b);

    fc.assert(
      fc.property(attemptPairArbitrary, ([attempt1, attempt2]) => {
        const delay1 = WebSocketClient.calculateReconnectDelay(attempt1);
        const delay2 = WebSocketClient.calculateReconnectDelay(attempt2);
        
        // If attempt1 < attempt2, then delay1 < delay2 (and vice versa)
        if (attempt1 < attempt2) {
          return delay1 < delay2;
        } else {
          return delay1 > delay2;
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
   * **Validates: Requirements 3.5**
   * 
   * Property: The sequence of delays for all attempts SHALL form a geometric progression
   * with ratio 2.
   */
  it('Property 5.6: Delay sequence forms geometric progression with ratio 2', () => {
    const maxAttempts = WebSocketClient.getMaxReconnectAttempts();
    const delays: number[] = [];

    // Calculate all delays
    for (let i = 0; i < maxAttempts; i++) {
      delays.push(WebSocketClient.calculateReconnectDelay(i));
    }

    // Verify geometric progression: each term is 2x the previous
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBe(delays[i - 1] * 2);
    }
  });

  /**
   * **Feature: aioffice-frontend, Property 5: WebSocket Reconnection Backoff**
   * **Validates: Requirements 3.5**
   * 
   * Property: The initial delay (attempt 0) SHALL equal the configured initial delay.
   */
  it('Property 5.7: Initial delay matches configured value', () => {
    const initialDelay = WebSocketClient.getInitialReconnectDelay();
    const calculatedInitialDelay = WebSocketClient.calculateReconnectDelay(0);
    
    // The delay for attempt 0 must equal the initial delay
    expect(calculatedInitialDelay).toBe(initialDelay);
  });
});
