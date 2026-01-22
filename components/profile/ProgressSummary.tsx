'use client';

// =============================================
// ProgressSummary Component - ملخص التقدم
// =============================================

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, BookOpen, Award, Play, Sparkles, FileText, GraduationCap } from 'lucide-react';
import type { UserStats } from './types';

interface ProgressSummaryProps {
    stats: UserStats;
}

export function ProgressSummary({ stats }: ProgressSummaryProps) {
    // Get separate exam stats
    const siteExams = stats.siteExams || { taken: 0, passed: 0, averageScore: 0 };
    const teacherExams = stats.teacherExams || { taken: 0, passed: 0, averageScore: 0 };

    return (
        <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-500" />
                ملخص التقدم
            </h3>

            <div className="space-y-5">
                {/* Lessons Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            الدروس المكتملة
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {stats.completedLessons} / {stats.totalLessons}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width:
                                    stats.totalLessons > 0
                                        ? `${(stats.completedLessons / stats.totalLessons) * 100}%`
                                        : '0%',
                            }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Site Exams Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-500" />
                            امتحانات الموقع الناجحة
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {siteExams.passed} / {siteExams.taken}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width:
                                    siteExams.taken > 0
                                        ? `${(siteExams.passed / siteExams.taken) * 100}%`
                                        : '0%',
                            }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Teacher Exams Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-purple-500" />
                            امتحانات المدرسين الناجحة
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {teacherExams.passed} / {teacherExams.taken}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width:
                                    teacherExams.taken > 0
                                        ? `${(teacherExams.passed / teacherExams.taken) * 100}%`
                                        : '0%',
                            }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {/* Empty State CTA */}
            {stats.completedLessons === 0 && stats.examsTaken === 0 && (
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-800/30 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
                        <Play className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">ابدأ رحلة التعلم!</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        لم تبدأ أي درس أو امتحان بعد. اختر مادة وابدأ التعلم الآن!
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25"
                    >
                        <Sparkles className="h-4 w-4" />
                        استكشف الدروس
                    </Link>
                </div>
            )}
        </div>
    );
}

