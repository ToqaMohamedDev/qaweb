// =============================================
// SectionHeader Component - عنوان القسم
// =============================================

'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { LucideIcon } from 'lucide-react';

export interface SectionHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    iconGradient?: string;
    className?: string;
}

export function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    iconGradient = 'from-primary-500/20 via-purple-500/15 to-blue-500/10 dark:from-red-500/20 dark:via-orange-500/15 dark:to-yellow-500/10',
    className = '',
}: SectionHeaderProps) {
    return (
        <motion.div
            className={`flex items-center gap-4 mb-8 ${className}`}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
        >
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${iconGradient} shadow-lg shadow-primary-500/10 dark:shadow-red-500/10`}>
                <Icon className="h-6 w-6 text-primary-500 dark:text-red-500" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-[#888] mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

export default SectionHeader;
