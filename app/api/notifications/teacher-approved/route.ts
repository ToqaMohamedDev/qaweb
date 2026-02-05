/**
 * ============================================================================
 * API: NOTIFY TEACHER WHEN APPROVED
 * ============================================================================
 * 
 * POST /api/notifications/teacher-approved
 * 
 * يُرسل إشعار للمدرس عند قبول طلبه
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeacherApproved } from '@/lib/onesignal/server';

export async function POST(request: NextRequest) {
    try {
        // التحقق من أن المستخدم أدمن (يمكن إضافة تحقق إضافي)
        const authHeader = request.headers.get('authorization');

        // قراءة البيانات
        const body = await request.json();
        const { teacherId, teacherName } = body;

        if (!teacherId) {
            return NextResponse.json(
                { error: 'Missing required field: teacherId' },
                { status: 400 }
            );
        }

        // استخدام service role للوصول الكامل
        const supabase = createAdminClient();

        // جلب اسم المدرس إذا لم يتم إرساله
        let name = teacherName;
        if (!name) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', teacherId)
                .single();
            name = profile?.name || 'المدرس';
        }

        // 🔔 إرسال Push Notification عبر OneSignal
        const pushSuccess = await notifyTeacherApproved({
            teacherId,
            teacherName: name,
        });

        // إنشاء إشعار داخل التطبيق
        const { error: insertError } = await supabase
            .from('notifications')
            .insert({
                user_id: teacherId,
                title: '🎉 تهانينا! تم قبولك كمدرس',
                message: `مرحباً ${name}، تم قبول طلبك كمدرس على المنصة. يمكنك الآن نشر الامتحانات والتواصل مع الطلاب!`,
                status: 'sent',
                sent_at: new Date().toISOString(),
            });

        if (insertError) {
            console.error('Error inserting notification:', insertError);
        }

        if (pushSuccess) {
            console.log('✅ Teacher approval notification sent via OneSignal');
        }

        return NextResponse.json({
            success: true,
            message: 'Teacher approval notification sent',
            pushNotificationSent: pushSuccess,
        });

    } catch (error) {
        console.error('Teacher approval notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
