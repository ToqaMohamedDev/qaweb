/**
 * API Route: Reply to Support Chat
 * POST /api/support/reply
 * 
 * يرسل رد على محادثة دعم فني + بريد إلكتروني للمستخدم
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupportReplyEmail, sendEmail } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
    try {
        const { chatId, message } = await request.json();

        if (!chatId || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // استخدام service role
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // جلب بيانات المحادثة
        const { data: chat, error: fetchError } = await supabase
            .from('support_chats')
            .select('*, user:user_id(email, notification_preferences(email_notifications))')
            .eq('id', chatId)
            .single();

        if (fetchError || !chat) {
            return NextResponse.json(
                { error: 'Chat not found' },
                { status: 404 }
            );
        }

        // إضافة الرسالة
        const { error: insertError } = await supabase
            .from('chat_messages')
            .insert({
                chat_id: chatId,
                sender_id: null, // admin
                message,
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            console.error('Error inserting message:', insertError);
            return NextResponse.json(
                { error: 'Failed to send message' },
                { status: 500 }
            );
        }

        // تحديث حالة المحادثة
        await supabase
            .from('support_chats')
            .update({
                status: 'pending',
                updated_at: new Date().toISOString(),
            })
            .eq('id', chatId);

        // ✨ إرسال بريد إلكتروني للمستخدم
        const userEmail = chat.user?.email;
        const emailEnabled = chat.user?.notification_preferences?.email_notifications !== false;

        if (userEmail && emailEnabled) {
            try {
                const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://qaalaa.com'}/support`;

                const html = createSupportReplyEmail({
                    chatSubject: chat.subject,
                    reply: message,
                    chatUrl,
                });

                await sendEmail({
                    to: userEmail,
                    subject: `رد من فريق الدعم: ${chat.subject}`,
                    html,
                });

                console.log(`✅ Support reply email sent to ${userEmail}`);
            } catch (emailError) {
                console.error('Error sending support reply email:', emailError);
                // لا نفشل الطلب إذا فشل البريد
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Reply sent successfully',
        });

    } catch (error) {
        console.error('Support reply API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
