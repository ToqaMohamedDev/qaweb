// =============================================
// TopStudentsSection Component - قسم الطلاب المتفوقين
// =============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, TrendingUp } from 'lucide-react';
import { containerVariants, itemVariants } from '@/lib/animations';
import { Avatar } from '@/components/common';

export interface TopStudent {
    id: string;
    name: string;
    examTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
}

export interface TopStudentsSectionProps {
    students: TopStudent[];
}

export function TopStudentsSection({ students }: TopStudentsSectionProps) {
    return (
        <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/10 dark:via-[#121218] dark:to-[#121218]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 sm:mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40">
                        <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">المتفوقون</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                        طلابنا <span className="text-amber-500">المتفوقون</span> 🏆
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                        طلاب حققوا درجات 90% وأكثر في الامتحانات
                    </p>
                </motion.div>

                {/* Students Grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {students.slice(0, 6).map((student, index) => (
                        <motion.div
                            key={student.id}
                            variants={itemVariants}
                            className="relative bg-white dark:bg-[#1c1c24] rounded-xl p-4 sm:p-5 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Rank Badge for top 3 */}
                            {index < 3 && (
                                <div
                                    className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${index === 0
                                        ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                        : index === 1
                                            ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                                            : 'bg-gradient-to-br from-amber-600 to-amber-800'
                                        }`}
                                >
                                    {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <Avatar
                                    src={undefined}
                                    name={student.name}
                                    size="lg"
                                    customGradient={index === 0
                                        ? 'from-amber-400 to-amber-600'
                                        : 'from-primary-400 to-primary-600'}
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                        {student.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {student.examTitle}
                                    </p>
                                </div>

                                {/* Score */}
                                <div className="text-center shrink-0">
                                    <div
                                        className={`text-xl font-extrabold ${student.percentage >= 95
                                            ? 'text-amber-500'
                                            : 'text-primary-600 dark:text-primary-400'
                                            }`}
                                    >
                                        {student.percentage}%
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                        {student.score}/{student.totalQuestions}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative */}
                            {index === 0 && (
                                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-full blur-2xl -z-10" />
                            )}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Encouragement */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-8 text-center"
                >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        هل تريد أن تنضم لقائمة المتفوقين؟ 🌟
                    </p>
                    <Link
                        href="/arabic"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all hover:-translate-y-0.5"
                    >
                        <TrendingUp className="h-4 w-4" />
                        <span>ابدأ الامتحان الآن</span>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

export default TopStudentsSection;
