/**
 * ============================================================================
 * ONESIGNAL CLIENT UTILITIES
 * ============================================================================
 * 
 * دوال التعامل مع OneSignal في المتصفح (Client-side)
 * ============================================================================
 */

'use client';

import OneSignal from 'react-onesignal';
import { ONESIGNAL_APP_ID, validateOneSignalConfig } from './config';

// حالة التهيئة
let isInitialized = false;
let initializationAttempted = false;

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

    // التحقق من الإعدادات
    if (!validateOneSignalConfig()) {
        return false;
    }

    // التحقق من أننا في المتصفح
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
            serviceWorkerPath: '/OneSignalSDKWorker.js',
        });

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
            console.warn('⚠️ OneSignal: Domain not allowed. Add localhost in OneSignal dashboard for local testing.');
            return false;
        }

        console.error('❌ Failed to initialize OneSignal:', error);
        return false;
    }
}

/**
 * طلب إذن الإشعارات من المستخدم
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isInitialized) {
        console.warn('OneSignal not initialized');
        return false;
    }

    try {
        // التحقق من الإذن الحالي
        const permission = await OneSignal.Notifications.permission;

        if (permission) {
            console.log('Notifications already permitted');
            return true;
        }

        // طلب الإذن
        await OneSignal.Slidedown.promptPush();

        // التحقق من النتيجة
        const newPermission = await OneSignal.Notifications.permission;
        return newPermission;
    } catch (error) {
        console.error('Failed to request notification permission:', error);
        return false;
    }
}

/**
 * تسجيل دخول المستخدم مع OneSignal
 * هذا يربط المستخدم بـ OneSignal Player ID
 */
export async function loginUser(userId: string, userData?: {
    email?: string;
    name?: string;
    role?: 'student' | 'teacher' | 'admin';
}): Promise<void> {
    if (!isInitialized) {
        console.warn('OneSignal not initialized');
        return;
    }

    try {
        // تسجيل الدخول باستخدام External User ID
        await OneSignal.login(userId);

        // إضافة Tags للمستخدم
        if (userData) {
            const tags: Record<string, string> = {};

            if (userData.email) tags.email = userData.email;
            if (userData.name) tags.name = userData.name;
            if (userData.role) tags.role = userData.role;

            await OneSignal.User.addTags(tags);
        }

        console.log('✅ User logged in to OneSignal:', userId);
    } catch (error) {
        console.error('Failed to login user to OneSignal:', error);
    }
}

/**
 * تسجيل خروج المستخدم من OneSignal
 */
export async function logoutUser(): Promise<void> {
    if (!isInitialized) return;

    try {
        await OneSignal.logout();
        console.log('User logged out from OneSignal');
    } catch (error) {
        console.error('Failed to logout from OneSignal:', error);
    }
}

/**
 * إضافة Tag للمستخدم
 * مثلاً: عند الاشتراك في مدرس
 */
export async function addUserTag(key: string, value: string): Promise<void> {
    if (!isInitialized) return;

    try {
        await OneSignal.User.addTag(key, value);
        console.log(`Tag added: ${key}=${value}`);
    } catch (error) {
        console.error('Failed to add tag:', error);
    }
}

/**
 * إزالة Tag من المستخدم
 * مثلاً: عند إلغاء الاشتراك في مدرس
 */
export async function removeUserTag(key: string): Promise<void> {
    if (!isInitialized) return;

    try {
        await OneSignal.User.removeTag(key);
        console.log(`Tag removed: ${key}`);
    } catch (error) {
        console.error('Failed to remove tag:', error);
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

    if (!isInitialized) {
        return { isSupported: true, isPermitted: false, isSubscribed: false };
    }

    try {
        const isSupported = OneSignal.Notifications.isPushSupported();
        const isPermitted = await OneSignal.Notifications.permission;
        const subscription = await OneSignal.User.PushSubscription.optedIn;

        return {
            isSupported,
            isPermitted,
            isSubscribed: subscription || false,
        };
    } catch {
        return { isSupported: true, isPermitted: false, isSubscribed: false };
    }
}
