// =============================================
// Auth Store - إدارة حالة المستخدم والتوثيق
// =============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase';
import type { UserProfile, UserProfileDBRow } from '@/lib/types';
import { mapDbRowToProfile } from '@/lib/types/user';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AuthState {
    // البيانات
    user: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;

    // الإجراءات
    setUser: (user: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // عمليات التوثيق
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;

    // إعادة تعيين
    reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialState = {
    user: null,
    isLoading: true, // تبدأ بـ true لأن AuthProvider سيقوم بالتهيئة
    error: null,
    isAuthenticated: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // الحالة الابتدائية
            ...initialState,

            // ─── Setters ───
            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                error: null
            }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            // ─── Login ───
            login: async (email, password) => {
                const supabase = createClient();
                set({ isLoading: true, error: null });

                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error) throw error;

                    if (data.user) {
                        // جلب بيانات الملف الشخصي
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', data.user.id)
                            .single();

                        set({
                            user: mapDbRowToProfile(profile as UserProfileDBRow),
                            isAuthenticated: true,
                            isLoading: false
                        });
                        return true;
                    }

                    set({ isLoading: false });
                    return false;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'فشل تسجيل الدخول',
                        isLoading: false
                    });
                    return false;
                }
            },

            // ─── Logout ───
            logout: async () => {
                const supabase = createClient();
                set({ isLoading: true });

                try {
                    await supabase.auth.signOut();
                    set({ ...initialState });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'فشل تسجيل الخروج',
                        isLoading: false
                    });
                }
            },

            // ─── Refresh User ───
            refreshUser: async () => {
                const supabase = createClient();

                try {
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', user.id)
                            .single();

                        set({
                            user: mapDbRowToProfile(profile as UserProfileDBRow),
                            isAuthenticated: true
                        });
                    } else {
                        set({ user: null, isAuthenticated: false });
                    }
                } catch {
                    set({ user: null, isAuthenticated: false });
                }
            },

            // ─── Reset ───
            reset: () => set(initialState),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            // Handle corrupted storage data gracefully
            merge: (persistedState, currentState) => {
                // If persisted state is invalid, use current state
                if (!persistedState || typeof persistedState !== 'object') {
                    return currentState;
                }
                try {
                    return {
                        ...currentState,
                        ...(persistedState as Partial<AuthState>),
                    };
                } catch {
                    // If merge fails, use current state
                    return currentState;
                }
            },
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsAdmin = (state: AuthState) => state.user?.role === 'admin';
export const selectIsTeacher = (state: AuthState) => state.user?.role === 'teacher';
export const selectIsApprovedTeacher = (state: AuthState) =>
    state.user?.role === 'teacher' && state.user?.isTeacherApproved === true;
export const selectNeedsRoleSelection = (state: AuthState) =>
    state.user && !state.user.roleSelected;
