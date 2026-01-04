'use client';

// =============================================
// Auth Provider - تهيئة المستخدم عند تحميل التطبيق
// بدون loading screen - الـ SplashScreen هتتكفل بيه
// =============================================

import { useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { createClient } from '@/lib/supabase';
import type { UserProfileDBRow } from '@/lib/types';
import { mapDbRowToProfile } from '@/lib/types/user';
import { trackDevice } from '@/lib/actions';
import { detectDeviceInfo } from '@/lib/services';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { setUser, setLoading } = useAuthStore();
    const initRef = useRef(false);

    useEffect(() => {
        // منع التهيئة المتكررة
        if (initRef.current) return;
        initRef.current = true;

        const initAuth = async () => {
            try {
                const supabase = createClient();

                // جلب الـ session الحالية
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // جلب بيانات الـ profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setUser(mapDbRowToProfile(profile as UserProfileDBRow));
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // الاستماع لتغييرات الـ auth
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);

                if (event === 'SIGNED_IN' && session?.user) {
                    console.log('[AuthProvider] SIGNED_IN detected, calling trackDevice...');
                    // 📱 تتبع الجهاز عند تسجيل الدخول
                    const deviceInfo = detectDeviceInfo();
                    trackDevice({
                        userId: session.user.id,
                        ...deviceInfo
                    })
                        .then(result => {
                            console.log('[AuthProvider] trackDevice result:', result);
                        })
                        .catch(err => {
                            console.error('[AuthProvider] Device tracking failed:', err);
                        });

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setUser(mapDbRowToProfile(profile as UserProfileDBRow));
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setLoading]);

    // لا نعطّل الـ rendering - الـ SplashScreen هتتكفل بالـ loading
    return <>{children}</>;
}
