/**
 * ============================================================================
 * NOTIFICATION CLIENT - Real-time Notifications with Supabase
 * ============================================================================
 * 
 * Usage:
 * 
 * import { NotificationClient, useNotifications } from '@/lib/notifications';
 * 
 * // Hook usage (React)
 * const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
 * 
 * // Class usage
 * const client = new NotificationClient(supabase);
 * await client.subscribe();
 * 
 * ============================================================================
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
    | 'system'
    | 'achievement'
    | 'quiz_result'
    | 'new_content'
    | 'subscription'
    | 'reminder'
    | 'social'
    | 'promotional'
    | 'security'
    | 'billing';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, unknown>;
    is_read: boolean;
    read_at: string | null;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreference {
    notification_type: NotificationType;
    email_enabled: boolean;
    push_enabled: boolean;
    in_app_enabled: boolean;
}

export interface DeviceRegistration {
    device_token: string;
    platform: 'ios' | 'android' | 'web';
    device_name?: string;
    device_model?: string;
    os_version?: string;
    app_version?: string;
}

// ============================================================================
// NOTIFICATION CLIENT CLASS
// ============================================================================

export class NotificationClient {
    private supabase: SupabaseClient;
    private channel: RealtimeChannel | null = null;
    private onNewNotification: ((notification: Notification) => void) | null = null;
    private onNotificationUpdate: ((notification: Notification) => void) | null = null;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    // ============================================================================
    // REAL-TIME SUBSCRIPTION
    // ============================================================================

    /**
     * Subscribe to real-time notifications
     */
    async subscribe(
        onNew?: (notification: Notification) => void,
        onUpdate?: (notification: Notification) => void
    ): Promise<void> {
        this.onNewNotification = onNew || null;
        this.onNotificationUpdate = onUpdate || null;

        const { data: { user } } = await this.supabase.auth.getUser();

        if (!user) {
            throw new Error('User must be authenticated to subscribe to notifications');
        }

        // Unsubscribe from existing channel if any
        await this.unsubscribe();

        // Create new channel for user's notifications
        this.channel = this.supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    logger.debug('New notification received', { context: 'NotificationClient', data: payload.new });
                    if (this.onNewNotification) {
                        this.onNewNotification(payload.new as Notification);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    logger.debug('Notification updated', { context: 'NotificationClient', data: payload.new });
                    if (this.onNotificationUpdate) {
                        this.onNotificationUpdate(payload.new as Notification);
                    }
                }
            )
            .subscribe((status) => {
                logger.debug('Notification channel status', { context: 'NotificationClient', data: { status } });
            });
    }

    /**
     * Unsubscribe from real-time notifications
     */
    async unsubscribe(): Promise<void> {
        if (this.channel) {
            await this.supabase.removeChannel(this.channel);
            this.channel = null;
        }
    }

    // ============================================================================
    // FETCH NOTIFICATIONS
    // ============================================================================

    /**
     * Get paginated notifications
     */
    async getNotifications(options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
        type?: NotificationType;
    }): Promise<{ notifications: Notification[]; total: number }> {
        const {
            page = 1,
            limit = 20,
            unreadOnly = false,
            type,
        } = options || {};

        const offset = (page - 1) * limit;

        let query = this.supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            notifications: data as Notification[],
            total: count || 0,
        };
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<number> {
        const { data, error } = await this.supabase
            .rpc('get_unread_notification_count');

        if (error) throw error;
        return data as number;
    }

    // ============================================================================
    // MARK AS READ
    // ============================================================================

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .rpc('mark_notification_read', { p_notification_id: notificationId });

        if (error) throw error;
        return data as boolean;
    }

    /**
     * Mark multiple notifications as read
     */
    async markMultipleAsRead(notificationIds: string[]): Promise<number> {
        const { data, error } = await this.supabase
            .rpc('mark_notifications_read_bulk', { p_notification_ids: notificationIds });

        if (error) throw error;
        return data as number;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<number> {
        const { data, error } = await this.supabase
            .rpc('mark_notifications_read_bulk', { p_mark_all: true });

        if (error) throw error;
        return data as number;
    }

    // ============================================================================
    // DELETE NOTIFICATIONS
    // ============================================================================

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
    }

    /**
     * Delete multiple notifications
     */
    async deleteMultiple(notificationIds: string[]): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .delete()
            .in('id', notificationIds);

        if (error) throw error;
    }

    // ============================================================================
    // DEVICE MANAGEMENT (Push Notifications)
    // ============================================================================

    /**
     * Register device for push notifications
     */
    async registerDevice(registration: DeviceRegistration): Promise<string> {
        const { data, error } = await this.supabase.rpc('register_device', {
            p_device_token: registration.device_token,
            p_platform: registration.platform,
            p_device_name: registration.device_name,
            p_device_model: registration.device_model,
            p_os_version: registration.os_version,
            p_app_version: registration.app_version,
        });

        if (error) throw error;
        return data as string;
    }

    /**
     * Unregister device (e.g., on logout)
     */
    async unregisterDevice(deviceToken: string): Promise<boolean> {
        const { data, error } = await this.supabase.rpc('unregister_device', {
            p_device_token: deviceToken,
        });

        if (error) throw error;
        return data as boolean;
    }

    /**
     * Get user's registered devices
     */
    async getDevices(): Promise<Array<{
        id: string;
        device_token: string;
        platform: string;
        device_name: string;
        is_active: boolean;
        last_used_at: string;
    }>> {
        const { data, error } = await this.supabase
            .from('user_devices')
            .select('*')
            .order('last_used_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // ============================================================================
    // NOTIFICATION PREFERENCES
    // ============================================================================

    /**
     * Get all notification preferences
     */
    async getPreferences(): Promise<NotificationPreference[]> {
        const { data, error } = await this.supabase
            .rpc('get_user_notification_preferences');

        if (error) throw error;
        return data as NotificationPreference[];
    }

    /**
     * Update notification preference for a specific type
     */
    async updatePreference(
        notificationType: NotificationType,
        options: {
            email_enabled?: boolean;
            push_enabled?: boolean;
            in_app_enabled?: boolean;
        }
    ): Promise<string> {
        const { data, error } = await this.supabase.rpc('update_notification_preferences', {
            p_notification_type: notificationType,
            p_email_enabled: options.email_enabled,
            p_push_enabled: options.push_enabled,
            p_in_app_enabled: options.in_app_enabled,
        });

        if (error) throw error;
        return data as string;
    }

    /**
     * Disable all notifications of a specific type
     */
    async muteNotificationType(notificationType: NotificationType): Promise<void> {
        await this.updatePreference(notificationType, {
            email_enabled: false,
            push_enabled: false,
            in_app_enabled: false,
        });
    }

    /**
     * Enable all notifications of a specific type
     */
    async unmuteNotificationType(notificationType: NotificationType): Promise<void> {
        await this.updatePreference(notificationType, {
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
        });
    }
}

// ============================================================================
// REACT HOOK (Optional - for React projects)
// ============================================================================

// Uncomment and use if you have React in your project:
/*
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();
  const client = new NotificationClient(supabase);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { notifications } = await client.getNotifications();
      setNotifications(notifications);
      
      const count = await client.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchNotifications();

    client.subscribe(
      // On new notification
      (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Optional: Play notification sound
        // playNotificationSound();
        
        // Optional: Show toast
        // toast.success(notification.title, { description: notification.body });
      },
      // On notification update
      (notification) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? notification : n))
        );
        if (notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    );

    return () => {
      client.unsubscribe();
    };
  }, []);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    await client.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    await client.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    await client.deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
*/

// ============================================================================
// WEB PUSH UTILITIES
// ============================================================================

/**
 * Request permission and get FCM token for web push notifications
 * Requires Firebase to be initialized in your app
 */
export async function requestWebPushPermission(): Promise<string | null> {
    if (!('Notification' in window)) {
        logger.warn('Browser does not support notifications', { context: 'WebPush' });
        return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        logger.info('Notification permission denied', { context: 'WebPush' });
        return null;
    }

    // Get FCM token - requires Firebase to be initialized
    // const messaging = getMessaging();
    // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
    // return token;

    logger.info('Notification permission granted. Implement FCM token retrieval.', { context: 'WebPush' });
    return null;
}

/**
 * Get notification type icon and color
 */
export function getNotificationStyle(type: NotificationType): {
    icon: string;
    color: string;
    bgColor: string;
} {
    const styles: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
        system: { icon: '🔔', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
        achievement: { icon: '🏆', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
        quiz_result: { icon: '📝', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
        new_content: { icon: '✨', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
        subscription: { icon: '💳', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
        reminder: { icon: '⏰', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
        social: { icon: '👥', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.1)' },
        promotional: { icon: '🎁', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
        security: { icon: '🔒', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
        billing: { icon: '💰', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
    };

    return styles[type] || styles.system;
}

/**
 * Format notification time
 */
export function formatNotificationTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

export default NotificationClient;
