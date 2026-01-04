// =============================================
// useProtectedRoute - Hook موحد لحماية الصفحات
// =============================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import type { UserRole } from '@/lib/types';

interface UseProtectedRouteOptions {
    /** الأدوار المسموح لها بالوصول */
    allowedRoles?: UserRole[];
    /** هل يتطلب موافقة المدرس */
    requireTeacherApproval?: boolean;
    /** صفحة إعادة التوجيه عند عدم الصلاحية */
    redirectTo?: string;
    /** صفحة إعادة التوجيه عند عدم تسجيل الدخول */
    loginRedirect?: string;
}

interface ProtectedRouteState {
    /** هل يتم تحميل البيانات */
    isLoading: boolean;
    /** هل المستخدم مصرح له */
    isAuthorized: boolean;
    /** هل المستخدم مسجل الدخول */
    isAuthenticated: boolean;
    /** بيانات المستخدم */
    user: import('@/lib/types').UserProfile | null;
    /** رسالة الخطأ إن وجدت */
    error: string | null;
}

/**
 * Hook موحد لحماية الصفحات بناءً على الأدوار والصلاحيات
 * 
 * @example
 * // حماية صفحة للأدمن فقط
 * const { isLoading, isAuthorized, user } = useProtectedRoute({ 
 *   allowedRoles: ['admin'] 
 * });
 * 
 * @example
 * // حماية صفحة للمدرس المعتمد
 * const { isLoading, isAuthorized } = useProtectedRoute({ 
 *   allowedRoles: ['teacher'],
 *   requireTeacherApproval: true 
 * });
 */
export function useProtectedRoute(options: UseProtectedRouteOptions = {}): ProtectedRouteState {
    const {
        allowedRoles,
        requireTeacherApproval = false,
        redirectTo = '/',
        loginRedirect = '/login',
    } = options;

    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading: authLoading, isAuthenticated } = useAuthStore();

    const [state, setState] = useState<ProtectedRouteState>({
        isLoading: true,
        isAuthorized: false,
        isAuthenticated: false,
        user: null,
        error: null,
    });

    useEffect(() => {
        // انتظار انتهاء تحميل الـ auth
        if (authLoading) {
            setState(prev => ({ ...prev, isLoading: true }));
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 1. التحقق من تسجيل الدخول
        // ═══════════════════════════════════════════════════════════════
        if (!isAuthenticated || !user) {
            const loginUrl = `${loginRedirect}?redirect=${encodeURIComponent(pathname)}`;
            router.push(loginUrl);
            setState({
                isLoading: false,
                isAuthorized: false,
                isAuthenticated: false,
                user: null,
                error: 'يجب تسجيل الدخول أولاً',
            });
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. التحقق من اختيار الدور
        // ═══════════════════════════════════════════════════════════════
        if (!user.roleSelected && pathname !== '/onboarding') {
            router.push('/onboarding');
            setState({
                isLoading: false,
                isAuthorized: false,
                isAuthenticated: true,
                user,
                error: 'يجب اختيار نوع الحساب أولاً',
            });
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. التحقق من الدور
        // ═══════════════════════════════════════════════════════════════
        if (allowedRoles && allowedRoles.length > 0) {
            if (!allowedRoles.includes(user.role)) {
                router.push(redirectTo);
                setState({
                    isLoading: false,
                    isAuthorized: false,
                    isAuthenticated: true,
                    user,
                    error: 'ليس لديك صلاحية الوصول لهذه الصفحة',
                });
                return;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. التحقق من موافقة المدرس
        // ═══════════════════════════════════════════════════════════════
        if (requireTeacherApproval && user.role === 'teacher') {
            if (!user.isTeacherApproved) {
                // المدرس غير معتمد - نسمح بالوصول لكن نعرض رسالة
                setState({
                    isLoading: false,
                    isAuthorized: true, // نسمح بالوصول لعرض رسالة الانتظار
                    isAuthenticated: true,
                    user,
                    error: 'حسابك كمدرس في انتظار الموافقة',
                });
                return;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. كل شيء تمام!
        // ═══════════════════════════════════════════════════════════════
        setState({
            isLoading: false,
            isAuthorized: true,
            isAuthenticated: true,
            user,
            error: null,
        });
    }, [authLoading, isAuthenticated, user, allowedRoles, requireTeacherApproval, redirectTo, loginRedirect, pathname, router]);

    return state;
}

// ═══════════════════════════════════════════════════════════════════════════
// Preset Hooks للاستخدام السريع
// ═══════════════════════════════════════════════════════════════════════════

/** حماية صفحات الأدمن */
export function useAdminRoute() {
    return useProtectedRoute({
        allowedRoles: ['admin'],
        redirectTo: '/',
    });
}

/** حماية صفحات المدرس (مع التحقق من الموافقة) */
export function useTeacherRoute(options?: { requireApproval?: boolean }) {
    return useProtectedRoute({
        allowedRoles: ['teacher', 'admin'],
        requireTeacherApproval: options?.requireApproval ?? false,
        redirectTo: '/',
    });
}

/** حماية صفحات تحتاج تسجيل دخول فقط */
export function useAuthenticatedRoute() {
    return useProtectedRoute({});
}

/** حماية صفحات الملف الشخصي */
export function useProfileRoute() {
    return useProtectedRoute({
        redirectTo: '/login',
    });
}
