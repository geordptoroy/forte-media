import { useState, useEffect, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'ad_alert' | 'campaign_update' | 'metric_change' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  onNotification?: (notification: Notification) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, onNotification } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Connect to SSE endpoint
  useEffect(() => {
    if (!enabled) return;

    try {
      const es = new EventSource('/api/notifications/stream');

      es.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data) as Notification;
          notification.createdAt = new Date(notification.createdAt);

          setNotifications((prev) => [notification, ...prev]);
          onNotification?.(notification);
        } catch (err) {
          console.error('Failed to parse notification:', err);
        }
      });

      es.addEventListener('open', () => {
        setIsConnected(true);
        setError(null);
      });

      es.addEventListener('error', () => {
        setIsConnected(false);
        setError(new Error('Failed to connect to notifications'));
      });

      setEventSource(es);

      return () => {
        es.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [enabled, onNotification]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    // Send to server
    fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    }).catch((err) => console.error('Failed to mark notification as read:', err));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);

    // Send to server
    fetch('/api/notifications/clear', {
      method: 'POST',
    }).catch((err) => console.error('Failed to clear notifications:', err));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    isConnected,
    error,
    unreadCount,
    markAsRead,
    clearAll,
  };
}

// Hook for displaying toast notifications
export function useNotificationToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `toast-${Date.now()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
