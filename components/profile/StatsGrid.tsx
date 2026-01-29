'use client';

// =============================================
// StatsGrid Component - شبكة الإحصائيات
// =============================================

import { motion } from 'framer-motion';
import { BookOpen, FileText, GraduationCap, HelpCircle } from 'lucide-react';
import type { UserStats } from './types';

interface StatsGridProps {
    stats: UserStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
    // Get separate exam stats with total available for stage
    const siteExams = stats.siteExams || { total: 0, taken: 0, passed: 0, averageScore: 0 };
    const teacherExams = stats.teacherExams || { total: 0, taken: 0, passed: 0, averageScore: 0 };
    const questionBank = stats.questionBank || { total: 0, taken: 0, passed: 0, averageScore: 0 };

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
            total: siteExams.total,  // إجمالي الامتحانات المتاحة للمرحلة
            icon: FileText,
            gradient: 'from-blue-500 to-cyan-500',
            bg: 'from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20',
            iconBg: 'bg-blue-500',
            subLabel: siteExams.total > 0 ? `${siteExams.averageScore}% متوسط` : undefined,
        },
        {
            label: 'امتحانات المدرسين',
            value: teacherExams.passed,
            total: teacherExams.total,  // إجمالي الامتحانات المتاحة للمرحلة
            icon: GraduationCap,
            gradient: 'from-purple-500 to-pink-500',
            bg: 'from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20',
            iconBg: 'bg-purple-500',
            subLabel: teacherExams.total > 0 ? `${teacherExams.averageScore}% متوسط` : undefined,
        },
        {
            label: 'بنك الأسئلة',
            value: questionBank.taken,
            total: questionBank.total,  // إجمالي بنوك الأسئلة المتاحة للمرحلة
            icon: HelpCircle,
            gradient: 'from-amber-500 to-orange-500',
            bg: 'from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20',
            iconBg: 'bg-amber-500',
            subLabel: questionBank.total > 0 ? `${questionBank.averageScore}% متوسط` : undefined,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                </motion.div>
            ))}
        </div>
    );
}

