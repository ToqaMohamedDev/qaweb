'use client';

// =============================================
// ActivityList Component - قائمة النشاط
// =============================================

import { motion } from 'framer-motion';
import { Clock, BookOpen, FileText, CheckCircle, Play } from 'lucide-react';
import type { ActivityItem } from './types';

interface ActivityListProps {
    activities: ActivityItem[];
    formatDate: (date: string) => string;
}

export function ActivityList({ activities, formatDate }: ActivityListProps) {
    if (activities.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-8 shadow-lg text-center"
            >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">لا يوجد نشاط بعد</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    ابدأ بإكمال الدروس والامتحانات لعرض نشاطك هنا
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg overflow-hidden"
        >
            <div className="p-5 border-b border-gray-200/60 dark:border-gray-800/60">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-violet-500" />
                    النشاط الأخير
                </h3>
            </div>

            <div className="divide-y divide-gray-200/60 dark:divide-gray-800/60">
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${activity.type === 'lesson'
                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                        : 'bg-green-100 dark:bg-green-900/30'
                                    }`}
                            >
                                {activity.type === 'lesson' ? (
                                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {activity.title}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(activity.date)}
                                    </span>
                                    {activity.status && (
                                        <span
                                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg ${activity.status === 'مكتمل'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                }`}
                                        >
                                            {activity.status === 'مكتمل' ? (
                                                <CheckCircle className="h-3 w-3" />
                                            ) : (
                                                <Play className="h-3 w-3" />
                                            )}
                                            {activity.status}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Score (for exams) */}
                            {activity.score !== undefined && (
                                <div className="text-center">
                                    <p
                                        className={`text-2xl font-bold ${activity.score >= 80
                                                ? 'text-green-600 dark:text-green-400'
                                                : activity.score >= 60
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}
                                    >
                                        {activity.score}%
                                    </p>
                                    <p className="text-xs text-gray-500">النتيجة</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
