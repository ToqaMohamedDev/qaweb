/**
 * ============================================================================
 * ONESIGNAL PROVIDER
 * ============================================================================
 * 
 * Provider لتهيئة OneSignal في التطبيق
 * يجب وضعه في layout.tsx
 * ============================================================================
 */

'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { initOneSignal, loginUser, logoutUser, getNotificationStatus } from '@/lib/onesignal';
import { getSupabaseClient } from '@/lib/supabase-client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

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

    // تهيئة OneSignal عند تحميل التطبيق
    useEffect(() => {
        const supabase = getSupabaseClient();

        const initialize = async () => {
            const success = await initOneSignal();
            setIsInitialized(success);

            if (success) {
                // التحقق من حالة الإشعارات
                const status = await getNotificationStatus();
                setIsPermitted(status.isPermitted);
                setIsSubscribed(status.isSubscribed);

                // ربط المستخدم إذا كان مسجل دخوله
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // جلب بيانات المستخدم
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('name, role')
                        .eq('id', user.id)
                        .single();

                    await loginUser(user.id, {
                        email: user.email,
                        name: profile?.name ?? undefined,
                        role: profile?.role as 'student' | 'teacher' | 'admin',
                    });
                }
            }
        };

        initialize();

        // الاستماع لتغييرات حالة تسجيل الدخول
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // جلب بيانات المستخدم
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name, role')
                    .eq('id', session.user.id)
                    .single();

                await loginUser(session.user.id, {
                    email: session.user.email,
                    name: profile?.name ?? undefined,
                    role: profile?.role as 'student' | 'teacher' | 'admin',
                });
            } else if (event === 'SIGNED_OUT') {
                await logoutUser();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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
