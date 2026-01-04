'use client';

// =============================================
// StatsGrid Component - شبكة الإحصائيات
// =============================================

import { motion } from 'framer-motion';
import { BookOpen, FileText, BarChart3, Zap, Sparkles } from 'lucide-react';
import type { UserStats } from './types';

interface StatsGridProps {
    stats: UserStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
    const statCards = [
        {
            label: 'دروس مكتملة',
            value: stats.completedLessons,
            total: stats.totalLessons,
            icon: BookOpen,
            gradient: 'from-primary-500 to-primary-600',
            bg: 'from-primary-50/50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20',
            iconBg: 'bg-primary-500',
        },
        {
            label: 'امتحانات',
            value: stats.passedExams,
            total: stats.examsTaken,
            icon: FileText,
            gradient: 'from-primary-400 to-primary-500',
            bg: 'from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50',
            iconBg: 'bg-primary-400',
        },
        {
            label: 'متوسط النتيجة',
            value: `${stats.averageScore}%`,
            icon: BarChart3,
            gradient: 'from-primary-600 to-primary-700',
            bg: 'from-primary-50/30 to-primary-100/30 dark:from-primary-900/10 dark:to-primary-800/10',
            iconBg: 'bg-primary-600',
        },
        {
            label: 'أيام نشاط',
            value: stats.activeDays,
            streak: stats.currentStreak,
            icon: Zap,
            gradient: 'from-primary-500 to-violet-600',
            bg: 'from-violet-50/50 to-purple-50/50 dark:from-violet-900/20 dark:to-purple-900/20',
            iconBg: 'bg-gradient-to-br from-primary-500 to-violet-600',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-lg`}
                >
                    <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}
                    >
                        <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                        {stat.total !== undefined && (
                            <span className="text-lg text-gray-400 font-normal">/{stat.total}</span>
                        )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                        {stat.label}
                    </p>
                    {stat.streak !== undefined && stat.streak > 0 && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-900/80 text-xs font-bold text-violet-600 dark:text-violet-400">
                            <Sparkles className="h-3 w-3" />
                            {stat.streak} 🔥
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
