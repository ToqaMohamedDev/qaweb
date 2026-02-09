/**
 * Get Authenticated User Helper
 * 
 * This helper provides a reliable way to get the current user
 * that works on both localhost and Vercel (with HttpOnly cookies).
 * 
 * Usage:
 * - In Client Components: use useAuthStore() directly
 * - In useEffect/callbacks: use this helper
 */

import { useAuthStore } from '@/lib/stores/useAuthStore';

export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role?: string;
    avatarUrl?: string | null;
}

/**
 * Get user from the auth store synchronously
 * Best for use in event handlers and effects
 */
export function getAuthUser(): AuthUser | null {
    const state = useAuthStore.getState();
    if (!state.user) return null;

    return {
        id: state.user.id,
        email: state.user.email || '',
        name: state.user.name,
        role: state.user.role,
        avatarUrl: state.user.avatarUrl,
    };
}

/**
 * Check if the current user is authenticated
 */
export function isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
}

/**
 * Get user ID only (common use case)
 */
export function getAuthUserId(): string | null {
    return useAuthStore.getState().user?.id || null;
}

/**
 * Wait for auth to be ready and return user
 * Useful when you need to ensure auth is loaded before proceeding
 */
export async function waitForAuth(timeoutMs: number = 5000): Promise<AuthUser | null> {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const checkAuth = () => {
            const state = useAuthStore.getState();

            // If not loading, we have our answer
            if (!state.isLoading) {
                resolve(state.user ? {
                    id: state.user.id,
                    email: state.user.email || '',
                    name: state.user.name,
                    role: state.user.role,
                    avatarUrl: state.user.avatarUrl,
                } : null);
                return;
            }

            // Check timeout
            if (Date.now() - startTime > timeoutMs) {
                resolve(null);
                return;
            }

            // Keep checking
            setTimeout(checkAuth, 100);
        };

        checkAuth();
    });
}

/**
 * Fetch user from API (for cases where store might not be populated yet)
 * This makes a server call to get the session
 */
export async function fetchAuthUser(): Promise<AuthUser | null> {
    try {
        const res = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.user) return null;

        return {
            id: data.user.id,
            email: data.user.email || '',
            name: data.profile?.name || data.user.user_metadata?.name,
            role: data.profile?.role,
            avatarUrl: data.profile?.avatar_url || data.user.user_metadata?.avatar_url,
        };
    } catch {
        return null;
    }
}
