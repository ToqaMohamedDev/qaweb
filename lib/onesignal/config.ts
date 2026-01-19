/**
 * ============================================================================
 * ONESIGNAL CONFIGURATION
 * ============================================================================
 * 
 * أعدادات OneSignal للإشعارات
 * 
 * ملاحظة: يجب إضافة NEXT_PUBLIC_ONESIGNAL_APP_ID في ملف .env.local
 * ============================================================================
 */

// OneSignal App ID - يجب الحصول عليه من لوحة تحكم OneSignal
export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

// التحقق من صحة الإعدادات
export function validateOneSignalConfig(): boolean {
    if (!ONESIGNAL_APP_ID) {
        console.warn('⚠️ OneSignal App ID is not configured. Push notifications will not work.');
        return false;
    }
    return true;
}

// إعدادات OneSignal
export const ONESIGNAL_CONFIG = {
    appId: ONESIGNAL_APP_ID,

    // إعدادات الإشعارات
    notifyButton: {
        enable: false, // نستخدم UI مخصص بدلاً من الزر الافتراضي
    },

    // إعدادات Service Worker
    serviceWorkerPath: '/OneSignalSDKWorker.js',

    // السماح بالإشعارات على localhost للتطوير
    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',

    // عرض رسالة طلب الإذن
    promptOptions: {
        slidedown: {
            prompts: [
                {
                    type: 'push' as const,
                    autoPrompt: false, // نطلب يدوياً
                    text: {
                        actionMessage: 'هل تريد تلقي إشعارات عند نشر امتحانات جديدة؟',
                        acceptButton: 'نعم، أريد الإشعارات',
                        cancelButton: 'لاحقاً',
                    },
                },
            ],
        },
    },
};

// أنواع الإشعارات
export type NotificationEventType =
    | 'new_exam'           // امتحان جديد من مدرس متابَع
    | 'teacher_approved'   // تم قبول المدرس
    | 'teacher_rejected'   // تم رفض المدرس
    | 'exam_result'        // نتيجة امتحان
    | 'system'             // إشعار من النظام
    | 'promotional';       // إشعار ترويجي

// واجهة بيانات الإشعار
export interface NotificationPayload {
    type: NotificationEventType;
    title: string;
    message: string;
    url?: string;
    data?: Record<string, unknown>;
}
