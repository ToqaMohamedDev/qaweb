/**
 * ============================================================================
 * ONESIGNAL PROVIDER
 * ============================================================================
 * 
 * Provider لتهيئة OneSignal في التطبيق
 * Non-blocking - لن يمنع التطبيق من العمل إذا فشل OneSignal
 * ============================================================================
 */

'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

// ============================================================================
// CONTEXT
// ============================================================================

interface OneSignalContextType {
    isInitialized: boolean;
    isPermitted: boolean;
    isSubscribed: boolean;
    requestPermission: () => Promise<boolean>;
}

const OneSignalContext = createContext<OneSignalContextType>({
    isInitialized: false,
    isPermitted: false,
    isSubscribed: false,
    requestPermission: async () => false,
});

export const useOneSignal = () => useContext(OneSignalContext);

// ============================================================================
// PROVIDER
// ============================================================================

interface OneSignalProviderProps {
    children: ReactNode;
}

export function OneSignalProvider({ children }: OneSignalProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isPermitted, setIsPermitted] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // تهيئة OneSignal عند تحميل التطبيق (في الخلفية - لن يمنع التطبيق)
    useEffect(() => {
        // تأخير التهيئة لضمان تحميل التطبيق أولاً
        // const timeoutId = setTimeout(() => {
        //     initializeOneSignal();
        // }, 2000); // انتظر 2 ثانية بعد تحميل التطبيق

        // return () => clearTimeout(timeoutId);
    }, []);

    const initializeOneSignal = async () => {
        // تشغيل في الخلفية بدون blocking
        try {
            // التحقق من أننا في المتصفح
            if (typeof window === 'undefined') return;

            // Dynamic import لتجنب أي مشاكل SSR
            const { initOneSignal, getNotificationStatus, loginUser } = await import('@/lib/onesignal');

            const success = await initOneSignal();
            setIsInitialized(success);

            if (success) {
                try {
                    const status = await getNotificationStatus();
                    setIsPermitted(status.isPermitted);
                    setIsSubscribed(status.isSubscribed);

                    // ربط المستخدم إذا كان مسجل دخوله - Using API for Vercel compatibility
                    const authRes = await fetch('/api/auth/user?includeProfile=true');
                    const authResult = await authRes.json();

                    if (authResult.success && authResult.data?.user) {
                        const user = authResult.data.user;
                        const profile = authResult.data.profile;

                        await loginUser(user.id, {
                            email: user.email,
                            name: profile?.name ?? undefined,
                            role: profile?.role as 'student' | 'teacher' | 'admin',
                        });
                    }
                } catch (e) {
                    console.warn('OneSignal user setup failed:', e);
                }
            }
        } catch (error) {
            // تجاهل أي خطأ - لن يؤثر على التطبيق
            console.warn('OneSignal initialization skipped:', error);
        }
    };

    // طلب إذن الإشعارات
    const requestPermission = async (): Promise<boolean> => {
        if (!isInitialized) return false;

        try {
            const { requestNotificationPermission } = await import('@/lib/onesignal');
            const granted = await requestNotificationPermission();
            setIsPermitted(granted);
            setIsSubscribed(granted);
            return granted;
        } catch {
            return false;
        }
    };

    // عرض الأطفال مباشرة - لن ننتظر OneSignal
    return (
        <OneSignalContext.Provider
            value={{
                isInitialized,
                isPermitted,
                isSubscribed,
                requestPermission,
            }}
        >
            {children}
        </OneSignalContext.Provider>
    );
}

export default OneSignalProvider;
