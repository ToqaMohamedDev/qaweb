'use client';

// =============================================
// ActivityFeed Component - قائمة النشاط الأخير
// =============================================

import { Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ActivityItem } from './types';
import { itemVariants } from '@/lib/animations';

interface ActivityFeedProps {
    activities: ActivityItem[];
}

const activityColors: Record<string, string> = {
    exam: 'bg-green-500',
    teacher: 'bg-purple-500',
    user: 'bg-blue-500',
    lesson: 'bg-amber-500',
    system: 'bg-gray-500',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">النشاط الأخير</h2>
                </div>
            </div>

            {/* Activity List */}
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">لا يوجد نشاط حديث</p>
                    </div>
                ) : (
                    activities.map((activity, i) => {
                        const Icon = activity.icon || Activity;
                        return (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full ${activityColors[activity.type]} flex items-center justify-center flex-shrink-0`}
                                >
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {activity.action}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {activity.time}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
}
