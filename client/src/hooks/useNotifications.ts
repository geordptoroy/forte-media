import { useState, useEffect, useCallback } from "react";

interface Notification {
  id: string;
  type: "ad_alert" | "campaign_update" | "metric_change" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  onNotification?: (notification: Notification) => void;
}

/**
 * Hook para receber notificacoes em tempo real via Server-Sent Events (SSE).
 * Conecta ao endpoint /api/notifications/stream do backend.
 *
 * O hook useNotificationToast foi removido pois duplicava a funcionalidade
 * do Sonner (toaster) ja instalado e configurado na aplicacao.
 * Para exibir toasts, use diretamente: import { toast } from "sonner"
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, onNotification } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource;

    try {
      es = new EventSource("/api/notifications/stream");

      es.addEventListener("notification", (event) => {
        try {
          const notification = JSON.parse(event.data) as Notification;
          notification.createdAt = new Date(notification.createdAt);
          setNotifications((prev) => [notification, ...prev]);
          onNotification?.(notification);
        } catch {
          // Ignorar erros de parse de notificacoes individuais
        }
      });

      es.addEventListener("open", () => {
        setIsConnected(true);
        setError(null);
      });

      es.addEventListener("error", () => {
        setIsConnected(false);
        setError(new Error("Falha ao conectar ao stream de notificacoes"));
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"));
    }

    return () => {
      es?.close();
    };
  }, [enabled, onNotification]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    fetch(`/api/notifications/${notificationId}/read`, { method: "POST" }).catch(
      () => {}
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    fetch("/api/notifications/clear", { method: "POST" }).catch(() => {});
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
