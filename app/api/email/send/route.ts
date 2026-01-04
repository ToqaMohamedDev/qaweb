/**
 * API Route: Send Email Notification
 * POST /api/email/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { sendEmailNotification } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // التحقق من المصادقة
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // قراءة البيانات
        const { userId, title, message, actionUrl, actionText } = await request.json();

        // التحقق من الصلاحيات (admin or sending to self)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.role === 'admin';
        const isSendingToSelf = userId === user.id;

        if (!isAdmin && !isSendingToSelf) {
            return NextResponse.json(
                { error: 'Forbidden: You can only send emails to yourself or be an admin' },
                { status: 403 }
            );
        }

        // إرسال البريد
        await sendEmailNotification({
            userId,
            title,
            message,
            actionUrl,
            actionText,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email send error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
