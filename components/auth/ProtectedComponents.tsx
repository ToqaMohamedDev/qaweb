// =============================================
// Protected Components - مكونات الحماية الموحدة
// =============================================

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
    useProtectedRoute,
    useAdminRoute,
    useTeacherRoute,
    useAuthenticatedRoute,
} from '@/hooks/useProtectedRoute';

// ═══════════════════════════════════════════════════════════════════════════
// Loading Component
// ═══════════════════════════════════════════════════════════════════════════

interface LoadingScreenProps {
    message?: string;
}

function LoadingScreen({ message = 'جاري التحميل...' }: LoadingScreenProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-900 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">{message}</p>
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Pending Approval Component (للمدرسين في انتظار الموافقة)
// ═══════════════════════════════════════════════════════════════════════════

interface PendingApprovalProps {
    userName?: string;
}

function PendingApprovalScreen({ userName }: PendingApprovalProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-[#1c1c24] rounded-2xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-800"
            >
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    مرحباً {userName || 'بك'}! 👋
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    حسابك كمدرس في <span className="text-amber-600 font-semibold">انتظار الموافقة</span> من الإدارة.
                    سنقوم بمراجعة طلبك في أقرب وقت ممكن.
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-right text-sm text-amber-700 dark:text-amber-300">
                            <p className="font-medium mb-1">ماذا يمكنك فعله الآن؟</p>
                            <ul className="space-y-1 text-amber-600 dark:text-amber-400">
                                <li>• إكمال ملفك الشخصي</li>
                                <li>• تصفح المحتوى التعليمي</li>
                                <li>• المشاركة في Quiz Battle</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/profile"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                    >
                        إكمال الملف الشخصي
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                    >
                        الصفحة الرئيسية
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Protected Wrapper Components
// ═══════════════════════════════════════════════════════════════════════════

interface ProtectedWrapperProps {
    children: ReactNode;
    loadingMessage?: string;
}

/**
 * حماية محتوى للمستخدمين المسجلين فقط
 */
export function AuthenticatedOnly({ children, loadingMessage }: ProtectedWrapperProps) {
    const { isLoading, isAuthorized } = useAuthenticatedRoute();

    if (isLoading) {
        return <LoadingScreen message={loadingMessage || 'جاري التحقق...'} />;
    }

    if (!isAuthorized) {
        return null; // سيتم التوجيه تلقائياً
    }

    return <>{children}</>;
}

/**
 * حماية محتوى للأدمن فقط
 */
export function AdminOnly({ children, loadingMessage }: ProtectedWrapperProps) {
    const { isLoading, isAuthorized } = useAdminRoute();

    if (isLoading) {
        return <LoadingScreen message={loadingMessage || 'جاري التحقق من الصلاحيات...'} />;
    }

    if (!isAuthorized) {
        return null; // سيتم التوجيه تلقائياً
    }

    return <>{children}</>;
}

interface TeacherOnlyProps extends ProtectedWrapperProps {
    /** هل يظهر شاشة انتظار الموافقة للمدرسين غير المعتمدين */
    showPendingScreen?: boolean;
    /** عرض المحتوى حتى للمدرسين غير المعتمدين */
    allowPending?: boolean;
}

/**
 * حماية محتوى للمدرسين فقط
 */
export function TeacherOnly({
    children,
    loadingMessage,
    showPendingScreen = true,
    allowPending = false,
}: TeacherOnlyProps) {
    const { isLoading, isAuthorized, user, error } = useTeacherRoute({
        requireApproval: !allowPending
    });

    if (isLoading) {
        return <LoadingScreen message={loadingMessage || 'جاري التحقق من الصلاحيات...'} />;
    }

    // إذا كان المدرس غير معتمد وطلبنا showPendingScreen
    if (isAuthorized && error && showPendingScreen && user?.role === 'teacher' && !user?.isTeacherApproved) {
        return <PendingApprovalScreen userName={user.name} />;
    }

    if (!isAuthorized) {
        return null; // سيتم التوجيه تلقائياً
    }

    return <>{children}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Export Loading Components for external use
// ═══════════════════════════════════════════════════════════════════════════

export { LoadingScreen, PendingApprovalScreen };
