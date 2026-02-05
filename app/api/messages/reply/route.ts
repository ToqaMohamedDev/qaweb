/**
 * API Route: Reply to Contact Message
 * POST /api/messages/reply
 * 
 * يرسل رد على رسالة اتصل بنا + بريد إلكتروني للمستخدم
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createMessageReplyEmail, sendEmail } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
    try {
        const { messageId, reply } = await request.json();

        if (!messageId || !reply) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // استخدام service role
        const supabase = createAdminClient();

        // جلب بيانات الرسالة
        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('*, user:user_id(email, notification_preferences(email_notifications))')
            .eq('id', messageId)
            .single();

        if (fetchError || !message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            );
        }

        // تحديث الرسالة
        const { error: updateError } = await supabase
            .from('messages')
            .update({
                status: 'replied',
                admin_reply: reply,
                replied_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', messageId);

        if (updateError) {
            console.error('Error updating message:', updateError);
            return NextResponse.json(
                { error: 'Failed to update message' },
                { status: 500 }
            );
        }

        // ✨ إرسال بريد إلكتروني للمستخدم
        const msg = message as any;
        const userEmail = msg.user?.email || msg.email;
        const emailEnabled = msg.user?.notification_preferences?.email_notifications !== false;

        if (userEmail && emailEnabled) {
            try {
                const messageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://qaalaa.com'}/contact`;

                const html = createMessageReplyEmail({
                    subject: message.subject,
                    reply,
                    messageUrl,
                });

                await sendEmail({
                    to: userEmail,
                    subject: `رد على رسالتك: ${message.subject}`,
                    html,
                });

                console.log(`✅ Reply email sent to ${userEmail}`);
            } catch (emailError) {
                console.error('Error sending reply email:', emailError);
                // لا نفشل الطلب إذا فشل البريد
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Reply sent successfully',
        });

    } catch (error) {
        console.error('Reply API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
