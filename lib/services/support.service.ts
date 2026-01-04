/**
 * Support Service
 * 
 * Handles support chats and messages (دعم فني)
 */

import { getSupabaseClient } from '../supabase-client';
import type { SupportChat, ChatMessage, SenderType, TablesInsert } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface ChatWithMessages extends SupportChat {
    messages: ChatMessage[];
}

// ==========================================
// Support Chats
// ==========================================

/**
 * Get all support chats (admin)
 */
export async function getSupportChats(): Promise<SupportChat[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('support_chats')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get open support chats
 */
export async function getOpenChats(): Promise<SupportChat[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('status', 'open')
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get user's support chats
 */
export async function getUserChats(userId: string): Promise<SupportChat[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get a chat by ID with messages
 */
export async function getChatById(chatId: string): Promise<ChatWithMessages | null> {
    const supabase = getSupabaseClient();

    // Get chat
    const { data: chat, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('id', chatId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    // Get messages
    const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    return {
        ...chat,
        messages: messages || [],
    };
}

/**
 * Create a new support chat
 */
export async function createSupportChat(
    userId: string,
    subject?: string
): Promise<SupportChat> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('support_chats')
        .insert({
            user_id: userId,
            subject,
            status: 'open',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Close a support chat
 */
export async function closeChat(chatId: string): Promise<SupportChat> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('support_chats')
        .update({
            status: 'closed',
            updated_at: new Date().toISOString(),
        })
        .eq('id', chatId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Assign chat to admin
 */
export async function assignChat(chatId: string, adminId: string): Promise<SupportChat> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('support_chats')
        .update({
            assigned_to: adminId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', chatId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// Chat Messages
// ==========================================

/**
 * Get messages for a chat
 */
export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
    chatId: string,
    senderId: string | null,
    senderType: SenderType,
    message: string,
    isAiResponse: boolean = false
): Promise<ChatMessage> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            chat_id: chatId,
            sender_id: senderId,
            sender_type: senderType,
            message,
            is_ai_response: isAiResponse,
        })
        .select()
        .single();

    if (error) throw error;

    // Update chat's updated_at
    await supabase
        .from('support_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

    return data;
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChat(chatId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('support_chats')
        .delete()
        .eq('id', chatId);

    if (error) throw error;
}
