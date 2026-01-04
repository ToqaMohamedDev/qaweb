/**
 * Subscription Service
 * 
 * Handles teacher subscriptions (اشتراكات المعلمين)
 */

import { getSupabaseClient } from '../supabase-client';
import type { TeacherSubscription, Profile } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface SubscriptionWithTeacher extends TeacherSubscription {
    teacher?: Profile;
}

export interface SubscriptionWithUser extends TeacherSubscription {
    user?: Profile;
}

// ==========================================
// Read Operations
// ==========================================

/**
 * Check if user is subscribed to a teacher
 */
export async function isSubscribed(userId: string, teacherId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('teacher_id', teacherId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return false;
        throw error;
    }
    return !!data;
}

/**
 * Get user's subscriptions (teachers they follow)
 */
export async function getUserSubscriptions(userId: string): Promise<TeacherSubscription[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get teacher's subscribers
 */
export async function getTeacherSubscribers(teacherId: string): Promise<TeacherSubscription[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_subscriptions')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get subscription count for a teacher
 */
export async function getSubscriberCount(teacherId: string): Promise<number> {
    const supabase = getSupabaseClient();

    const { count, error } = await supabase
        .from('teacher_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId);

    if (error) throw error;
    return count || 0;
}

/**
 * Get user's subscribed teacher IDs
 */
export async function getSubscribedTeacherIds(userId: string): Promise<string[]> {
    const subscriptions = await getUserSubscriptions(userId);
    return subscriptions.map(s => s.teacher_id);
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Subscribe to a teacher
 */
export async function subscribe(userId: string, teacherId: string): Promise<TeacherSubscription> {
    const supabase = getSupabaseClient();

    // Check if already subscribed
    const alreadySubscribed = await isSubscribed(userId, teacherId);
    if (alreadySubscribed) {
        throw new Error('Already subscribed to this teacher');
    }

    const { data, error } = await supabase
        .from('teacher_subscriptions')
        .insert({
            user_id: userId,
            teacher_id: teacherId,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Unsubscribe from a teacher
 */
export async function unsubscribe(userId: string, teacherId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('teacher_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('teacher_id', teacherId);

    if (error) throw error;
}

/**
 * Toggle subscription
 */
export async function toggleSubscription(
    userId: string,
    teacherId: string
): Promise<{ subscribed: boolean }> {
    const isCurrentlySubscribed = await isSubscribed(userId, teacherId);

    if (isCurrentlySubscribed) {
        await unsubscribe(userId, teacherId);
        return { subscribed: false };
    } else {
        await subscribe(userId, teacherId);
        return { subscribed: true };
    }
}
