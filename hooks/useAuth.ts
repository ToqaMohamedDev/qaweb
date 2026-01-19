// =============================================
// useAuth Hook - إدارة حالة المصادقة
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient, getProfile, signOut as authSignOut } from '@/lib/supabase';
import type { UserProfile } from '@/lib/types';

export interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

export interface UseAuthReturn extends AuthState {
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
    });

    const fetchUserData = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                // If session is corrupted, clear localStorage and reset
                if (error.message.includes('Cannot create property') ||
                    error.message.includes('JSON') ||
                    error.name === 'TypeError') {
                    console.warn('Corrupted session detected, clearing localStorage...');
                    if (typeof window !== 'undefined') {
                        // Clear all Supabase-related localStorage items
                        Object.keys(localStorage).forEach(key => {
                            if (key.includes('supabase') || key.includes('sb-')) {
                                localStorage.removeItem(key);
                            }
                        });
                    }
                }
                setState({
                    user: null,
                    profile: null,
                    isLoading: false,
                    isAuthenticated: false,
                    error: error.message,
                });
                return;
            }

            if (user) {
                const profile = await getProfile(user.id);
                const profileData = profile as any; // Use any for fields not in DB type yet
                setState({
                    user,
                    profile: profile ? {
                        id: profile.id,
                        email: profile.email,
                        name: profile.name || '',
                        role: profile.role || 'student',
                        avatarUrl: profile.avatar_url,
                        bio: profile.bio,
                        specialization: profileData?.specialization || null,
                        isVerified: profileData?.is_verified || false,
                        subscriberCount: profile.subscriber_count || 0,
                        educationalStageId: profileData?.educational_stage_id || null,
                        isTeacherApproved: profile.is_teacher_approved ?? false,
                        roleSelected: profile.role_selected ?? true,
                        createdAt: profile.created_at || new Date().toISOString(),
                        updatedAt: profile.updated_at || new Date().toISOString(),
                    } : null,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });
            } else {
                setState({
                    user: null,
                    profile: null,
                    isLoading: false,
                    isAuthenticated: false,
                    error: null,
                });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication error';

            // Clear corrupted session data
            if (err instanceof TypeError || (err instanceof Error && err.message.includes('Cannot create property'))) {
                console.warn('Auth error - clearing corrupted session data...');
                if (typeof window !== 'undefined') {
                    Object.keys(localStorage).forEach(key => {
                        if (key.includes('supabase') || key.includes('sb-')) {
                            localStorage.removeItem(key);
                        }
                    });
                }
            }

            setState({
                user: null,
                profile: null,
                isLoading: false,
                isAuthenticated: false,
                error: message,
            });
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await authSignOut();
            setState({
                user: null,
                profile: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign out error';
            setState(prev => ({ ...prev, error: message }));
        }
    }, []);

    const refreshUser = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        await fetchUserData();
    }, [fetchUserData]);

    useEffect(() => {
        fetchUserData();

        // Listen for auth changes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchUserData();
            } else {
                setState({
                    user: null,
                    profile: null,
                    isLoading: false,
                    isAuthenticated: false,
                    error: null,
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchUserData]);

    return {
        ...state,
        signOut,
        refreshUser,
    };
}
