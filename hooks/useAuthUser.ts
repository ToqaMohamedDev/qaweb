/**
 * useAuthUser Hook
 * Unified hook for getting authenticated user via API
 * Use this instead of direct supabase.auth.getUser() in client components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================
// Types
// =============================================

export interface AuthUser {
    id: string;
    email: string | undefined;
    phone: string | undefined;
    created_at: string;
}

export interface AuthProfile {
    id: string;
    name: string;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    is_verified: boolean;
    is_teacher_approved: boolean;
    role: string | null;
    [key: string]: any;
}

export interface UseAuthUserReturn {
    user: AuthUser | null;
    profile: AuthProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// =============================================
// Hook
// =============================================

export function useAuthUser(options: { includeProfile?: boolean } = {}): UseAuthUserReturn {
    const { includeProfile = false } = options;

    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<AuthProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const url = includeProfile
                ? '/api/auth/user?includeProfile=true'
                : '/api/auth/user';

            const res = await fetch(url);
            const result = await res.json();

            if (result.success) {
                setUser(result.data.user);
                setProfile(result.data.profile);
            } else {
                setUser(null);
                setProfile(null);
                if (result.error) {
                    setError(result.error);
                }
            }
        } catch (err) {
            console.error('Error fetching auth user:', err);
            setUser(null);
            setProfile(null);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [includeProfile]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return {
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        error,
        refetch: fetchUser,
    };
}

// =============================================
// Utility: Get user ID only (for quick checks)
// =============================================

export function useUserId(): { userId: string | null; isLoading: boolean } {
    const { user, isLoading } = useAuthUser();
    return { userId: user?.id ?? null, isLoading };
}

// =============================================
// Default export
// =============================================

export default useAuthUser;
