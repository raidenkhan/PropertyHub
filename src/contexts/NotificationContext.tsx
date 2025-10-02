// contexts/NotificationContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationService, Notification } from '@/lib/api/notificationService';
import { useAuth } from '@/lib/auth/authContext';
import { toast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  getUnreadCount: () => Promise<number>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize WebSocket and fetch initial data
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      notificationService.clearCache();
      return;
    }

    const initializeNotifications = async () => {
      try {
        setLoading(true);
        
        // Initialize WebSocket connection
        notificationService.initializeWebSocket();
        
        // Fetch initial data
        const [notificationsResponse, unreadCountResponse] = await Promise.all([
          notificationService.getNotifications(1, 20),
          notificationService.getUnreadCount()
        ]);
        
        setNotifications(notificationsResponse.data);
        setUnreadCount(unreadCountResponse);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    initializeNotifications();
  }, [user]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!user) return;

    const handleNewNotification = (notification: Notification) => {
      console.log('🔔 New notification in context:', notification);
      
      // Update local state
      setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep latest 20
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    };

    const handleNotificationsUpdated = (updatedNotifications: Notification[] | null) => {
      if (updatedNotifications) {
        setNotifications(updatedNotifications);
      }
    };

    const handleUnreadCountChanged = (newCount: number) => {
      setUnreadCount(newCount);
    };

    // Subscribe to events
    notificationService.on('newNotification', handleNewNotification);
    notificationService.on('notificationsUpdated', handleNotificationsUpdated);
    notificationService.on('unreadCountChanged', handleUnreadCountChanged);

    // Cleanup on unmount
    return () => {
      notificationService.off('newNotification', handleNewNotification);
      notificationService.off('notificationsUpdated', handleNotificationsUpdated);
      notificationService.off('unreadCountChanged', handleUnreadCountChanged);
    };
  }, [user]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state optimistically
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(1, 20);
      const newUnreadCount = await notificationService.getUnreadCount();
      
      setNotifications(response.data);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      toast({
        title: "Error",
        description: "Failed to refresh notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};