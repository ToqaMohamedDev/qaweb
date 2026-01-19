'use client';

// =============================================
// Auth Provider - تهيئة المستخدم عند تحميل التطبيق
// بدون loading screen - الـ SplashScreen هتتكفل بيه
// تم التحسين لدعم Server-Side Hydration
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
    user?: any;    // قادمة من Server Component
    profile?: any; // قادمة من Server Component
}

export function AuthProvider({ children, user, profile }: AuthProviderProps) {
    const { setUser, setLoading } = useAuthStore();
    const initRef = useRef(false);

    useEffect(() => {
        // منع التهيئة المتكررة
        if (initRef.current) return;
        initRef.current = true;

        const initAuth = async () => {
            // 1. Server-Side Hydration (الأولوية للبيانات القادمة من السيرفر)
            // هذا يحل مشكلة HttpOnly cookies التي لا يراها المتصفح
            if (user && profile) {
                console.log('[AuthProvider] Hydrating session from server props');
                setUser(mapDbRowToProfile(profile as UserProfileDBRow));

                // 📱 تتبع الجهاز
                try {
                    const deviceInfo = detectDeviceInfo();
                    // تتبع غير متزامن لا يعطل التطبيق
                    trackDevice({
                        userId: user.id,
                        ...deviceInfo
                    }).catch(err => console.error('[AuthProvider] Device tracking failed:', err));
                } catch (e) {
                    console.error('[AuthProvider] Device tracking setup failed:', e);
                }

                setLoading(false);
                return;
            }

            // 2. Client-Side Fallback (للحالات الأخرى أو عند غياب بروبس السيرفر)
            try {
                const supabase = createClient();

                // جلب الـ session الحالية
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // جلب بيانات الـ profile
                    const { data: fetchedProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (fetchedProfile) {
                        setUser(mapDbRowToProfile(fetchedProfile as UserProfileDBRow));
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

        // الاستماع لتغييرات الـ auth (لتعامل مع تسجيل الخروج أو تبديل الحساب في نفس الجلسة)
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);

                if (event === 'SIGNED_IN' && session?.user) {
                    // في حالة تسجيل الدخول من جديد (Client-side)
                    const deviceInfo = detectDeviceInfo();
                    trackDevice({
                        userId: session.user.id,
                        ...deviceInfo
                    }).catch(() => { });

                    const { data: newProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (newProfile) {
                        setUser(mapDbRowToProfile(newProfile as UserProfileDBRow));
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setLoading, user, profile]);

    // لا نعطّل الـ rendering - الـ SplashScreen هتتكفل بالـ loading
    return <>{children}</>;
}
