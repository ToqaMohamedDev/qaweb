/**
 * Notification Service
 * 
 * Handles notifications (الإشعارات)
 */

import { getSupabaseClient } from '../supabase-client';
import type { Notification, NotificationPreference, TablesInsert, TablesUpdate } from '../database.types';

// ==========================================
// Read Operations
// ==========================================

/**
 * Get user's notifications
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const supabase = getSupabaseClient();

    // Try using the RPC function first
    const { data, error } = await supabase.rpc('get_unread_notification_count');

    if (!error && data !== null) {
        return data;
    }

    // Fallback to manual count
    const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (countError) throw countError;
    return count || 0;
}

/**
 * Get a notification by ID
 */
export async function getNotificationById(id: string): Promise<Notification | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Create a notification
 */
export async function createNotification(
    notification: TablesInsert<'notifications'>
): Promise<Notification> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Send notification to a user
 */
export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    createdBy?: string
): Promise<Notification> {
    return createNotification({
        user_id: userId,
        title,
        message,
        created_by: createdBy,
        status: 'sent',
        sent_at: new Date().toISOString(),
    });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) throw error;
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
}

// ==========================================
// Notification Preferences
// ==========================================

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
    userId: string,
    preferences: Partial<TablesUpdate<'notification_preferences'>>
): Promise<NotificationPreference> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}
