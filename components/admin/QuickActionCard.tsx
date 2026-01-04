'use client';

// =============================================
// QuickActionCard Component - بطاقة الإجراء السريع
// =============================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { QuickAction } from './types';

export function QuickActionCard({ icon: Icon, title, description, href, color }: QuickAction) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden p-4 rounded-2xl bg-white dark:bg-[#1c1c24] border border-gray-200/60 dark:border-gray-800 cursor-pointer group"
            >
                <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${color}`}
                />
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
                        <p className="text-xs text-gray-500 truncate">{description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
            </motion.div>
        </Link>
    );
}
