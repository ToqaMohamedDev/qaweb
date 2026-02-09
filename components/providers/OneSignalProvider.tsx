/**
 * ============================================================================
 * ONESIGNAL PROVIDER - Improved Version
 * ============================================================================
 * 
 * Provider لتهيئة OneSignal في التطبيق
 * - Non-blocking: لن يمنع التطبيق من العمل إذا فشل OneSignal
 * - Lazy initialization: يبدأ التهيئة بعد تحميل الصفحة
 * - Auto user sync: يربط المستخدم تلقائياً عند تسجيل الدخول
 * ============================================================================
 */

'use client';

import {
    useEffect,
    useState,
    useCallback,
    createContext,
    useContext,
    ReactNode,
    useRef
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationStatus {
    isSupported: boolean;
    isPermitted: boolean;
    isSubscribed: boolean;
}

interface OneSignalContextType {
    // Status
    isInitialized: boolean;
    isLoading: boolean;
    status: NotificationStatus;
    error: string | null;

    // Actions
    initialize: () => Promise<boolean>;
    requestPermission: () => Promise<boolean>;
    syncUser: (userId: string, userData?: UserData) => Promise<void>;
    logout: () => Promise<void>;
    subscribeToTeacher: (teacherId: string) => Promise<void>;
    unsubscribeFromTeacher: (teacherId: string) => Promise<void>;
    refreshStatus: () => Promise<void>;
}

interface UserData {
    email?: string;
    name?: string;
    role?: 'student' | 'teacher' | 'admin';
    stage_id?: string;
}
// ... (existing code)
const defaultStatus: NotificationStatus = {
    isSupported: false,
    isPermitted: false,
    isSubscribed: false,
};

const OneSignalContext = createContext<OneSignalContextType>({
    isInitialized: false,
    isLoading: false,
    status: defaultStatus,
    error: null,
    initialize: async () => false,
    requestPermission: async () => false,
    syncUser: async () => { },
    logout: async () => { },
    subscribeToTeacher: async () => { },
    unsubscribeFromTeacher: async () => { },
    refreshStatus: async () => { },
});

export const useOneSignal = () => useContext(OneSignalContext);

// ============================================================================
// PROVIDER
// ============================================================================

interface OneSignalProviderProps {
    children: ReactNode;
    /** Auto-initialize on mount (default: true) */
    autoInit?: boolean;
    /** Delay before initialization in ms (default: 1500) */
    initDelay?: number;
}

export function OneSignalProvider({
    children,
    autoInit = true,
    initDelay = 1500,
}: OneSignalProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<NotificationStatus>(defaultStatus);
    const [error, setError] = useState<string | null>(null);

    const initAttempted = useRef(false);

    // ========================================================================
    // Initialize OneSignal
    // ========================================================================
    const initialize = useCallback(async (): Promise<boolean> => {
        // Prevent multiple initialization attempts
        if (initAttempted.current || isInitialized) {
            return isInitialized;
        }
        initAttempted.current = true;

        // Check if we're in the browser
        if (typeof window === 'undefined') {
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { initOneSignal, getNotificationStatus } = await import('@/lib/onesignal');

            const success = await initOneSignal();
            setIsInitialized(success);

            if (success) {
                const notifStatus = await getNotificationStatus();
                setStatus(notifStatus);
                console.log('✅ OneSignal Provider: Initialized successfully');
            } else {
                console.warn('⚠️ OneSignal Provider: Initialization returned false');
            }

            return success;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            console.warn('⚠️ OneSignal Provider: Init failed (non-blocking):', message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    // ========================================================================
    // Request Notification Permission
    // ========================================================================
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isInitialized) {
            const initSuccess = await initialize();
            if (!initSuccess) return false;
        }

        try {
            const { requestNotificationPermission } = await import('@/lib/onesignal');
            const granted = await requestNotificationPermission();

            // Refresh status after permission request
            const { getNotificationStatus } = await import('@/lib/onesignal');
            const newStatus = await getNotificationStatus();
            setStatus(newStatus);

            return granted;
        } catch (err) {
            console.warn('Failed to request permission:', err);
            return false;
        }
    }, [isInitialized, initialize]);

    // ========================================================================
    // Sync User with OneSignal
    // ========================================================================
    const syncUser = useCallback(async (userId: string, userData?: UserData): Promise<void> => {
        if (!isInitialized) return;

        try {
            const { loginUser } = await import('@/lib/onesignal');
            await loginUser(userId, userData);
        } catch (err) {
            console.warn('⚠️ OneSignal Provider: Sync failed:', err);
        }
    }, [isInitialized]);

    // ========================================================================
    // Logout from OneSignal
    // ========================================================================
    const logout = useCallback(async (): Promise<void> => {
        if (!isInitialized) return;

        try {
            const { logoutUser } = await import('@/lib/onesignal');
            await logoutUser();
        } catch (err) {
            console.warn('⚠️ OneSignal Provider: Logout failed:', err);
        }
    }, [isInitialized]);

    // ========================================================================
    // Teacher Subscription
    // ========================================================================
    const subscribeToTeacher = useCallback(async (teacherId: string): Promise<void> => {
        if (!isInitialized) return;

        try {
            const { subscribeToTeacher: subscribe } = await import('@/lib/onesignal');
            await subscribe(teacherId);
            console.log('✅ OneSignal: Subscribed to teacher:', teacherId);
        } catch (err) {
            console.warn('Failed to subscribe to teacher:', err);
        }
    }, [isInitialized]);

    const unsubscribeFromTeacher = useCallback(async (teacherId: string): Promise<void> => {
        if (!isInitialized) return;

        try {
            const { unsubscribeFromTeacher: unsubscribe } = await import('@/lib/onesignal');
            await unsubscribe(teacherId);
            console.log('✅ OneSignal: Unsubscribed from teacher:', teacherId);
        } catch (err) {
            console.warn('Failed to unsubscribe from teacher:', err);
        }
    }, [isInitialized]);

    // ========================================================================
    // Refresh Status
    // ========================================================================
    const refreshStatus = useCallback(async (): Promise<void> => {
        if (!isInitialized) return;

        try {
            const { getNotificationStatus } = await import('@/lib/onesignal');
            const newStatus = await getNotificationStatus();
            setStatus(newStatus);
        } catch (err) {
            console.warn('Failed to refresh notification status:', err);
        }
    }, [isInitialized]);

    // ========================================================================
    // Auto-initialization effect (lazy, with delay)
    // ========================================================================
    useEffect(() => {
        if (!autoInit) return;

        const timeoutId = setTimeout(() => {
            initialize();
        }, initDelay);

        return () => clearTimeout(timeoutId);
    }, [autoInit, initDelay, initialize]);

    // ========================================================================
    // Auto-sync user when authenticated
    // ========================================================================
    useEffect(() => {
        if (!isInitialized) return;

        const syncAuthenticatedUser = async () => {
            try {
                const res = await fetch('/api/auth/user?includeProfile=true', { credentials: 'include' });
                const result = await res.json();

                if (result.success && result.data?.user) {
                    const user = result.data.user;
                    const profile = result.data.profile;

                    await syncUser(user.id, {
                        email: user.email,
                        name: profile?.name ?? undefined,
                        role: profile?.role as 'student' | 'teacher' | 'admin',
                        stage_id: profile?.stage_id ?? undefined,
                    });
                }
            } catch (err) {
                console.warn('⚠️ OneSignal: Could not sync authenticated user:', err);
            }
        };

        syncAuthenticatedUser();
    }, [isInitialized, syncUser]);

    // ========================================================================
    // Render
    // ========================================================================
    return (
        <OneSignalContext.Provider
            value={{
                isInitialized,
                isLoading,
                status,
                error,
                initialize,
                requestPermission,
                syncUser,
                logout,
                subscribeToTeacher,
                unsubscribeFromTeacher,
                refreshStatus,
            }}
        >
            {children}
        </OneSignalContext.Provider>
    );
}

export default OneSignalProvider;
