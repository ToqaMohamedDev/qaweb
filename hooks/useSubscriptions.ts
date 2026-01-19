/**
 * useSubscriptions Hook - Fetches and manages teacher subscriptions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

interface SubscriptionState {
    subscriptions: Set<string>;
    subscribingTo: Set<string>;
    error: string | null;
    loading: boolean;
}

interface ToggleResult {
    success: boolean;
    newCount?: number;
    error?: string;
}

export function useSubscriptions(userId: string | null) {
    const [state, setState] = useState<SubscriptionState>({
        subscriptions: new Set(),
        subscribingTo: new Set(),
        error: null,
        loading: false,
    });

    // Fetch subscriptions on mount or user change
    const fetchSubscriptions = useCallback(async () => {
        if (!userId) {
            setState(prev => ({ ...prev, subscriptions: new Set(), loading: false }));
            return;
        }

        const supabase = createClient();
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { data, error } = await supabase
                .from('teacher_subscriptions')
                .select('teacher_id')
                .eq('user_id', userId);

            if (error) {
                // Handle RLS permission error gracefully
                if (error.code === '42501' || error.message?.includes('permission')) {
                    console.warn('Subscriptions: RLS policy issue. Run fix-rls-all-tables.sql');
                    setState(prev => ({ ...prev, subscriptions: new Set(), loading: false }));
                    return;
                }
                throw error;
            }

            const subscriptionSet = new Set(data?.map(s => s.teacher_id) || []);
            setState(prev => ({ ...prev, subscriptions: subscriptionSet, loading: false }));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.warn('Subscriptions fetch error:', errorMsg);
            // Don't block UI - just show empty subscriptions
            setState(prev => ({
                ...prev,
                subscriptions: new Set(),
                loading: false,
            }));
        }
    }, [userId]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    // Toggle subscription (subscribe/unsubscribe)
    const toggle = useCallback(async (teacherId: string): Promise<ToggleResult> => {
        if (!userId) {
            return { success: false, error: 'يجب تسجيل الدخول للمتابعة' };
        }

        const isCurrentlySubscribed = state.subscriptions.has(teacherId);
        const supabase = createClient();

        // Add to subscribingTo for loading state
        setState(prev => ({
            ...prev,
            subscribingTo: new Set([...prev.subscribingTo, teacherId]),
            error: null,
        }));

        try {
            if (isCurrentlySubscribed) {
                // Unsubscribe
                const { error } = await supabase
                    .from('teacher_subscriptions')
                    .delete()
                    .eq('user_id', userId)
                    .eq('teacher_id', teacherId);

                if (error) throw error;

                // Update local state
                setState(prev => {
                    const newSubs = new Set(prev.subscriptions);
                    newSubs.delete(teacherId);
                    const newSubscribing = new Set(prev.subscribingTo);
                    newSubscribing.delete(teacherId);
                    return { ...prev, subscriptions: newSubs, subscribingTo: newSubscribing };
                });

                // إزالة Tag من OneSignal
                try {
                    const { unsubscribeFromTeacher } = await import('@/lib/onesignal');
                    await unsubscribeFromTeacher(teacherId);
                } catch (e) {
                    console.warn('Failed to remove OneSignal tag:', e);
                }

                // Get new count
                const { count } = await supabase
                    .from('teacher_subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', teacherId);

                return { success: true, newCount: count || 0 };
            } else {
                // Subscribe
                const { error } = await supabase
                    .from('teacher_subscriptions')
                    .insert({
                        user_id: userId,
                        teacher_id: teacherId,
                    });

                if (error) throw error;

                // Update local state
                setState(prev => {
                    const newSubs = new Set(prev.subscriptions);
                    newSubs.add(teacherId);
                    const newSubscribing = new Set(prev.subscribingTo);
                    newSubscribing.delete(teacherId);
                    return { ...prev, subscriptions: newSubs, subscribingTo: newSubscribing };
                });

                // إضافة Tag لـ OneSignal للإشعارات
                try {
                    const { subscribeToTeacher } = await import('@/lib/onesignal');
                    await subscribeToTeacher(teacherId);
                } catch (e) {
                    console.warn('Failed to add OneSignal tag:', e);
                }

                // Get new count
                const { count } = await supabase
                    .from('teacher_subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('teacher_id', teacherId);

                return { success: true, newCount: count || 0 };
            }
        } catch (err: any) {
            // Better error extraction
            let errorMsg = 'حدث خطأ';
            if (err instanceof Error) {
                errorMsg = err.message;
            } else if (err?.message) {
                errorMsg = err.message;
            } else if (err?.code === '42501' || String(err).includes('permission')) {
                errorMsg = 'لا توجد صلاحيات - يرجى تسجيل الدخول';
                console.warn('Subscription RLS error. Run fix-rls scripts.');
            } else {
                console.warn('Unknown subscription error:', JSON.stringify(err));
            }

            setState(prev => {
                const newSubscribing = new Set(prev.subscribingTo);
                newSubscribing.delete(teacherId);
                return { ...prev, subscribingTo: newSubscribing, error: errorMsg };
            });

            return { success: false, error: errorMsg };
        }
    }, [userId, state.subscriptions]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const isSubscribed = useCallback((teacherId: string) => {
        return state.subscriptions.has(teacherId);
    }, [state.subscriptions]);

    return {
        subscriptions: state.subscriptions,
        subscribingTo: state.subscribingTo,
        loading: state.loading,
        error: state.error,
        toggle,
        clearError,
        isSubscribed,
        refetch: fetchSubscriptions,
    };
}
