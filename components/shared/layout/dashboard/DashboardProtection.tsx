'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Protection - حماية موحدة لـ Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { createClient } from '@/lib/supabase';
import type { DashboardProtectionProps } from './types';

function LoadingSpinner({ gradient }: { gradient: string }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className={`w-16 h-16 border-4 border-opacity-20 ${gradient.includes('primary') ? 'border-primary-200 dark:border-primary-900' : 'border-purple-200 dark:border-purple-900'} rounded-full`} />
                    <div className={`absolute inset-0 w-16 h-16 border-4 ${gradient.includes('primary') ? 'border-primary-500' : 'border-purple-500'} border-t-transparent rounded-full animate-spin`} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">جاري التحقق من الصلاحيات...</p>
            </div>
        </div>
    );
}

export function DashboardProtection({ children, config }: DashboardProtectionProps) {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthorized'>('checking');
    const [mounted, setMounted] = useState(false);
    const checkRef = useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (checkRef.current) return;
        checkRef.current = true;

        const verifyAuth = async () => {
            console.log(`[${config.role}Protection] Starting auth verification...`);

            // 1. If we already have user in Zustand with correct role, proceed immediately
            if (user && config.allowedRoles.includes(user.role)) {
                console.log(`[${config.role}Protection] ✅ User already in store:`, user.email);
                setAuthState('authenticated');
                return;
            }

            // 2. Try API session first (most reliable on Vercel)
            try {
                const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();

                    if (sessionData.user && sessionData.profile) {
                        const userRole = sessionData.profile.role;

                        if (config.allowedRoles.includes(userRole)) {
                            console.log(`[${config.role}Protection] ✅ Verified via API:`, sessionData.user.email);
                            setAuthState('authenticated');
                            return;
                        } else {
                            console.log(`[${config.role}Protection] ❌ Role not allowed:`, userRole);
                            router.push('/');
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error(`[${config.role}Protection] API session check failed:`, e);
            }

            // 3. Fallback: Try Supabase client directly
            try {
                const supabase = createClient();
                const { data: { user: supabaseUser } } = await supabase.auth.getUser();

                if (supabaseUser) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', supabaseUser.id)
                        .single();

                    if (profile?.role && config.allowedRoles.includes(profile.role)) {
                        console.log(`[${config.role}Protection] ✅ Verified via Supabase client`);
                        setAuthState('authenticated');
                        return;
                    }
                }
            } catch (e) {
                console.error(`[${config.role}Protection] Supabase check failed:`, e);
            }

            // 4. No valid session found
            console.log(`[${config.role}Protection] ❌ No valid session, redirecting to login`);
            router.push(`/login?redirect=${config.loginRedirect}`);
        };

        verifyAuth();
    }, [mounted, user, config, router, setUser]);

    if (!mounted || authState === 'checking') {
        return <LoadingSpinner gradient={config.logoGradient} />;
    }

    if (authState === 'unauthorized') {
        return null;
    }

    return <>{children}</>;
}

