// components/NotificationToast.tsx
"use client";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { notificationService, Notification } from '@/lib/api/notificationService';
import { useAuth } from '@/lib/auth/authContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToastComponent = ({ notification, onClose }: NotificationToastProps) => {
  const icon = notificationService.getNotificationIcon(notification.type);
  const colorClasses = notificationService.getNotificationColor(notification.type);

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleMarkAsRead = async () => {
    try {
      await notificationService.markAsRead(notification.id);
      onClose();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        fixed top-20 right-4 z-[100] w-96 max-w-[90vw] 
        bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700
        overflow-hidden cursor-pointer
      `}
      onClick={handleMarkAsRead}
    >
      {/* Progress bar */}
      <motion.div
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClasses}`}>
            <span className="text-lg">{icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                {notification.title}
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {notification.message}
            </p>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {notificationService.formatTimeAgo(notification.createdAt)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Click to mark as read
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

// Hook for managing toast notifications
export const useNotificationToasts = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let toastQueue: Notification[] = [];
    let activeToast: NodeJS.Timeout | null = null;
    let currentToastId: number | null = null;

    const showNextToast = () => {
      if (toastQueue.length === 0 || currentToastId !== null) return;

      const notification = toastQueue.shift()!;
      currentToastId = notification.id;

      // Create toast container if it doesn't exist
      let toastContainer = document.getElementById('notification-toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'notification-toast-container';
        toastContainer.style.cssText = `
          position: fixed;
          top: 0;
          right: 0;
          z-index: 1000;
          pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
      }

      // Use the regular toast system with custom styling
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });

      // Mark as processed after delay
      activeToast = setTimeout(() => {
        currentToastId = null;
        showNextToast();
      }, 6000);
    };

    // Listen for new notifications (you can integrate with WebSockets here)
    // const interval = setInterval(async () => {
    //   try {
    //     // Check for new notifications
    //     const response = await notificationService.getNotifications(1, 5);
    //     const unreadNotifications = response.data.filter(n => !n.isRead);
        
    //     // Add new notifications to queue
    //     unreadNotifications.forEach(notification => {
    //       if (!toastQueue.find(n => n.id === notification.id)) {
    //         toastQueue.push(notification);
    //       }
    //     });

    //     showNextToast();
    //   } catch (error) {
    //     console.error('Failed to check for new notifications:', error);
    //   }
    // }, 15000); // Check every 15 seconds

    return () => {
     // clearInterval(interval);
      if (activeToast) {
        clearTimeout(activeToast);
      }
      toastQueue = [];
    };
  }, [user]);
};

// Provider component to include in your app
export const NotificationToastProvider = ({ children }: { children: React.ReactNode }) => {
  useNotificationToasts();
  return <>{children}</>;
};