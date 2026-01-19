// =============================================
// LessonCard Component - كارت الدرس (Premium Glassmorphism)
// =============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, LucideIcon, GraduationCap, Sparkles } from 'lucide-react';

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
            <Link href={href} className="block group">
                {/* Premium Glassmorphism Card - Purple Theme */}
                <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-violet-500/20" dir={dir}>
                    {/* Gradient Border - Purple only */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-2xl p-[1.5px]" />

                    {/* Glass Background */}
                    <div className="absolute inset-[1.5px] rounded-[14px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl" />

                    {/* Purple Cloud Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/8 via-transparent to-purple-500/8 dark:from-violet-500/15 dark:via-transparent dark:to-purple-500/15" />
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/15 dark:bg-violet-500/25 rounded-full blur-2xl" />
                    <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-xl" />

                    {/* Card Content */}
                    <div className="relative rounded-2xl p-3 sm:p-4">
                        {/* Top Glow Line */}
                        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

                        <div className="flex items-start gap-2 sm:gap-3">
                            {/* Icon - Purple gradient */}
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 flex items-center justify-center shrink-0 group-hover:shadow-xl group-hover:shadow-violet-500/35 transition-all">
                                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>

                            <div className="min-w-0 flex-1">
                                {/* Title */}
                                <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors truncate">
                                    {title}
                                </h3>

                                {/* Stage Badge - Purple theme */}
                                {stageName && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 dark:bg-violet-500/15 backdrop-blur-sm border border-violet-300/30 dark:border-violet-400/20 text-[9px] sm:text-[10px] font-medium text-violet-700 dark:text-violet-300">
                                        <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        <span className="truncate max-w-[70px] sm:max-w-[90px]">{stageName}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Corner Sparkle */}
                        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
                            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-violet-400/50 group-hover:text-violet-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default LessonCard;
