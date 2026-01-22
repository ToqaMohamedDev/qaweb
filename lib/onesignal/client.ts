/**
 * ============================================================================
 * ONESIGNAL CLIENT UTILITIES - OPTIMIZED VERSION
 * ============================================================================
 * 
 * دوال التعامل مع OneSignal في المتصفح (Client-side)
 * 
 * المبادئ:
 * - Init مرة واحدة فقط
 * - Login مرة واحدة فقط لكل مستخدم
 * - Tags update مرة واحدة فقط عند تغيير البيانات
 * - استخدام localStorage لتتبع حالة المستخدم عبر الجلسات
 * ============================================================================
 */

'use client';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'onesignal_synced_user';
const STORAGE_TAGS_HASH_KEY = 'onesignal_tags_hash';

// ============================================================================
// MODULE STATE (singleton pattern)
// ============================================================================

let isInitialized = false;
let initializationInProgress = false;
interface OneSignalEvent {
    notification?: {
        launchURL?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let OneSignalInstance: any = null;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * إنشاء hash بسيط للبيانات لمقارنتها
 */
function simpleHash(data: Record<string, string>): string {
    return JSON.stringify(Object.entries(data).sort());
}

/**
 * الحصول على آخر مستخدم تم مزامنته من localStorage
 */
function getLastSyncedUser(): { userId: string; tagsHash: string } | null {
    if (typeof window === 'undefined') return null;

    try {
        const userId = localStorage.getItem(STORAGE_KEY);
        const tagsHash = localStorage.getItem(STORAGE_TAGS_HASH_KEY) || '';
        return userId ? { userId, tagsHash } : null;
    } catch {
        return null;
    }
}

/**
 * حفظ معرف المستخدم المتزامن في localStorage
 */
function setSyncedUser(userId: string, tagsHash: string): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, userId);
        localStorage.setItem(STORAGE_TAGS_HASH_KEY, tagsHash);
    } catch {
        // ignore storage errors
    }
}

/**
 * مسح بيانات المستخدم المتزامن
 */
function clearSyncedUser(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TAGS_HASH_KEY);
    } catch {
        // ignore storage errors
    }
}

/**
 * Helper function to delay execution
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * تهيئة OneSignal
 * يتم استدعاؤها مرة واحدة فقط - أي استدعاءات إضافية ستُرجع النتيجة المحفوظة
 */
export async function initOneSignal(): Promise<boolean> {
    // إذا كانت التهيئة اكتملت، نُرجع true
    if (isInitialized) {
        return true;
    }

    // إذا كانت التهيئة قيد التنفيذ، ننتظر
    if (initializationInProgress) {
        // انتظار حتى تكتمل التهيئة
        let attempts = 0;
        while (initializationInProgress && attempts < 50) {
            await delay(100);
            attempts++;
        }
        return isInitialized;
    }

    // بدء التهيئة
    initializationInProgress = true;

    // التحقق من أننا في المتصفح
    if (typeof window === 'undefined') {
        initializationInProgress = false;
        return false;
    }

    try {
        // Dynamic import to avoid SSR issues
        const OneSignalModule = await import('react-onesignal');
        OneSignalInstance = OneSignalModule.default as typeof OneSignalInstance;

        const { ONESIGNAL_APP_ID, validateOneSignalConfig } = await import('./config');

        // التحقق من الإعدادات
        if (!validateOneSignalConfig()) {
            console.warn('⚠️ OneSignal config is not valid');
            initializationInProgress = false;
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

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = String(error);
        
        // تجاهل خطأ "already initialized"
        if (errorMessage.includes('already initialized') ||
            errorString.includes('already initialized')) {
            isInitialized = true;
            return true;
        }

        // تسجيل خطأ domain restriction بدون كسر التطبيق
        if (errorMessage.includes('Can only be used on')) {
            console.warn('⚠️ OneSignal: Domain not allowed.');
            return false;
        }

        // أي خطأ آخر - نتجاهله ونستمر
        console.warn('⚠️ OneSignal init failed (non-blocking):', errorMessage);
        return false;

    } finally {
        initializationInProgress = false;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * إعداد Event Listeners - يتم استدعاؤها مرة واحدة فقط عند init
 */
function setupEventListeners(): void {
    if (!OneSignalInstance) return;

    try {
        // استماع لتغيير حالة الاشتراك
        OneSignalInstance.User.PushSubscription.addEventListener('change', (event: OneSignalEvent) => {
            console.log('📱 Push subscription changed:', event);
        });

        // استماع للإشعارات الواردة (عندما يكون التطبيق مفتوح)
        OneSignalInstance.Notifications.addEventListener('foregroundWillDisplay', (event: OneSignalEvent) => {
            console.log('📩 Notification received in foreground:', event.notification);
        });

        // استماع للنقر على الإشعار
        OneSignalInstance.Notifications.addEventListener('click', (event: OneSignalEvent) => {
            console.log('👆 Notification clicked:', event.notification);
            const url = event.notification?.launchURL;
            if (url && typeof window !== 'undefined') {
                window.location.href = url;
            }
        });
    } catch (error) {
        console.warn('⚠️ Failed to setup OneSignal event listeners:', error);
    }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * تسجيل دخول المستخدم مع OneSignal
 * 
 * هذه الدالة ذكية:
 * - لن تفعل شيء إذا كان نفس المستخدم مسجل بنفس البيانات
 * - ستُحدث البيانات فقط إذا تغيرت
 */
export async function loginUser(userId: string, userData?: {
    email?: string;
    name?: string;
    role?: 'student' | 'teacher' | 'admin';
    stage_id?: string;
}): Promise<void> {
    if (!isInitialized || !OneSignalInstance) {
        console.warn('⚠️ OneSignal not initialized, skipping login');
        return;
    }

    try {
        // بناء الـ tags
        const tags: Record<string, string> = { user_id: userId };
        if (userData?.email) tags.email = userData.email;
        if (userData?.name) tags.name = userData.name;
        if (userData?.role) tags.role = userData.role;
        if (userData?.stage_id) tags.stage_id = userData.stage_id;

        const currentTagsHash = simpleHash(tags);
        const lastSynced = getLastSyncedUser();

        // التحقق: هل نفس المستخدم بنفس البيانات؟
        if (lastSynced?.userId === userId && lastSynced?.tagsHash === currentTagsHash) {
            console.log('ℹ️ OneSignal: User already synced with same data, skipping');
            return;
        }

        // التحقق من OneSignal's current state
        const currentExternalId = OneSignalInstance.User?.externalId;

        // هل نحتاج login؟
        if (currentExternalId !== userId) {
            console.log('🔄 OneSignal: Logging in user:', userId);
            await OneSignalInstance.login(userId);

            // انتظار قصير للسماح لـ OneSignal بتحديث حالته الداخلية
            await delay(300);
        }

        // هل نحتاج تحديث tags؟
        if (lastSynced?.tagsHash !== currentTagsHash) {
            console.log('🔄 OneSignal: Updating user tags');

            try {
                await OneSignalInstance.User.addTags(tags);
                console.log('✅ OneSignal: User tags updated');
            } catch (tagError: unknown) {
                // تجاهل أخطاء 409 - غير مؤثرة
                if (!String(tagError).includes('409')) {
                    console.warn('⚠️ OneSignal: Tag update failed (non-blocking):', tagError);
                }
            }
        }

        // حفظ حالة المزامنة
        setSyncedUser(userId, currentTagsHash);
        console.log('✅ OneSignal: User synced:', userId);

    } catch (error: unknown) {
        const errorString = String(error);
        // تجاهل أخطاء 409 Conflict تماماً
        if (errorString.includes('409') || errorString.includes('Conflict')) {
            console.log('ℹ️ OneSignal: Conflict ignored (user switch in progress)');
            return;
        }
        console.warn('⚠️ OneSignal: Login failed (non-blocking):', error);
    }
}

/**
 * تسجيل خروج المستخدم من OneSignal
 */
export async function logoutUser(): Promise<void> {
    if (!isInitialized || !OneSignalInstance) return;

    try {
        clearSyncedUser();
        await OneSignalInstance.logout();
        console.log('✅ OneSignal: User logged out');
    } catch (error) {
        console.warn('⚠️ OneSignal: Logout failed (non-blocking):', error);
    }
}

// ============================================================================
// NOTIFICATION PERMISSION
// ============================================================================

/**
 * طلب إذن الإشعارات من المستخدم
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isInitialized || !OneSignalInstance) {
        console.warn('⚠️ OneSignal not initialized');
        return false;
    }

    try {
        const permission = await OneSignalInstance.Notifications.permission;

        if (permission) {
            console.log('ℹ️ Notifications already permitted');
            return true;
        }

        await OneSignalInstance.Slidedown.promptPush();
        const newPermission = await OneSignalInstance.Notifications.permission;
        return newPermission;
    } catch (error) {
        console.warn('⚠️ Failed to request notification permission:', error);
        return false;
    }
}

// ============================================================================
// TAGS MANAGEMENT
// ============================================================================

/**
 * إضافة Tag للمستخدم
 */
export async function addUserTag(key: string, value: string): Promise<void> {
    if (!isInitialized || !OneSignalInstance) return;

    try {
        await OneSignalInstance.User.addTag(key, value);
    } catch (error) {
        console.warn('⚠️ Failed to add tag:', error);
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
        console.warn('⚠️ Failed to remove tag:', error);
    }
}

// ============================================================================
// TEACHER SUBSCRIPTION
// ============================================================================

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

// ============================================================================
// STATUS
// ============================================================================

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
