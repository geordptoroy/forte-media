import { describe, it, expect, beforeEach } from 'vitest';
import {
  notificationManager,
  createAdAlert,
  createCampaignUpdate,
  createMetricChange,
  createSystemNotification,
} from './notifications';

describe('Notification Manager', () => {
  const userId = 1;

  beforeEach(() => {
    notificationManager.clearNotifications(userId);
  });

  describe('notify', () => {
    it('should create a notification', () => {
      const notification = notificationManager.notify(userId, {
        type: 'system',
        title: 'Test',
        message: 'Test message',
      });

      expect(notification).toBeDefined();
      expect(notification.userId).toBe(userId);
      expect(notification.type).toBe('system');
      expect(notification.title).toBe('Test');
      expect(notification.message).toBe('Test message');
      expect(notification.read).toBe(false);
    });

    it('should generate unique IDs', () => {
      const notif1 = notificationManager.notify(userId, {
        type: 'system',
        title: 'Test 1',
        message: 'Message 1',
      });

      const notif2 = notificationManager.notify(userId, {
        type: 'system',
        title: 'Test 2',
        message: 'Message 2',
      });

      expect(notif1.id).not.toBe(notif2.id);
    });

    it('should include data if provided', () => {
      const notification = notificationManager.notify(userId, {
        type: 'ad_alert',
        title: 'Ad Alert',
        message: 'Ad detected',
        data: { adId: 'ad-123' },
      });

      expect(notification.data).toEqual({ adId: 'ad-123' });
    });
  });

  describe('getNotifications', () => {
    it('should return empty array for new user', () => {
      const notifications = notificationManager.getNotifications(userId);
      expect(notifications).toEqual([]);
    });

    it('should return all notifications', () => {
      notificationManager.notify(userId, {
        type: 'system',
        title: 'Test 1',
        message: 'Message 1',
      });

      notificationManager.notify(userId, {
        type: 'system',
        title: 'Test 2',
        message: 'Message 2',
      });

      const notifications = notificationManager.getNotifications(userId);
      expect(notifications).toHaveLength(2);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        notificationManager.notify(userId, {
          type: 'system',
          title: `Test ${i}`,
          message: `Message ${i}`,
        });
      }

      const notifications = notificationManager.getNotifications(userId, 5);
      expect(notifications).toHaveLength(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const notification = notificationManager.notify(userId, {
        type: 'system',
        title: 'Test',
        message: 'Test message',
      });

      expect(notification.read).toBe(false);

      const success = notificationManager.markAsRead(userId, notification.id);
      expect(success).toBe(true);

      const notifications = notificationManager.getNotifications(userId);
      expect(notifications[0].read).toBe(true);
    });

    it('should return false for non-existent notification', () => {
      const success = notificationManager.markAsRead(userId, 'non-existent');
      expect(success).toBe(false);
    });
  });

  describe('clearNotifications', () => {
    it('should clear all notifications for user', () => {
      notificationManager.notify(userId, {
        type: 'system',
        title: 'Test',
        message: 'Test message',
      });

      let notifications = notificationManager.getNotifications(userId);
      expect(notifications).toHaveLength(1);

      notificationManager.clearNotifications(userId);

      notifications = notificationManager.getNotifications(userId);
      expect(notifications).toHaveLength(0);
    });
  });

  describe('subscribe', () => {
    it('should call callback when notification is created', () => {
      let receivedNotification = null;

      const unsubscribe = notificationManager.subscribe(userId, (notification) => {
        receivedNotification = notification;
      });

      const notification = notificationManager.notify(userId, {
        type: 'system',
        title: 'Test',
        message: 'Test message',
      });

      expect(receivedNotification).toEqual(notification);

      unsubscribe();
    });

    it('should unsubscribe callback', () => {
      let callCount = 0;

      const unsubscribe = notificationManager.subscribe(userId, () => {
        callCount++;
      });

      notificationManager.notify(userId, {
        type: 'system',
        title: 'Test 1',
        message: 'Message 1',
      });

      expect(callCount).toBe(1);

      unsubscribe();

      notificationManager.notify(userId, {
        type: 'system',
        title: 'Test 2',
        message: 'Message 2',
      });

      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('Notification helpers', () => {
    it('should create ad alert', () => {
      const notification = createAdAlert(userId, 'ad-123', 'New ad detected');

      expect(notification.type).toBe('ad_alert');
      expect(notification.title).toBe('Alerta de Anúncio');
      expect(notification.data?.adId).toBe('ad-123');
    });

    it('should create campaign update', () => {
      const notification = createCampaignUpdate(userId, 'campaign-456', 'Campaign updated');

      expect(notification.type).toBe('campaign_update');
      expect(notification.title).toBe('Atualização de Campanha');
      expect(notification.data?.campaignId).toBe('campaign-456');
    });

    it('should create metric change', () => {
      const notification = createMetricChange(userId, 'spend', 5000);

      expect(notification.type).toBe('metric_change');
      expect(notification.title).toBe('Mudança de Métrica');
      expect(notification.data?.metric).toBe('spend');
      expect(notification.data?.value).toBe(5000);
    });

    it('should create system notification', () => {
      const notification = createSystemNotification(userId, 'System maintenance');

      expect(notification.type).toBe('system');
      expect(notification.title).toBe('Notificação do Sistema');
      expect(notification.message).toBe('System maintenance');
    });
  });
});
