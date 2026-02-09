/**
 * ============================================================================
 * CHAT API ROUTE - Support Chat Operations
 * ============================================================================
 * 
 * POST /api/chat - Handle chat operations (create, send message, get messages)
 * GET /api/chat - Get chat messages
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// GET - Fetch chat and messages
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            return NextResponse.json({ error: 'chatId required' }, { status: 400 });
        }

        // Get chat info
        const { data: chat, error: chatError } = await supabase
            .from('support_chats')
            .select('*')
            .eq('id', chatId)
            .single();

        if (chatError) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Get messages
        const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (messagesError) {
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            chat,
            messages: messages || [],
        });

    } catch (error) {
        console.error('Chat API GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// POST - Create chat, send message, or perform actions
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const body = await request.json();
        const { action } = body;

        switch (action) {
            // Create new chat
            case 'createChat': {
                const { userId, userName, userEmail } = body;

                const { data: chat, error } = await supabase
                    .from('support_chats')
                    .insert({
                        user_id: userId || null,
                        user_name: userName,
                        user_email: userEmail || `${userName.replace(/\s/g, '_')}@guest.local`,
                        status: 'active',
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('Error creating chat:', error);
                    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
                }

                return NextResponse.json({ success: true, chat });
            }

            // Send message
            case 'sendMessage': {
                const { chatId, senderType, message, isAiResponse } = body;

                if (!chatId || !message) {
                    return NextResponse.json({ error: 'chatId and message required' }, { status: 400 });
                }

                const { data: newMessage, error } = await supabase
                    .from('chat_messages')
                    .insert({
                        chat_id: chatId,
                        sender_type: senderType || 'user',
                        message,
                        is_ai_response: isAiResponse || false,
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('Error sending message:', error);
                    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
                }

                // Update chat timestamp
                await supabase
                    .from('support_chats')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', chatId);

                return NextResponse.json({ success: true, message: newMessage });
            }

            // Update chat status
            case 'updateStatus': {
                const { chatId, status } = body;

                if (!chatId || !status) {
                    return NextResponse.json({ error: 'chatId and status required' }, { status: 400 });
                }

                const { error } = await supabase
                    .from('support_chats')
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq('id', chatId);

                if (error) {
                    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
                }

                return NextResponse.json({ success: true });
            }

            // Send support request (escalate to human support)
            case 'sendSupportRequest': {
                const { chatId, userName, userEmail, subject, message } = body;

                // Try to create an inbox message for admin (table might not exist)
                try {
                    await (supabase as any)
                        .from('inbox_messages')
                        .insert({
                            sender_name: userName,
                            sender_email: userEmail,
                            subject: subject || 'طلب دعم من المساعد الذكي',
                            message,
                            source: 'chat_widget',
                            chat_id: chatId,
                            status: 'unread',
                        });
                } catch (inboxError) {
                    console.error('Error creating inbox message:', inboxError);
                    // Don't fail - inbox table might not exist
                }

                // Update chat status to pending
                if (chatId) {
                    await supabase
                        .from('support_chats')
                        .update({ status: 'pending', updated_at: new Date().toISOString() })
                        .eq('id', chatId);
                }

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Chat API POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
