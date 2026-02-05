/**
 * ============================================================================
 * API: NOTIFY STUDENTS WHEN COMPREHENSIVE EXAM IS PUBLISHED
 * ============================================================================
 * 
 * POST /api/notifications/comprehensive-exam-published
 * 
 * يُرسل إشعار لجميع الطلاب (أو مرحلة معينة) عند نشر امتحان شامل من الموقع
 * 
 * هذا مختلف عن exam-published الذي يخص امتحانات المدرسين فقط
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyNewComprehensiveExam } from '@/lib/onesignal/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { examId, examTitle, stageId, stageName } = body;

        if (!examId || !examTitle) {
            return NextResponse.json(
                { error: 'Missing required fields: examId and examTitle' },
                { status: 400 }
            );
        }

        // استخدام service role للوصول الكامل
        const supabase = createAdminClient();

        // 🔔 إرسال Push Notification عبر OneSignal
        const pushSuccess = await notifyNewComprehensiveExam({
            examId,
            examTitle,
            stageId,
            stageName,
        });

        if (pushSuccess) {
            console.log('✅ Comprehensive exam push notification sent via OneSignal');
        } else {
            console.warn('⚠️ Comprehensive exam push notification failed');
        }

        // جلب الطلاب المستهدفين (لإنشاء إشعارات داخل التطبيق)
        let query = supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student');

        if (stageId) {
            query = query.eq('stage_id', stageId);
        }

        const { data: students } = await query;

        if (students && students.length > 0) {
            // إنشاء إشعارات داخل التطبيق
            const notifications = students.map(student => ({
                user_id: student.id,
                title: '📚 امتحان شامل جديد!',
                message: `تم نشر امتحان شامل جديد: ${examTitle}${stageName ? ` (${stageName})` : ''}`,
                type: 'exam',
                target_role: 'students',
                status: 'sent',
                sent_at: new Date().toISOString(),
            }));

            const { error: insertError, count } = await supabase
                .from('notifications')
                .insert(notifications as any);

            if (insertError) {
                console.error('Error inserting in-app notifications:', insertError);
            } else {
                console.log(`✅ Created ${students.length} in-app notifications`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Comprehensive exam notification sent',
            pushNotificationSent: pushSuccess,
            studentsNotified: students?.length || 0,
            targetedStage: stageId ? stageName : 'جميع المراحل',
        });

    } catch (error) {
        console.error('Comprehensive exam notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
