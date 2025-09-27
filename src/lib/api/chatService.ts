// lib/api/chatService.ts
import io  from 'socket.io-client';
import Cookies from 'js-cookie';
import { BACKEND_BASE_URL } from '../constants/api';

// Define the Socket type manually to avoid import issues
export type SocketType = ReturnType<typeof io>;

interface MessageData {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface ReportedMessageData {
  messageId: number;
  content: string;
  reportedBy: number;
  reportedAt: string;
  reason?: string;
}

class ChatService {
  private socket: SocketType | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): SocketType | null {
    try {
      // Get token from localStorage or auth service
      const token = Cookies.get('accessToken');
      if(token){
        console.log("Token found .....")
      }
      if (!token) {
        console.warn('No authentication token found');
        return null;
      }

      // Disconnect existing connection
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(BACKEND_BASE_URL || 'http://localhost:3000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'], // Fallback options
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.setupEventHandlers();
      return this.socket;

    } catch (error) {
      console.error('Failed to connect to chat service:', error);
      return null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat service');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('Disconnected from chat service:', reason);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  onNewMessage(callback: (message: MessageData) => void): void {
    this.socket?.on('newMessage', callback);
  }

  onReportedMessage(callback: (message: ReportedMessageData) => void): void {
    this.socket?.on('reportedMessage', callback);
  }

  onUserOnline(callback: (userId: number) => void): void {
    this.socket?.on('userOnline', callback);
  }

  onUserOffline(callback: (userId: number) => void): void {
    this.socket?.on('userOffline', callback);
  }

  onTyping(callback: (data: { userId: number; isTyping: boolean }) => void): void {
    this.socket?.on('typing', callback);
  }

  sendMessage(receiverId: number, content: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    if (!content.trim()) {
      console.warn('Cannot send empty message');
      return;
    }

    this.socket.emit('sendMessage', { 
      receiverId: Number(receiverId), 
      content: content.trim() 
    });
  }

  reportMessage(messageId: number, reason?: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('reportMessage', { 
      messageId: Number(messageId),
      reason 
    });
  }

  joinManagerRoom(): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('joinManagerRoom');
  }

  joinUserRoom(userId: number): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('joinRoom', { userId: Number(userId) });
  }

  startTyping(receiverId: number): void {
    this.socket?.emit('typing', { 
      receiverId: Number(receiverId), 
      isTyping: true 
    });
  }

  stopTyping(receiverId: number): void {
    this.socket?.emit('typing', { 
      receiverId: Number(receiverId), 
      isTyping: false 
    });
  }

  markMessageAsRead(messageId: number): void {
    this.socket?.emit('markAsRead', { messageId: Number(messageId) });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  removeListener(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Utility method to handle reconnection
  reconnect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();

// Export types for use in other files
export type { MessageData, ReportedMessageData };