/**
 * ============================================================================
 * ONESIGNAL SERVER UTILITIES
 * ============================================================================
 * 
 * دوال إرسال الإشعارات من السيرفر (Server-side)
 * ============================================================================
 */

import * as OneSignal from '@onesignal/node-onesignal';

// إعدادات OneSignal API
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

// إنشاء Client
const configuration = OneSignal.createConfiguration({
    restApiKey: ONESIGNAL_REST_API_KEY,
});

const client = new OneSignal.DefaultApi(configuration);

// ============================================================================
// INTERFACES
// ============================================================================

interface SendNotificationOptions {
    // العنوان
    headings: {
        ar?: string;
        en?: string;
    };
    // المحتوى
    contents: {
        ar?: string;
        en?: string;
    };
    // الرابط عند الضغط
    url?: string;
    // بيانات إضافية
    data?: Record<string, unknown>;
    // أيقونة مخصصة
    icon?: string;
    // صورة كبيرة
    bigPicture?: string;
}

interface SendToFiltersOptions extends SendNotificationOptions {
    filters: OneSignal.Filter[];
}

interface SendToUserOptions extends SendNotificationOptions {
    userId: string;
}

interface SendToSegmentOptions extends SendNotificationOptions {
    segments: string[];
}

// ============================================================================
// SEND FUNCTIONS
// ============================================================================

/**
 * إرسال إشعار باستخدام الفلاتر
 * مثال: إرسال لكل المشتركين في مدرس معين
 */
export async function sendNotificationWithFilters(
    options: SendToFiltersOptions
): Promise<OneSignal.CreateNotificationSuccessResponse | null> {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
        console.error('OneSignal API credentials not configured');
        return null;
    }

    try {
        const notification = new OneSignal.Notification();
        notification.app_id = ONESIGNAL_APP_ID;
        notification.filters = options.filters;
        notification.headings = options.headings;
        notification.contents = options.contents;

        if (options.url) {
            notification.url = options.url;
        }

        if (options.data) {
            notification.data = options.data;
        }

        if (options.icon) {
            notification.chrome_web_icon = options.icon;
            notification.firefox_icon = options.icon;
        }

        if (options.bigPicture) {
            notification.chrome_web_image = options.bigPicture;
        }

        const response = await client.createNotification(notification);
        console.log('✅ Notification sent:', response);
        return response;
    } catch (error) {
        console.error('❌ Failed to send notification:', error);
        return null;
    }
}

/**
 * إرسال إشعار لمستخدم معين
 */
export async function sendNotificationToUser(
    options: SendToUserOptions
): Promise<OneSignal.CreateNotificationSuccessResponse | null> {
    return sendNotificationWithFilters({
        ...options,
        filters: [
            { field: 'tag', key: 'user_id', value: options.userId },
        ],
    });
}

/**
 * إرسال إشعار لشريحة معينة
 */
export async function sendNotificationToSegment(
    options: SendToSegmentOptions
): Promise<OneSignal.CreateNotificationSuccessResponse | null> {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
        console.error('OneSignal API credentials not configured');
        return null;
    }

    try {
        const notification = new OneSignal.Notification();
        notification.app_id = ONESIGNAL_APP_ID;
        notification.included_segments = options.segments;
        notification.headings = options.headings;
        notification.contents = options.contents;

        if (options.url) {
            notification.url = options.url;
        }

        if (options.data) {
            notification.data = options.data;
        }

        const response = await client.createNotification(notification);
        console.log('✅ Notification sent to segments:', response);
        return response;
    } catch (error) {
        console.error('❌ Failed to send notification:', error);
        return null;
    }
}

// ============================================================================
// SPECIFIC NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * إرسال إشعار امتحان جديد لمشتركي المدرس
 */
export async function notifyNewExam(params: {
    teacherId: string;
    teacherName: string;
    examId: string;
    examTitle: string;
    examType?: 'arabic' | 'english';
}): Promise<boolean> {
    const { teacherId, teacherName, examId, examTitle, examType = 'arabic' } = params;

    const examUrl = examType === 'english'
        ? `/english/teacher-exam/${examId}`
        : `/arabic/teacher-exam/${examId}`;

    const result = await sendNotificationWithFilters({
        filters: [
            { field: 'tag', key: `teacher_${teacherId}`, value: 'subscribed' },
        ],
        headings: {
            ar: '📝 امتحان جديد!',
            en: '📝 New Exam!',
        },
        contents: {
            ar: `${teacherName} نشر امتحان جديد: ${examTitle}`,
            en: `${teacherName} published a new exam: ${examTitle}`,
        },
        url: examUrl,
        data: {
            type: 'new_exam',
            teacherId,
            examId,
        },
    });

    return result !== null;
}

/**
 * إرسال إشعار قبول المدرس
 */
export async function notifyTeacherApproved(params: {
    teacherId: string;
    teacherName: string;
}): Promise<boolean> {
    const { teacherId, teacherName } = params;

    const result = await sendNotificationWithFilters({
        filters: [
            { field: 'tag', key: 'user_id', value: teacherId },
        ],
        headings: {
            ar: '🎉 تهانينا!',
            en: '🎉 Congratulations!',
        },
        contents: {
            ar: `تم قبولك كمدرس على المنصة، ${teacherName}. يمكنك الآن نشر الامتحانات!`,
            en: `You have been approved as a teacher, ${teacherName}. You can now publish exams!`,
        },
        url: '/dashboard',
        data: {
            type: 'teacher_approved',
            teacherId,
        },
    });

    return result !== null;
}

/**
 * إرسال إشعار رفض المدرس
 */
export async function notifyTeacherRejected(params: {
    teacherId: string;
    reason?: string;
}): Promise<boolean> {
    const { teacherId, reason } = params;

    const result = await sendNotificationWithFilters({
        filters: [
            { field: 'tag', key: 'user_id', value: teacherId },
        ],
        headings: {
            ar: 'تحديث على طلبك',
            en: 'Update on your request',
        },
        contents: {
            ar: reason || 'للأسف، لم يتم قبول طلبك كمدرس. يمكنك التواصل مع الدعم لمزيد من المعلومات.',
            en: reason || 'Unfortunately, your teacher application was not approved. Please contact support for more information.',
        },
        url: '/profile',
        data: {
            type: 'teacher_rejected',
            teacherId,
        },
    });

    return result !== null;
}

/**
 * إرسال إشعار نتيجة امتحان
 */
export async function notifyExamResult(params: {
    userId: string;
    examTitle: string;
    score: number;
    resultId: string;
}): Promise<boolean> {
    const { userId, examTitle, score, resultId } = params;

    const emoji = score >= 80 ? '🏆' : score >= 60 ? '👍' : '💪';

    const result = await sendNotificationWithFilters({
        filters: [
            { field: 'tag', key: 'user_id', value: userId },
        ],
        headings: {
            ar: `${emoji} نتيجة الامتحان`,
            en: `${emoji} Exam Result`,
        },
        contents: {
            ar: `حصلت على ${score}% في ${examTitle}`,
            en: `You scored ${score}% in ${examTitle}`,
        },
        url: `/results/${resultId}`,
        data: {
            type: 'exam_result',
            resultId,
            score,
        },
    });

    return result !== null;
}

/**
 * إرسال إشعار للجميع
 */
export async function notifyAll(params: {
    title: string;
    message: string;
    url?: string;
}): Promise<boolean> {
    const { title, message, url } = params;

    const result = await sendNotificationToSegment({
        segments: ['All'],
        headings: { ar: title, en: title },
        contents: { ar: message, en: message },
        url,
    });

    return result !== null;
}
