// lib/api/notificationService.ts
import { authService, getAuthHeader } from '../auth/authservice';
import { BACKEND_BASE_URL } from '../constants/api';
import { chatService } from './chatService';

export interface Notification {
  relatedId(arg0: string, relatedId: any): unknown;
  read: any;
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedPropertyId?: string;
  relatedTransactionId?: string;
  relatedDisputeId?: number;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  property?: {
    id: number;
    title: string;
    propertyId: string;
  };
  transaction?: {
    id: number;
    transactionId: string;
    amount: number;
  };
  dispute?: {
    id: number;
    disputeId: string;
    title: string;
  };
}

export interface NotificationResponse {
  status: string;
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class NotificationService {
  private baseUrl = BACKEND_BASE_URL;
  private notificationCache: Notification[] | null = null;
  private unreadCountCache: number | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isWebSocketConnected = false;

  // Initialize WebSocket connection for real-time notifications
  initializeWebSocket(): void {
    try {
      const socket = chatService.connect();
      if (socket && !this.isWebSocketConnected) {
        this.isWebSocketConnected = true;
        
        // Listen for new notifications
        socket.on('newNotification', (notification: Notification) => {
          console.log('📬 New notification received:', notification);
          this.handleNewNotification(notification);
        });
        
        // Listen for notification updates (like mark as read)
        socket.on('notificationUpdated', (notification: Notification) => {
          console.log('🔄 Notification updated:', notification);
          this.handleNotificationUpdate(notification);
        });
        
        // Listen for unread count updates
        socket.on('unreadCountUpdate', (data: { userId: number; count: number }) => {
          console.log('🔢 Unread count updated:', data);
          this.unreadCountCache = data.count;
          this.emit('unreadCountChanged', data.count);
        });
        
        console.log('🔌 Notification WebSocket listeners initialized');
      }
    } catch (error) {
      console.error('Failed to initialize notification WebSocket:', error);
    }
  }

  // Handle new notification from WebSocket
  private handleNewNotification(notification: Notification): void {
    // Add to cache if exists
    if (this.notificationCache) {
      this.notificationCache.unshift(notification);
      // Keep only latest 50 notifications in cache
      this.notificationCache = this.notificationCache.slice(0, 50);
    }
    
    // Update unread count
    if (this.unreadCountCache !== null && !notification.isRead) {
      this.unreadCountCache += 1;
    }
    
    // Emit events for listeners
    this.emit('newNotification', notification);
    this.emit('unreadCountChanged', this.unreadCountCache);
    this.emit('notificationsUpdated', this.notificationCache);
  }
  
  // Handle notification update from WebSocket
  private handleNotificationUpdate(updatedNotification: Notification): void {
    if (this.notificationCache) {
      const index = this.notificationCache.findIndex(n => n.id === updatedNotification.id);
      if (index !== -1) {
        const wasUnread = !this.notificationCache[index].isRead;
        this.notificationCache[index] = updatedNotification;
        
        // Update unread count if status changed
        if (wasUnread && updatedNotification.isRead && this.unreadCountCache !== null) {
          this.unreadCountCache = Math.max(0, this.unreadCountCache - 1);
          this.emit('unreadCountChanged', this.unreadCountCache);
        }
        
        this.emit('notificationsUpdated', this.notificationCache);
      }
    }
  }
  
  // Event system for real-time updates
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) return;
    
    if (callback) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in notification event listener for ${event}:`, error);
      }
    });
  }

  // Get user notifications with pagination
  async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationResponse> {
    try {
      const response = await authService.authenticatedFetch(
        `${this.baseUrl}/notifications?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      // Cache first page for quick access
      if (page === 1) {
        this.notificationCache = data.data;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      // Return cached value if available
      if (this.unreadCountCache !== null) {
        return this.unreadCountCache;
      }

      const response = await authService.authenticatedFetch(
        `${this.baseUrl}/notifications/unread-count`,
        {
          method: 'GET',
          headers: getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      this.unreadCountCache = data.count || 0;
      return this.unreadCountCache?this.unreadCountCache:0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  // Mark single notification as read
  async markAsRead(notificationId: number): Promise<void> {
    try {
      const response = await authService.authenticatedFetch(
        `${this.baseUrl}/notifications/${notificationId}/mark-read`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update cache
      if (this.notificationCache) {
        this.notificationCache = this.notificationCache.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        );
      }

      // Update unread count cache
      if (this.unreadCountCache !== null && this.unreadCountCache > 0) {
        this.unreadCountCache -= 1;
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const response = await authService.authenticatedFetch(
        `${this.baseUrl}/notifications/mark-all-read`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update cache
      if (this.notificationCache) {
        this.notificationCache = this.notificationCache.map(notification => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString()
        }));
      }

      // Reset unread count
      this.unreadCountCache = 0;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Get cached notifications (for quick display)
  getCachedNotifications(): Notification[] {
    return this.notificationCache || [];
  }

  // Get cached unread count (for quick display)
  getCachedUnreadCount(): number {
    return this.unreadCountCache || 0;
  }

  // Clear cache (call when user logs out or when you want fresh data)
  clearCache(): void {
    this.notificationCache = null;
    this.unreadCountCache = null;
    this.eventListeners.clear();
    this.isWebSocketConnected = false;
  }

  // Refresh cache by fetching latest data
  async refreshCache(): Promise<void> {
    try {
      const [notifications, unreadCount] = await Promise.all([
        this.getNotifications(1, 10), // Get first 10 notifications
        this.getUnreadCount()
      ]);

      this.notificationCache = notifications.data;
      this.unreadCountCache = unreadCount;
      
      // Initialize WebSocket if not already connected
      if (!this.isWebSocketConnected) {
        this.initializeWebSocket();
      }
    } catch (error) {
      console.error('Failed to refresh notification cache:', error);
    }
  }

  // Get notification type icon
  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      PROPERTY_APPROVED: '🎉',
      PROPERTY_REJECTED: '❌',
      PROPERTY_SUSPENDED: '⚠️',
      PROPERTY_VERIFICATION_REQUIRED: '📝',
      TRANSACTION_ESCROW_RELEASED: '💰',
      TRANSACTION_PAYMENT_CONFIRMED: '✅',
      TRANSACTION_COMPLETED: '🏁',
      DISPUTE_RESOLVED: '✅',
      DISPUTE_ESCALATED: '⬆️',
      MESSAGE_RECEIVED: '💬',
      ACCOUNT_SUSPENDED: '🚫',
      SYSTEM_ANNOUNCEMENT: '📢'
    };

    return iconMap[type] || '🔔';
  }

  // Get notification color theme
  getNotificationColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      PROPERTY_APPROVED: 'text-green-600 bg-green-50',
      PROPERTY_REJECTED: 'text-red-600 bg-red-50',
      PROPERTY_SUSPENDED: 'text-orange-600 bg-orange-50',
      PROPERTY_VERIFICATION_REQUIRED: 'text-blue-600 bg-blue-50',
      TRANSACTION_ESCROW_RELEASED: 'text-green-600 bg-green-50',
      TRANSACTION_PAYMENT_CONFIRMED: 'text-green-600 bg-green-50',
      TRANSACTION_COMPLETED: 'text-blue-600 bg-blue-50',
      DISPUTE_RESOLVED: 'text-green-600 bg-green-50',
      DISPUTE_ESCALATED: 'text-orange-600 bg-orange-50',
      MESSAGE_RECEIVED: 'text-blue-600 bg-blue-50',
      ACCOUNT_SUSPENDED: 'text-red-600 bg-red-50',
      SYSTEM_ANNOUNCEMENT: 'text-purple-600 bg-purple-50'
    };

    return colorMap[type] || 'text-gray-600 bg-gray-50';
  }

  // Format time ago (utility function)
  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const notificationService = new NotificationService();