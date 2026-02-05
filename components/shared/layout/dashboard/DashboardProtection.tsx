'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Protection - حماية موحدة لـ Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
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
    const { user, isLoading } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (isLoading) return;

        setIsChecking(false);

        if (!user) {
            console.log(`[${config.role}Protection] No user in store, redirecting to login`);
            router.push(`/login?redirect=${config.loginRedirect}`);
            return;
        }

        if (!config.allowedRoles.includes(user.role)) {
            console.log(`[${config.role}Protection] User role not allowed:`, user.role);
            router.push('/');
            return;
        }

        console.log(`[${config.role}Protection] ✅ User verified:`, user.email);
    }, [user, isLoading, router, config, mounted]);

    if (!mounted || isLoading || isChecking) {
        return <LoadingSpinner gradient={config.logoGradient} />;
    }

    if (!user || !config.allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
