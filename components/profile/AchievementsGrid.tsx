'use client';

// =============================================
// AchievementsGrid Component - شبكة الإنجازات
// =============================================

import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import type { Achievement } from './types';

interface AchievementsGridProps {
    achievements: Achievement[];
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        الإنجازات
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold">
                        {unlockedCount} / {achievements.length}
                    </span>
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {achievements.map((achievement, index) => (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`relative p-4 rounded-2xl border ${achievement.unlocked
                                    ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-200/60 dark:border-gray-700'
                                    : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200/40 dark:border-gray-800/40 opacity-60'
                                } text-center`}
                        >
                            {/* Icon */}
                            <div
                                className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${achievement.unlocked
                                        ? `bg-gradient-to-br ${achievement.color} shadow-lg`
                                        : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            >
                                {achievement.unlocked ? (
                                    <div className="text-white">{achievement.icon}</div>
                                ) : (
                                    <Lock className="h-5 w-5 text-gray-400" />
                                )}
                            </div>

                            {/* Title */}
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                                {achievement.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                {achievement.description}
                            </p>

                            {/* Progress Bar */}
                            {achievement.progress !== undefined && !achievement.unlocked && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${achievement.progress}%` }}
                                            className={`h-full bg-gradient-to-r ${achievement.color} rounded-full`}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {Math.round(achievement.progress)}%
                                    </p>
                                </div>
                            )}

                            {/* Unlocked Badge */}
                            {achievement.unlocked && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
