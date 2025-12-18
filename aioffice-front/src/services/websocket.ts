/**
 * WebSocket Client Service
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5 - Real-time messaging
 */

import type { ChatMessage, ConnectionStatus } from '../types/chat';
import { getToken } from './auth';

// WebSocket server URL - defaults to localhost:9001 for development
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:9001';

// Maximum reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;

// Initial reconnection delay in milliseconds
const INITIAL_RECONNECT_DELAY = 1000;

// Message callback type
type MessageCallback = (message: ChatMessage) => void;

// Connection status callback type
type ConnectionCallback = (status: ConnectionStatus) => void;

/**
 * WebSocket Client class
 * Implements connect, disconnect, send methods with exponential backoff reconnection
 */
class WebSocketClient {
  private socket: WebSocket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private token: string | null = null;

  /**
   * Connect to WebSocket server
   * Requirements: 3.1 - WHEN a user opens the chat module THEN the WebSocket_Client 
   * SHALL establish a connection to the server
   * 
   * @param token JWT token for authentication (optional, will use stored token if not provided)
   */
  connect(token?: string): void {
    // Use provided token or get from storage
    this.token = token || getToken();
    
    if (!this.token) {
      console.error('WebSocket: No token available for connection');
      this.updateConnectionStatus('disconnected');
      return;
    }

    // Don't reconnect if already connected or connecting
    if (this.socket?.readyState === WebSocket.OPEN || 
        this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.updateConnectionStatus('connecting');

    try {
      // Connect with token as query parameter
      const wsUrl = `${WS_BASE_URL}/ws?token=${encodeURIComponent(this.token)}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket: Connection error', error);
      this.updateConnectionStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    // Clear any pending reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Reset reconnect attempts
    this.reconnectAttempts = 0;

    // Close the socket if it exists
    if (this.socket) {
      // Remove event handlers to prevent reconnection attempts
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      if (this.socket.readyState === WebSocket.OPEN || 
          this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close(1000, 'Client disconnect');
      }
      this.socket = null;
    }

    this.updateConnectionStatus('disconnected');
  }

  /**
   * Send a message through WebSocket
   * Requirements: 3.3 - WHEN a user sends a private message THEN the WebSocket_Client 
   * SHALL deliver the message to the specified recipient
   * Requirements: 3.4 - WHEN a user sends a group message THEN the WebSocket_Client 
   * SHALL broadcast the message to all group members
   * 
   * @param message ChatMessage to send
   * @returns true if message was sent, false otherwise
   */
  send(message: ChatMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket: Cannot send message - not connected');
      return false;
    }

    // Validate message structure
    if (!this.isValidMessage(message)) {
      console.error('WebSocket: Invalid message structure', message);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('WebSocket: Failed to send message', error);
      return false;
    }
  }

  /**
   * Register a callback for incoming messages
   * Requirements: 3.2 - WHEN the WebSocket_Client receives a message THEN the 
   * AIOffice_Frontend SHALL display the message in real-time without page refresh
   * 
   * @param callback Function to call when a message is received
   */
  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.add(callback);
  }

  /**
   * Unregister a message callback
   * @param callback Function to remove
   */
  offMessage(callback: MessageCallback): void {
    this.messageCallbacks.delete(callback);
  }

  /**
   * Register a callback for connection status changes
   * @param callback Function to call when connection status changes
   */
  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.add(callback);
  }

  /**
   * Unregister a connection status callback
   * @param callback Function to remove
   */
  offConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.delete(callback);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && 
           this.socket?.readyState === WebSocket.OPEN;
  }


  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket: Connected');
    this.reconnectAttempts = 0;
    this.updateConnectionStatus('connected');
  }

  /**
   * Handle incoming WebSocket message
   * Requirements: 3.2 - Display message in real-time
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as ChatMessage;
      
      // Validate the received message structure
      if (this.isValidMessage(message)) {
        // Notify all registered callbacks
        this.messageCallbacks.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            console.error('WebSocket: Error in message callback', error);
          }
        });
      } else {
        console.warn('WebSocket: Received invalid message structure', event.data);
      }
    } catch (error) {
      console.error('WebSocket: Failed to parse message', error);
    }
  }

  /**
   * Handle WebSocket close event
   * Requirements: 3.5 - IF the WebSocket connection is lost THEN the WebSocket_Client 
   * SHALL attempt to reconnect with exponential backoff up to 5 times
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket: Closed (code: ${event.code}, reason: ${event.reason})`);
    
    // Only attempt reconnect if not a clean close (code 1000)
    if (event.code !== 1000) {
      this.scheduleReconnect();
    } else {
      this.updateConnectionStatus('disconnected');
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket: Error', event);
    // The close event will be fired after error, so reconnection is handled there
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   * Requirements: 3.5 - Exponential backoff up to 5 times
   */
  private scheduleReconnect(): void {
    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('WebSocket: Max reconnection attempts reached');
      this.updateConnectionStatus('disconnected');
      return;
    }

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.updateConnectionStatus('reconnecting');

    // Calculate delay with exponential backoff: delay = initialDelay * 2^attempts
    const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts);
    
    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.token || undefined);
    }, delay);
  }

  /**
   * Update connection status and notify callbacks
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      
      // Notify all registered callbacks
      this.connectionCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('WebSocket: Error in connection callback', error);
        }
      });
    }
  }

  /**
   * Validate message structure
   * Requirements: 3.3, 3.4 - Message must contain valid fields
   */
  private isValidMessage(message: unknown): message is ChatMessage {
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
   * Calculate reconnection delay for a given attempt number
   * Useful for testing the exponential backoff behavior
   * 
   * @param attempt Attempt number (0-based)
   * @returns Delay in milliseconds
   */
  static calculateReconnectDelay(attempt: number): number {
    return INITIAL_RECONNECT_DELAY * Math.pow(2, attempt);
  }

  /**
   * Get max reconnection attempts
   */
  static getMaxReconnectAttempts(): number {
    return MAX_RECONNECT_ATTEMPTS;
  }

  /**
   * Get initial reconnection delay
   */
  static getInitialReconnectDelay(): number {
    return INITIAL_RECONNECT_DELAY;
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient();

// Export singleton instance and class
export { WebSocketClient };
export default websocketClient;
