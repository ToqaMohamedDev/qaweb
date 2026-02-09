"use client";

/**
 * ============================================================================
 * USE NOTIFICATIONS HOOK - Via API Route (Vercel-compatible)
 * ============================================================================
 *
 * Ready-to-use React hook for real-time notifications
 * Uses API route to avoid direct Supabase calls from browser
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
import {
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

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastNotificationIdRef = useRef<string | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Fetch notifications via API
    const fetchNotifications = useCallback(async (isPolling = false) => {
        const authUser = useAuthStore.getState().user;

        if (!authUser) {
            setIsAuthenticated(false);
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setIsAuthenticated(true);

        // Don't show loading spinner for polling refreshes
        if (!isPolling) {
            setLoading(true);
        }

        try {
            const response = await fetch(`/api/notifications?limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setIsAuthenticated(false);
                    setNotifications([]);
                    setUnreadCount(0);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Check for new notifications (for sound)
            if (isPolling && data.notifications.length > 0) {
                const newestId = data.notifications[0]?.id;
                if (lastNotificationIdRef.current && newestId !== lastNotificationIdRef.current) {
                    // New notification arrived
                    playNotificationSound();

                    // Show browser notification
                    const newNotification = data.notifications[0];
                    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
                        new window.Notification(newNotification.title, {
                            body: newNotification.body,
                            icon: "/icons/notification-icon.png",
                        });
                    }
                }
                lastNotificationIdRef.current = newestId;
            } else if (data.notifications.length > 0) {
                lastNotificationIdRef.current = data.notifications[0]?.id;
            }

            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
            setError(null);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            // Only log unexpected errors
            if (!errorMessage.includes('401')) {
                logger.warn("Error fetching notifications", {
                    context: 'useNotifications',
                    data: { message: errorMessage }
                });
            }

            // Don't overwrite existing data on polling errors
            if (!isPolling) {
                setError(err as Error);
            }
        } finally {
            if (!isPolling) {
                setLoading(false);
            }
        }
    }, [limit, playNotificationSound]);

    // Initial fetch, real-time subscription, and polling setup
    useEffect(() => {
        let mounted = true;
        let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
        const supabase = createClient();

        const init = async () => {
            const authUser = useAuthStore.getState().user;

            if (!authUser || !mounted) {
                setLoading(false);
                return;
            }

            // Fetch initial data
            await fetchNotifications();

            // Set up real-time subscription for instant notifications
            realtimeChannel = supabase
                .channel(`notifications-${authUser.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${authUser.id}`,
                    },
                    (payload) => {
                        if (!mounted) return;
                        const newNotification = payload.new as NotificationRecord;
                        
                        // Add to notifications list
                        setNotifications((prev) => {
                            // Avoid duplicates
                            if (prev.some((n) => n.id === newNotification.id)) return prev;
                            return [newNotification, ...prev];
                        });
                        setUnreadCount((prev) => prev + 1);
                        
                        // Play sound
                        playNotificationSound();
                        
                        // Show browser notification
                        if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
                            new window.Notification(newNotification.title, {
                                body: newNotification.body,
                                icon: "/icons/notification-icon.png",
                            });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${authUser.id}`,
                    },
                    (payload) => {
                        if (!mounted) return;
                        const updatedNotification = payload.new as NotificationRecord;
                        setNotifications((prev) =>
                            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
                        );
                        // Recalculate unread count
                        setNotifications((prev) => {
                            const unread = prev.filter((n) => !n.is_read).length;
                            setUnreadCount(unread);
                            return prev;
                        });
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${authUser.id}`,
                    },
                    (payload) => {
                        if (!mounted) return;
                        const deletedId = (payload.old as any).id;
                        setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
                    }
                )
                .subscribe();

            // Set up polling as backup (every 60 seconds instead of 30)
            pollingIntervalRef.current = setInterval(() => {
                if (mounted) {
                    fetchNotifications(true);
                }
            }, 60000);
        };

        init();

        // Listen for auth changes
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
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (realtimeChannel) {
                supabase.removeChannel(realtimeChannel);
            }
            subscription.unsubscribe();
        };
    }, [fetchNotifications, playNotificationSound]);

    // Auto-refresh interval (custom interval)
    useEffect(() => {
        if (autoRefreshInterval > 0 && isAuthenticated) {
            const interval = setInterval(() => fetchNotifications(true), autoRefreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefreshInterval, isAuthenticated, fetchNotifications]);

    // Mark as read via API
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'markAsRead',
                    notificationId,
                }),
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notificationId
                            ? { ...n, is_read: true, read_at: new Date().toISOString() }
                            : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            logger.error("Error marking notification as read", { context: 'useNotifications', data: err });
        }
    }, []);

    // Mark all as read via API
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'markAllAsRead' }),
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({
                        ...n,
                        is_read: true,
                        read_at: new Date().toISOString(),
                    }))
                );
                setUnreadCount(0);
            }
        } catch (err) {
            logger.error("Error marking all notifications as read", { context: 'useNotifications', data: err });
        }
    }, []);

    // Delete notification via API
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const notification = notifications.find((n) => n.id === notificationId);

            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'delete',
                    notificationId,
                }),
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                if (notification && !notification.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
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
        refetch: () => fetchNotifications(),
        isAuthenticated,
    };
}

// Re-export utilities
export { getNotificationStyle, formatNotificationTime };
export type { NotificationRecord as Notification, NotificationType };
