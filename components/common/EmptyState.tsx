// =============================================
// EmptyState Component - حالة عدم وجود نتائج
// =============================================

'use client';

import { motion } from 'framer-motion';
import { Search, LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon = Search,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-24"
        >
            <motion.div
                className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:via-[#222] dark:to-[#1a1a1a] flex items-center justify-center shadow-xl shadow-gray-200/50 dark:shadow-black/30"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
            >
                <Icon className="h-12 w-12 text-gray-300 dark:text-[#444]" />
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {title}
            </h3>

            {description && (
                <p className="text-gray-500 dark:text-[#888] max-w-md mx-auto">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <motion.button
                    onClick={onAction}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-red-600 dark:to-red-700 hover:from-primary-500 hover:to-primary-600 dark:hover:from-red-500 dark:hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/20 dark:shadow-red-500/20"
                >
                    {actionLabel}
                </motion.button>
            )}
        </motion.div>
    );
}

export default EmptyState;
