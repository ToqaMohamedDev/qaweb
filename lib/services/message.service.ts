/**
 * Message Service
 * 
 * Handles contact messages (رسائل الاتصال)
 */

import { createBrowserClient } from '../supabase';

// Helper to get client
const getSupabaseClient = () => createBrowserClient();
import type { Message, TablesInsert, TablesUpdate } from '../database.types';

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all messages (admin) - Uses API route for Vercel compatibility
 */
export async function getMessages(): Promise<Message[]> {
    try {
        const res = await fetch('/api/admin/query?table=messages&orderBy=created_at&ascending=false&limit=500', { credentials: 'include' });
        const result = await res.json();

        if (!res.ok) {
            // If permission denied, return empty array instead of throwing
            if (result.error?.includes('permission denied')) {
                console.warn('Messages table permission denied - check SUPABASE_SERVICE_ROLE_KEY');
                return [];
            }
            throw new Error(result.error || 'Failed to fetch messages');
        }

        return result.data || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

/**
 * Get unread messages
 */
export async function getUnreadMessages(): Promise<Message[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get starred messages
 */
export async function getStarredMessages(): Promise<Message[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('is_starred', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Get unread message count
 */
export async function getUnreadMessageCount(): Promise<number> {
    const supabase = getSupabaseClient();

    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

    if (error) throw error;
    return count || 0;
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Send a message (contact form)
 */
export async function sendMessage(message: {
    fromName: string;
    fromEmail: string;
    subject: string;
    message: string;
    fromUserId?: string;
}): Promise<Message> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .insert({
            from_name: message.fromName,
            from_email: message.fromEmail,
            subject: message.subject,
            message: message.message,
            from_user_id: message.fromUserId,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(id: string): Promise<Message> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Toggle message starred
 */
export async function toggleMessageStarred(id: string, starred: boolean): Promise<Message> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .update({ is_starred: starred })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Archive message
 */
export async function archiveMessage(id: string): Promise<Message> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Reply to message
 */
export async function replyToMessage(
    id: string,
    replyText: string,
    repliedBy: string
): Promise<Message> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('messages')
        .update({
            is_replied: true,
            reply_text: replyText,
            replied_by: repliedBy,
            replied_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete message
 */
export async function deleteMessage(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
