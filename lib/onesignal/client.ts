/**
 * ============================================================================
 * ONESIGNAL CLIENT UTILITIES
 * ============================================================================
 * 
 * دوال التعامل مع OneSignal في المتصفح (Client-side)
 * All functions use dynamic imports to avoid SSR issues
 * ============================================================================
 */

'use client';

// حالة التهيئة
let isInitialized = false;
let initializationAttempted = false;
let OneSignalInstance: any = null;

/**
 * تهيئة OneSignal
 * يجب استدعاؤها مرة واحدة عند بدء التطبيق
 */
export async function initOneSignal(): Promise<boolean> {
    // منع التهيئة المتكررة
    if (isInitialized) {
        return true;
    }

    // منع محاولات التهيئة المتكررة
    if (initializationAttempted) {
        return false;
    }
    initializationAttempted = true;

    // التحقق من أننا في المتصفح
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        // Dynamic import to avoid SSR issues
        const OneSignalModule = await import('react-onesignal');
        OneSignalInstance = OneSignalModule.default;

        const { ONESIGNAL_APP_ID, validateOneSignalConfig } = await import('./config');

        // التحقق من الإعدادات
        if (!validateOneSignalConfig()) {
            console.warn('OneSignal config is not valid');
            return false;
        }

        await OneSignalInstance.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            notifyButton: {
                enable: false, // نستخدم UI مخصص
            },
        });

        // إضافة Event Listeners
        setupEventListeners();

        isInitialized = true;
        console.log('✅ OneSignal initialized successfully');
        return true;
    } catch (error: any) {
        // تجاهل خطأ "already initialized"
        if (error?.message?.includes('already initialized') ||
            error?.toString()?.includes('already initialized')) {
            isInitialized = true;
            return true;
        }

        // تسجيل خطأ domain restriction بدون كسر التطبيق
        if (error?.message?.includes('Can only be used on')) {
            console.warn('⚠️ OneSignal: Domain not allowed.');
            return false;
        }

        // أي خطأ آخر - نتجاهله ونستمر
        console.warn('OneSignal init failed (non-blocking):', error?.message || error);
        return false;
    }
}

/**
 * إعداد Event Listeners
 */
function setupEventListeners(): void {
    if (!OneSignalInstance) return;

    try {
        // استماع لتغيير حالة الاشتراك
        OneSignalInstance.User.PushSubscription.addEventListener('change', (event: any) => {
            console.log('📱 Push subscription changed:', event);
        });

        // استماع للإشعارات الواردة (عندما يكون التطبيق مفتوح)
        OneSignalInstance.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
            console.log('📩 Notification received in foreground:', event.notification);
            // يمكن إضافة toast أو UI notification هنا
        });

        // استماع للنقر على الإشعار
        OneSignalInstance.Notifications.addEventListener('click', (event: any) => {
            console.log('👆 Notification clicked:', event.notification);
            // التوجيه للصفحة المناسبة
            const url = event.notification?.launchURL;
            if (url && typeof window !== 'undefined') {
                window.location.href = url;
            }
        });
    } catch (error) {
        console.warn('Failed to setup OneSignal event listeners:', error);
    }
}

/**
 * طلب إذن الإشعارات من المستخدم
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isInitialized || !OneSignalInstance) {
        console.warn('OneSignal not initialized');
        return false;
    }

    try {
        const permission = await OneSignalInstance.Notifications.permission;

        if (permission) {
            console.log('Notifications already permitted');
            return true;
        }

        await OneSignalInstance.Slidedown.promptPush();
        const newPermission = await OneSignalInstance.Notifications.permission;
        return newPermission;
    } catch (error) {
        console.warn('Failed to request notification permission:', error);
        return false;
    }
}

/**
 * تسجيل دخول المستخدم مع OneSignal
 */
export async function loginUser(userId: string, userData?: {
    email?: string;
    name?: string;
    role?: 'student' | 'teacher' | 'admin';
}): Promise<void> {
    if (!isInitialized || !OneSignalInstance) {
        return;
    }

    try {
        // التحقق من ما إذا كان المستخدم مسجلاً بالفعل بنفس المعرف لتجنب التكرار
        const currentExternalId = OneSignalInstance.User.externalId;
        if (currentExternalId !== userId) {
            await OneSignalInstance.login(userId);
            console.log('✅ User logged in to OneSignal:', userId);
        } else {
            console.log('ℹ️ User already logged in to OneSignal:', userId);
        }

        // تحديث البيانات وال Tags
        const tags: Record<string, string> = {
            user_id: userId // إضافة user_id دائماً
        };

        if (userData) {
            if (userData.email) tags.email = userData.email;
            if (userData.name) tags.name = userData.name;
            if (userData.role) tags.role = userData.role;
        }

        await OneSignalInstance.User.addTags(tags);
        console.log('✅ User tags updated');

    } catch (error) {
        console.warn('Failed to login/sync user to OneSignal:', error);
    }
}

/**
 * تسجيل خروج المستخدم من OneSignal
 */
export async function logoutUser(): Promise<void> {
    if (!isInitialized || !OneSignalInstance) return;

    try {
        await OneSignalInstance.logout();
    } catch (error) {
        console.warn('Failed to logout from OneSignal:', error);
    }
}

/**
 * إضافة Tag للمستخدم
 */
export async function addUserTag(key: string, value: string): Promise<void> {
    if (!isInitialized || !OneSignalInstance) return;

    try {
        await OneSignalInstance.User.addTag(key, value);
    } catch (error) {
        console.warn('Failed to add tag:', error);
    }
}

/**
 * إزالة Tag من المستخدم
 */
export async function removeUserTag(key: string): Promise<void> {
    if (!isInitialized || !OneSignalInstance) return;

    try {
        await OneSignalInstance.User.removeTag(key);
    } catch (error) {
        console.warn('Failed to remove tag:', error);
    }
}

/**
 * تسجيل اشتراك المستخدم في مدرس
 */
export async function subscribeToTeacher(teacherId: string): Promise<void> {
    await addUserTag(`teacher_${teacherId}`, 'subscribed');
}

/**
 * إلغاء اشتراك المستخدم في مدرس
 */
export async function unsubscribeFromTeacher(teacherId: string): Promise<void> {
    await removeUserTag(`teacher_${teacherId}`);
}

/**
 * الحصول على حالة الإشعارات
 */
export async function getNotificationStatus(): Promise<{
    isSupported: boolean;
    isPermitted: boolean;
    isSubscribed: boolean;
}> {
    if (typeof window === 'undefined') {
        return { isSupported: false, isPermitted: false, isSubscribed: false };
    }

    if (!isInitialized || !OneSignalInstance) {
        return { isSupported: true, isPermitted: false, isSubscribed: false };
    }

    try {
        const isSupported = OneSignalInstance.Notifications.isPushSupported();
        const isPermitted = await OneSignalInstance.Notifications.permission;
        const subscription = await OneSignalInstance.User.PushSubscription.optedIn;

        return {
            isSupported,
            isPermitted,
            isSubscribed: subscription || false,
        };
    } catch {
        return { isSupported: true, isPermitted: false, isSubscribed: false };
    }
}
