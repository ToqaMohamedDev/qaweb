"use client";

/**
 * ============================================================================
 * USE NOTIFICATIONS HOOK - Real-time Notifications with Supabase
 * ============================================================================
 *
 * Ready-to-use React hook for real-time notifications
 *
 * Usage:
 * const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
 *
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { logger } from "@/lib/utils/logger";
import NotificationClient, {
    type Notification as NotificationRecord,
    type NotificationType,
    getNotificationStyle,
    formatNotificationTime,
} from "@/lib/notifications";

interface UseNotificationsOptions {
    /** Limit of notifications to fetch */
    limit?: number;
    /** Auto-refresh interval in milliseconds (0 = disabled) */
    autoRefreshInterval?: number;
    /** Play sound on new notification */
    playSound?: boolean;
}

interface UseNotificationsReturn {
    /** List of notifications */
    notifications: NotificationRecord[];
    /** Count of unread notifications */
    unreadCount: number;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: Error | null;
    /** Mark a single notification as read */
    markAsRead: (notificationId: string) => Promise<void>;
    /** Mark all notifications as read */
    markAllAsRead: () => Promise<void>;
    /** Delete a notification */
    deleteNotification: (notificationId: string) => Promise<void>;
    /** Refetch notifications */
    refetch: () => Promise<void>;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
}

export function useNotifications(
    options: UseNotificationsOptions = {}
): UseNotificationsReturn {
    const { limit = 20, autoRefreshInterval = 0, playSound = true } = options;

    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const clientRef = useRef<NotificationClient | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize notification sound
    useEffect(() => {
        if (playSound && typeof window !== "undefined") {
            audioRef.current = new Audio("/sounds/notification.mp3");
            audioRef.current.volume = 0.5;
        }
    }, [playSound]);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (audioRef.current && playSound) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Autoplay might be blocked
            });
        }
    }, [playSound]);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        const supabase = createClient();
        const authUser = useAuthStore.getState().user;

        if (!authUser) {
            setIsAuthenticated(false);
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setIsAuthenticated(true);

        try {
            if (!clientRef.current) {
                clientRef.current = new NotificationClient(supabase);
            }

            const { notifications: data } = await clientRef.current.getNotifications({
                limit,
            });
            const count = await clientRef.current.getUnreadCount();

            setNotifications(data);
            setUnreadCount(count);
            setError(null);
        } catch (err: unknown) {
            // Properly extract error details from Supabase PostgrestError
            const errorObj = err as { message?: string; code?: string; details?: string; hint?: string };
            const errorMessage = errorObj?.message || 'Unknown error';
            const errorCode = errorObj?.code || '';

            // Known non-critical errors - handle gracefully without logging as error
            const isTableMissing = errorCode === '42P01' || errorMessage.includes('does not exist');
            const isFunctionMissing = errorCode === '42883' || errorMessage.includes('function') && errorMessage.includes('does not exist');
            const isRLSError = errorCode === '42501' || errorMessage.includes('permission denied');
            const isNotSetup = isTableMissing || isFunctionMissing || isRLSError;

            if (isNotSetup) {
                // Only log once as debug, not error - this is expected if notifications aren't set up
                logger.debug('Notifications not configured', {
                    context: 'useNotifications',
                    data: { code: errorCode, reason: errorMessage.substring(0, 100) }
                });
                // Set empty state gracefully - don't treat as fatal error
                setNotifications([]);
                setUnreadCount(0);
                setError(null);
            } else {
                // Unexpected error - log it
                logger.warn("Error fetching notifications", {
                    context: 'useNotifications',
                    data: { message: errorMessage, code: errorCode }
                });
                setError(err as Error);
            }
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Subscribe to real-time updates
    useEffect(() => {
        let mounted = true;
        const supabase = createClient();

        const init = async () => {
            const authUser = useAuthStore.getState().user;

            if (!authUser || !mounted) return;

            clientRef.current = new NotificationClient(supabase);

            // Fetch initial data
            await fetchNotifications();

            // Subscribe to real-time
            await clientRef.current.subscribe(
                // On new notification
                (notification: NotificationRecord) => {
                    if (!mounted) return;
                    setNotifications((prev) => [notification, ...prev].slice(0, limit));
                    setUnreadCount((prev) => prev + 1);
                    playNotificationSound();

                    // Show browser notification
                    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
                        new window.Notification(notification.title, {
                            body: notification.body,
                            icon: "/icons/notification-icon.png",
                            badge: "/icons/badge-icon.png",
                        });
                    }
                },
                // On notification update
                (updatedNotification: NotificationRecord) => {
                    if (!mounted) return;
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.id === updatedNotification.id ? updatedNotification : n
                        )
                    );
                    if (updatedNotification.is_read) {
                        setUnreadCount((prev) => Math.max(0, prev - 1));
                    }
                }
            );
        };

        init();

        // Auth state listener
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setIsAuthenticated(true);
                fetchNotifications();
            } else {
                setIsAuthenticated(false);
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        return () => {
            mounted = false;
            clientRef.current?.unsubscribe();
            subscription.unsubscribe();
        };
    }, [fetchNotifications, limit, playNotificationSound]);

    // Auto-refresh interval
    useEffect(() => {
        if (autoRefreshInterval > 0 && isAuthenticated) {
            const interval = setInterval(fetchNotifications, autoRefreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefreshInterval, isAuthenticated, fetchNotifications]);

    // Mark as read
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!clientRef.current) return;

        try {
            await clientRef.current.markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId
                        ? { ...n, is_read: true, read_at: new Date().toISOString() }
                        : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            logger.error("Error marking notification as read", { context: 'useNotifications', data: err });
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!clientRef.current) return;

        try {
            await clientRef.current.markAllAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({
                    ...n,
                    is_read: true,
                    read_at: new Date().toISOString(),
                }))
            );
            setUnreadCount(0);
        } catch (err) {
            logger.error("Error marking all notifications as read", { context: 'useNotifications', data: err });
        }
    }, []);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!clientRef.current) return;

        try {
            await clientRef.current.deleteNotification(notificationId);
            const notification = notifications.find((n) => n.id === notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            if (notification && !notification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            logger.error("Error deleting notification", { context: 'useNotifications', data: err });
        }
    }, [notifications]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch: fetchNotifications,
        isAuthenticated,
    };
}

// Re-export utilities
export { getNotificationStyle, formatNotificationTime };
export type { NotificationRecord as Notification, NotificationType };
