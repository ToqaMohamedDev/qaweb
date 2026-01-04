import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createExamPublishedEmail, sendEmail } from '@/lib/services/email.service';

// إرسال إشعارات للمشتركين عند نشر امتحان جديد
export async function POST(request: NextRequest) {
    try {
        const { examId, examTitle, teacherId, teacherName } = await request.json();

        if (!examId || !teacherId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // استخدام service role للوصول الكامل
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // جلب المشتركين مع المدرس
        const { data: subscribers, error: subError } = await supabase
            .from('teacher_subscriptions')
            .select('user_id, notifications_enabled')
            .eq('teacher_id', teacherId)
            .eq('notifications_enabled', true);

        if (subError) {
            console.error('Error fetching subscribers:', subError);
            return NextResponse.json(
                { error: 'Failed to fetch subscribers' },
                { status: 500 }
            );
        }

        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No subscribers to notify',
                notified: 0
            });
        }

        // إنشاء إشعارات لكل مشترك
        const notifications = subscribers.map(sub => ({
            user_id: sub.user_id,
            type: 'new_content',
            title: `امتحان جديد من ${teacherName || 'المدرس'}`,
            body: examTitle || 'امتحان جديد متاح الآن',
            data: {
                exam_id: examId,
                teacher_id: teacherId,
                redirect_route: `/arabic/teacher-exam/${examId}`,
                action: 'new_exam'
            },
            priority: 5
        }));

        // إدراج الإشعارات
        const { error: insertError, data: insertedNotifications } = await supabase
            .from('notifications')
            .insert(notifications)
            .select('id');

        if (insertError) {
            console.error('Error inserting notifications:', insertError);
            return NextResponse.json(
                { error: 'Failed to create notifications' },
                { status: 500 }
            );
        }

        // ✨ إرسال البريد الإلكتروني في الخلفية (لا ننتظر)
        sendEmailToSubscribers(
            supabase,
            subscribers.map(s => s.user_id),
            examId,
            examTitle || 'امتحان جديد',
            teacherName || 'المدرس'
        ).catch(err => console.error('Background email error:', err));

        return NextResponse.json({
            success: true,
            message: `Notifications sent to ${subscribers.length} subscribers`,
            notified: subscribers.length,
            notification_ids: insertedNotifications?.map(n => n.id) || []
        });

    } catch (error) {
        console.error('Notification API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * ✨ إرسال إشعارات البريد الإلكتروني (background task)
 */
async function sendEmailToSubscribers(
    supabase: any,
    userIds: string[],
    examId: string,
    examTitle: string,
    teacherName: string
) {
    try {
        // جلب بيانات المستخدمين مع تفضيلات البريد
        const { data: users } = await supabase
            .from('profiles')
            .select('id, email, notification_preferences(email_notifications)')
            .in('id', userIds);

        if (!users || users.length === 0) return;

        const examUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://qaalaa.com'}/arabic/teacher-exam/${examId}`;

        // إرسال البريد لكل مستخدم
        for (const user of users) {
            // تحقق من تفعيل البريد
            const emailEnabled = user.notification_preferences?.email_notifications !== false;

            if (!emailEnabled || !user.email) continue;

            try {
                const html = createExamPublishedEmail({
                    teacherName,
                    examTitle,
                    examUrl,
                });

                await sendEmail({
                    to: user.email,
                    subject: `امتحان جديد من ${teacherName}`,
                    html,
                });

                console.log(`✅ Email sent to ${user.email} for exam ${examId}`);
            } catch (err) {
                console.error(`Failed to send email to ${user.email}:`, err);
            }
        }
    } catch (error) {
        console.error('Error sending email notifications:', error);
    }
}
