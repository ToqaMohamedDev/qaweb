// =============================================
// Admin Dashboard Utilities - أدوات مساعدة
// =============================================

import React from 'react';
import { formatRelativeTime } from '@/lib/utils/formatters';

/**
 * Get relative time ago from date string
 * @deprecated استخدم formatRelativeTime من '@/lib/utils/formatters' بدلاً منها
 */
export const getTimeAgo = formatRelativeTime;

/**
 * Get role badge component
 */
export function getRoleBadge(role: string): React.ReactElement {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        teacher: {
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-600 dark:text-purple-400',
            label: 'معلم',
        },
        student: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            label: 'طالب',
        },
        admin: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            label: 'مشرف',
        },
    };

    const { bg, text, label } = config[role] || config.student;

    return React.createElement(
        'span',
        {
            className: `inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${bg} ${text}`,
        },
        label
    );
}

/**
 * Format number with locale
 */
export function formatNumber(num: number): string {
    return num.toLocaleString('ar-EG');
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}
