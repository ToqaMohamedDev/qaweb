'use client';

// =============================================
// Toast Component (Connected to UIStore)
// =============================================

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores';

// ═══════════════════════════════════════════════════════════════════════════
// TOAST ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface ToastItemProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onDismiss: (id: string) => void;
}

const toastStyles = {
    success: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        icon: (
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
    },
    warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: (
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: (
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
};

function ToastItem({ id, type, message, onDismiss }: ToastItemProps) {
    const styles = toastStyles[type];

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-4 rounded-xl border shadow-lg',
                'animate-in slide-in-from-left-5 fade-in duration-300',
                styles.bg,
                styles.border
            )}
            role="alert"
        >
            {/* Icon */}
            <div className="flex-shrink-0">
                {styles.icon}
            </div>

            {/* Message */}
            <p className={cn('flex-1 text-sm font-medium', styles.text)}>
                {message}
            </p>

            {/* Dismiss Button */}
            <button
                onClick={() => onDismiss(id)}
                className={cn(
                    'flex-shrink-0 p-1 rounded-lg transition-colors',
                    'hover:bg-black/5 dark:hover:bg-white/10',
                    styles.text
                )}
                aria-label="إغلاق"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

export function ToastContainer() {
    const { toasts, removeToast } = useUIStore();

    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 left-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem
                        id={toast.id}
                        type={toast.type}
                        message={toast.message}
                        onDismiss={removeToast}
                    />
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;
