import { EventEmitter } from 'events';

interface Notification {
  id: string;
  userId: number;
  type: 'ad_alert' | 'campaign_update' | 'metric_change' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

class NotificationManager extends EventEmitter {
  private notifications: Map<number, Notification[]> = new Map();
  private subscribers: Map<number, Set<(notification: Notification) => void>> = new Map();

  subscribe(userId: number, callback: (notification: Notification) => void) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    return () => {
      this.subscribers.get(userId)?.delete(callback);
    };
  }

  notify(userId: number, notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      userId,
      createdAt: new Date(),
      read: false,
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(newNotification);

    // Notify all subscribers
    const subscribers = this.subscribers.get(userId);
    if (subscribers) {
      subscribers.forEach((callback) => callback(newNotification));
    }

    // Emit for SSE
    this.emit(`user:${userId}`, newNotification);

    return newNotification;
  }

  getNotifications(userId: number, limit: number = 50): Notification[] {
    return (this.notifications.get(userId) || []).slice(-limit);
  }

  markAsRead(userId: number, notificationId: string): boolean {
    const notifications = this.notifications.get(userId);
    if (!notifications) return false;

    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  clearNotifications(userId: number): void {
    this.notifications.delete(userId);
  }
}

export const notificationManager = new NotificationManager();

// Notification types for type safety
export type NotificationType = Notification['type'];

export function createAdAlert(userId: number, adId: string, message: string) {
  return notificationManager.notify(userId, {
    type: 'ad_alert',
    title: 'Alerta de Anúncio',
    message,
    data: { adId },
  });
}

export function createCampaignUpdate(userId: number, campaignId: string, message: string) {
  return notificationManager.notify(userId, {
    type: 'campaign_update',
    title: 'Atualização de Campanha',
    message,
    data: { campaignId },
  });
}

export function createMetricChange(userId: number, metric: string, value: number) {
  return notificationManager.notify(userId, {
    type: 'metric_change',
    title: 'Mudança de Métrica',
    message: `${metric} mudou para ${value}`,
    data: { metric, value },
  });
}

export function createSystemNotification(userId: number, message: string) {
  return notificationManager.notify(userId, {
    type: 'system',
    title: 'Notificação do Sistema',
    message,
  });
}
