// =============================================
// useAuth Hook - إدارة حالة المصادقة
// Now uses useAuthStore for centralized state
// =============================================

'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import type { UserProfile } from '@/lib/types';

export interface UseAuthReturn {
    user: UserProfile | null;
    profile: UserProfile | null; // Same as user for backwards compatibility
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const { user, isLoading, error, isAuthenticated, logout, refreshUser: storeRefresh } = useAuthStore();

    const signOut = useCallback(async () => {
        try {
            await logout();
            // Also call the API to clear server-side cookies
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
        } catch (err) {
            console.error('Sign out error:', err);
        }
    }, [logout]);

    const refreshUser = useCallback(async () => {
        await storeRefresh();
    }, [storeRefresh]);

    return {
        user,
        profile: user, // Backwards compatibility
        isLoading,
        isAuthenticated,
        error,
        signOut,
        refreshUser,
    };
}
