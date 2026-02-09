'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Protection - حماية موحدة لـ Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
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
    const { user, isLoading: authLoading } = useAuthStore();
    const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthorized'>('checking');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Safety timeout - never wait more than 6 seconds
        const safetyTimeout = setTimeout(() => {
            console.warn(`[${config.role}Protection] Safety timeout - forcing check`);
            performAuthCheck();
        }, 6000);

        const performAuthCheck = async () => {
            console.log(`[${config.role}Protection] Starting auth check...`);
            console.log(`[${config.role}Protection] Zustand user:`, user?.email, 'role:', user?.role);
            console.log(`[${config.role}Protection] authLoading:`, authLoading);

            // IMPORTANT: Always verify session via API to ensure cookies are valid
            // Don't trust Zustand store alone as session may have expired
            console.log(`[${config.role}Protection] Verifying session via API...`);

            try {
                const sessionRes = await fetch('/api/auth/session', {
                    cache: 'no-store',
                    credentials: 'include',
                    headers: { 'Cache-Control': 'no-cache' }
                });

                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    console.log(`[${config.role}Protection] API response:`, sessionData.user?.email, sessionData.profile?.role);

                    if (sessionData.user && sessionData.profile) {
                        const userRole = sessionData.profile.role;

                        if (config.allowedRoles.includes(userRole)) {
                            console.log(`[${config.role}Protection] ✅ Verified via API`);
                            clearTimeout(safetyTimeout);
                            setAuthState('authenticated');
                            return;
                        } else {
                            console.log(`[${config.role}Protection] ❌ Role not allowed:`, userRole);
                            clearTimeout(safetyTimeout);
                            router.push('/');
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error(`[${config.role}Protection] API check failed:`, e);
            }

            // 4. Fallback: Try Supabase client directly
            try {
                const supabase = createClient();
                const { data: { user: supabaseUser } } = await supabase.auth.getUser();

                if (supabaseUser) {
                    console.log(`[${config.role}Protection] Found Supabase user:`, supabaseUser.email);
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', supabaseUser.id)
                        .single();

                    if (profile?.role && config.allowedRoles.includes(profile.role)) {
                        console.log(`[${config.role}Protection] ✅ Verified via Supabase client`);
                        clearTimeout(safetyTimeout);
                        setAuthState('authenticated');
                        return;
                    }
                }
            } catch (e) {
                console.error(`[${config.role}Protection] Supabase check failed:`, e);
            }

            // 5. No valid session found
            console.log(`[${config.role}Protection] ❌ No valid session, redirecting to login`);
            clearTimeout(safetyTimeout);
            router.push(`/login?redirect=${config.loginRedirect}`);
        };

        performAuthCheck();

        return () => clearTimeout(safetyTimeout);
    }, [mounted, user, authLoading, config, router]);

    if (!mounted || authState === 'checking') {
        return <LoadingSpinner gradient={config.logoGradient} />;
    }

    if (authState === 'unauthorized') {
        return null;
    }

    return <>{children}</>;
}
