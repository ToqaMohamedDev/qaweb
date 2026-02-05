/**
 * useSubscriptions Hook - Fetches and manages teacher subscriptions
 * Uses API routes for Vercel compatibility
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
    
    const isMounted = useRef(true);
    const lastUserId = useRef<string | null>(null);

    // Fetch subscriptions via API
    const fetchSubscriptions = useCallback(async () => {
        if (!userId) {
            setState(prev => ({ ...prev, subscriptions: new Set(), loading: false }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const res = await fetch('/api/subscriptions');
            const result = await res.json();

            if (isMounted.current) {
                if (result.success) {
                    const subscriptionSet = new Set<string>(result.data || []);
                    setState(prev => ({ ...prev, subscriptions: subscriptionSet, loading: false }));
                } else {
                    console.warn('Subscriptions fetch warning:', result.error);
                    setState(prev => ({ ...prev, subscriptions: new Set(), loading: false }));
                }
            }
        } catch (err) {
            console.warn('Subscriptions fetch error:', err);
            if (isMounted.current) {
                setState(prev => ({
                    ...prev,
                    subscriptions: new Set(),
                    loading: false,
                }));
            }
        }
    }, [userId]);

    useEffect(() => {
        isMounted.current = true;
        
        // Only fetch if userId actually changed
        if (userId !== lastUserId.current) {
            lastUserId.current = userId;
            fetchSubscriptions();
        }
        
        return () => {
            isMounted.current = false;
        };
    }, [userId, fetchSubscriptions]);

    // Toggle subscription (subscribe/unsubscribe)
    const toggle = useCallback(async (teacherId: string): Promise<ToggleResult> => {
        if (!userId) {
            return { success: false, error: 'يجب تسجيل الدخول للمتابعة' };
        }

        const isCurrentlySubscribed = state.subscriptions.has(teacherId);

        // Add to subscribingTo for loading state
        setState(prev => ({
            ...prev,
            subscribingTo: new Set([...prev.subscribingTo, teacherId]),
            error: null,
        }));

        try {
            let res: Response;

            if (isCurrentlySubscribed) {
                // Unsubscribe via DELETE
                res = await fetch(`/api/subscriptions?teacherId=${teacherId}`, {
                    method: 'DELETE',
                });
            } else {
                // Subscribe via POST
                res = await fetch('/api/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherId }),
                });
            }

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || 'حدث خطأ');
            }

            // Update local state
            setState(prev => {
                const newSubs = new Set(prev.subscriptions);
                if (isCurrentlySubscribed) {
                    newSubs.delete(teacherId);
                } else {
                    newSubs.add(teacherId);
                }
                const newSubscribing = new Set(prev.subscribingTo);
                newSubscribing.delete(teacherId);
                return { ...prev, subscriptions: newSubs, subscribingTo: newSubscribing };
            });

            // OneSignal tag management (non-blocking)
            try {
                if (isCurrentlySubscribed) {
                    const { unsubscribeFromTeacher } = await import('@/lib/onesignal');
                    await unsubscribeFromTeacher(teacherId);
                } else {
                    const { subscribeToTeacher } = await import('@/lib/onesignal');
                    await subscribeToTeacher(teacherId);
                }
            } catch (e) {
                console.warn('OneSignal tag error:', e);
            }

            return { success: true, newCount: result.newCount };

        } catch (err: any) {
            const errorMsg = err?.message || 'حدث خطأ';

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
