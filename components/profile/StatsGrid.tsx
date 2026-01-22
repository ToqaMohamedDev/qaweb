'use client';

// =============================================
// StatsGrid Component - شبكة الإحصائيات
// =============================================

import { motion } from 'framer-motion';
import { BookOpen, FileText, BarChart3, Zap, Sparkles, GraduationCap } from 'lucide-react';
import type { UserStats } from './types';

interface StatsGridProps {
    stats: UserStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
    // Get separate exam stats if available
    const siteExams = stats.siteExams || { taken: 0, passed: 0, averageScore: 0 };
    const teacherExams = stats.teacherExams || { taken: 0, passed: 0, averageScore: 0 };

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
            label: 'امتحانات الموقع',
            value: siteExams.passed,
            total: siteExams.taken,
            icon: FileText,
            gradient: 'from-blue-500 to-cyan-500',
            bg: 'from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20',
            iconBg: 'bg-blue-500',
            subLabel: siteExams.taken > 0 ? `${siteExams.averageScore}% متوسط` : undefined,
        },
        {
            label: 'امتحانات المدرسين',
            value: teacherExams.passed,
            total: teacherExams.taken,
            icon: GraduationCap,
            gradient: 'from-purple-500 to-pink-500',
            bg: 'from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20',
            iconBg: 'bg-purple-500',
            subLabel: teacherExams.taken > 0 ? `${teacherExams.averageScore}% متوسط` : undefined,
        },
        {
            label: 'متوسط النتيجة',
            value: `${stats.averageScore}%`,
            icon: BarChart3,
            gradient: 'from-green-500 to-emerald-500',
            bg: 'from-green-50/30 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/10',
            iconBg: 'bg-green-500',
            subLabel: 'امتحانات الموقع',
        },
        {
            label: 'أيام نشاط',
            value: stats.activeDays,
            streak: stats.currentStreak,
            icon: Zap,
            gradient: 'from-amber-500 to-orange-500',
            bg: 'from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                        {stat.total !== undefined && (
                            <span className="text-lg text-gray-400 font-normal">/{stat.total}</span>
                        )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                        {stat.label}
                    </p>
                    {stat.subLabel && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {stat.subLabel}
                        </p>
                    )}
                    {stat.streak !== undefined && stat.streak > 0 && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-900/80 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Sparkles className="h-3 w-3" />
                            {stat.streak} 🔥
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

