/**
 * ============================================================================
 * API: NOTIFY STUDENTS WHEN NEW QUESTION BANK IS ADDED
 * ============================================================================
 * 
 * POST /api/notifications/question-bank-added
 * 
 * يُرسل إشعار للطلاب عند إضافة بنك أسئلة جديد
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyNewQuestionBank } from '@/lib/onesignal/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { lessonId, lessonTitle, stageId, stageName, subjectName } = body;

        if (!lessonId || !lessonTitle) {
            return NextResponse.json(
                { error: 'Missing required fields: lessonId and lessonTitle' },
                { status: 400 }
            );
        }

        // استخدام service role للوصول الكامل
        const supabase = createAdminClient();

        // 🔔 إرسال Push Notification عبر OneSignal
        const pushSuccess = await notifyNewQuestionBank({
            lessonId,
            lessonTitle,
            stageId,
            stageName,
            subjectName,
        });

        if (pushSuccess) {
            console.log('✅ Question bank push notification sent via OneSignal');
        } else {
            console.warn('⚠️ Question bank push notification failed');
        }

        // جلب الطلاب المستهدفين
        let query = supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student');

        if (stageId) {
            query = query.eq('stage_id', stageId);
        }

        const { data: students } = await query;

        if (students && students.length > 0) {
            const subjectText = subjectName ? ` - ${subjectName}` : '';
            const stageText = stageName ? ` (${stageName})` : '';

            // إنشاء إشعارات داخل التطبيق
            const notifications = students.map(student => ({
                user_id: student.id,
                title: '❓ أسئلة جديدة متاحة!',
                message: `تم إضافة أسئلة جديدة لـ: ${lessonTitle}${subjectText}${stageText}`,
                type: 'lesson',
                target_role: 'students',
                status: 'sent',
                sent_at: new Date().toISOString(),
            }));

            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notifications as any);

            if (insertError) {
                console.error('Error inserting in-app notifications:', insertError);
            } else {
                console.log(`✅ Created ${students.length} in-app notifications for question bank`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Question bank notification sent',
            pushNotificationSent: pushSuccess,
            studentsNotified: students?.length || 0,
            targetedStage: stageId ? stageName : 'جميع المراحل',
        });

    } catch (error) {
        console.error('Question bank notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
