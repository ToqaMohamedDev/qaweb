// =============================================
// LessonCard Component - كارت الدرس
// =============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, LucideIcon, GraduationCap } from 'lucide-react';

export interface LessonCardProps {
    id: string;
    title: string;
    description?: string | null;
    stageName?: string | null;
    href: string;
    icon?: LucideIcon;
    index?: number;
    dir?: 'rtl' | 'ltr';
}

export function LessonCard({
    id,
    title,
    description,
    stageName,
    href,
    icon: Icon = FileText,
    index = 0,
    dir = 'rtl',
}: LessonCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
        >
            <Link href={href} className="block group h-full">
                <div
                    className="relative h-full bg-white dark:bg-[#1c1c24] rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 border border-gray-200/60 dark:border-[#2e2e3a] hover:border-primary-400 dark:hover:border-primary-600 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5"
                    dir={dir}
                >
                    <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                {title}
                            </h3>
                            {/* Stage Badge - يظهر دائماً */}
                            {stageName && (
                                <div className="mt-1 flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-900/30 text-[9px] sm:text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                        <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        <span className="truncate max-w-[80px] sm:max-w-[100px]">{stageName}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default LessonCard;
