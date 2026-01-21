/**
 * ============================================================================
 * useNotificationPreferences Hook
 * ============================================================================
 * 
 * Hook لإدارة تفضيلات الإشعارات للمستخدم
 * يتعامل مع:
 * - حالة الإشعارات
 * - اشتراكات المعلمين
 * - تفضيلات الإشعارات المختلفة (امتحانات، نتائج، إلخ)
 * ============================================================================
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useOneSignal } from '@/components/providers/OneSignalProvider';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPreferences {
    // Push notification settings
    pushEnabled: boolean;

    // Notification types
    newExams: boolean;
    examResults: boolean;
    teacherUpdates: boolean;
    systemNotifications: boolean;
    promotions: boolean;
}

export interface TeacherSubscription {
    teacherId: string;
    teacherName: string;
    subscribedAt: string;
}

export interface UseNotificationPreferencesReturn {
    // Status
    isLoading: boolean;
    isSupported: boolean;
    isPermitted: boolean;
    isSubscribed: boolean;
    error: string | null;

    // Preferences
    preferences: NotificationPreferences;

    // Teacher subscriptions
    teacherSubscriptions: TeacherSubscription[];

    // Actions
    enableNotifications: () => Promise<boolean>;
    disableNotifications: () => Promise<void>;
    updatePreference: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
    subscribeToTeacher: (teacherId: string, teacherName: string) => Promise<void>;
    unsubscribeFromTeacher: (teacherId: string) => Promise<void>;
    isSubscribedToTeacher: (teacherId: string) => boolean;
    refreshStatus: () => Promise<void>;
}

// Default preferences
const defaultPreferences: NotificationPreferences = {
    pushEnabled: false,
    newExams: true,
    examResults: true,
    teacherUpdates: true,
    systemNotifications: true,
    promotions: false,
};

// ============================================================================
// HOOK
// ============================================================================

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
    const oneSignal = useOneSignal();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [teacherSubscriptions, setTeacherSubscriptions] = useState<TeacherSubscription[]>([]);

    // ========================================================================
    // Load saved preferences from localStorage
    // ========================================================================
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const savedPrefs = localStorage.getItem('notification_preferences');
            if (savedPrefs) {
                setPreferences(JSON.parse(savedPrefs));
            }

            const savedSubs = localStorage.getItem('teacher_subscriptions');
            if (savedSubs) {
                setTeacherSubscriptions(JSON.parse(savedSubs));
            }
        } catch (err) {
            console.warn('Failed to load notification preferences:', err);
        }
    }, []);

    // ========================================================================
    // Save preferences to localStorage
    // ========================================================================
    const savePreferences = useCallback((newPrefs: NotificationPreferences) => {
        try {
            localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
        } catch (err) {
            console.warn('Failed to save notification preferences:', err);
        }
    }, []);

    const saveTeacherSubscriptions = useCallback((subs: TeacherSubscription[]) => {
        try {
            localStorage.setItem('teacher_subscriptions', JSON.stringify(subs));
        } catch (err) {
            console.warn('Failed to save teacher subscriptions:', err);
        }
    }, []);

    // ========================================================================
    // Enable Notifications
    // ========================================================================
    const enableNotifications = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const granted = await oneSignal.requestPermission();

            if (granted) {
                const newPrefs = { ...preferences, pushEnabled: true };
                setPreferences(newPrefs);
                savePreferences(newPrefs);
            }

            return granted;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to enable notifications';
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [oneSignal, preferences, savePreferences]);

    // ========================================================================
    // Disable Notifications
    // ========================================================================
    const disableNotifications = useCallback(async (): Promise<void> => {
        setIsLoading(true);

        try {
            // Note: We can't programmatically disable browser notifications,
            // but we can update our stored preference
            const newPrefs = { ...preferences, pushEnabled: false };
            setPreferences(newPrefs);
            savePreferences(newPrefs);
        } finally {
            setIsLoading(false);
        }
    }, [preferences, savePreferences]);

    // ========================================================================
    // Update Preference
    // ========================================================================
    const updatePreference = useCallback(async (
        key: keyof NotificationPreferences,
        value: boolean
    ): Promise<void> => {
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);
        savePreferences(newPrefs);

        // If this is the pushEnabled preference, handle specially
        if (key === 'pushEnabled' && value) {
            await enableNotifications();
        }
    }, [preferences, savePreferences, enableNotifications]);

    // ========================================================================
    // Teacher Subscription
    // ========================================================================
    const subscribeToTeacher = useCallback(async (
        teacherId: string,
        teacherName: string
    ): Promise<void> => {
        setIsLoading(true);

        try {
            await oneSignal.subscribeToTeacher(teacherId);

            const newSub: TeacherSubscription = {
                teacherId,
                teacherName,
                subscribedAt: new Date().toISOString(),
            };

            const newSubs = [...teacherSubscriptions.filter(s => s.teacherId !== teacherId), newSub];
            setTeacherSubscriptions(newSubs);
            saveTeacherSubscriptions(newSubs);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to subscribe';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [oneSignal, teacherSubscriptions, saveTeacherSubscriptions]);

    const unsubscribeFromTeacher = useCallback(async (teacherId: string): Promise<void> => {
        setIsLoading(true);

        try {
            await oneSignal.unsubscribeFromTeacher(teacherId);

            const newSubs = teacherSubscriptions.filter(s => s.teacherId !== teacherId);
            setTeacherSubscriptions(newSubs);
            saveTeacherSubscriptions(newSubs);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [oneSignal, teacherSubscriptions, saveTeacherSubscriptions]);

    const isSubscribedToTeacher = useCallback((teacherId: string): boolean => {
        return teacherSubscriptions.some(s => s.teacherId === teacherId);
    }, [teacherSubscriptions]);

    // ========================================================================
    // Refresh Status
    // ========================================================================
    const refreshStatus = useCallback(async (): Promise<void> => {
        await oneSignal.refreshStatus();
    }, [oneSignal]);

    // ========================================================================
    // Return
    // ========================================================================
    return {
        isLoading: isLoading || oneSignal.isLoading,
        isSupported: oneSignal.status.isSupported,
        isPermitted: oneSignal.status.isPermitted,
        isSubscribed: oneSignal.status.isSubscribed,
        error,
        preferences,
        teacherSubscriptions,
        enableNotifications,
        disableNotifications,
        updatePreference,
        subscribeToTeacher,
        unsubscribeFromTeacher,
        isSubscribedToTeacher,
        refreshStatus,
    };
}

export default useNotificationPreferences;
