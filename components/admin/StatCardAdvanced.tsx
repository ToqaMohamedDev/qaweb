'use client';

// =============================================
// StatCardAdvanced Component - بطاقة الإحصائيات المتقدمة
// =============================================

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { MiniChart } from './MiniChart';
import type { StatCardProps } from './types';
import { itemVariants, cardHover } from '@/lib/animations';

export function StatCardAdvanced({
    title,
    value,
    subtext,
    icon: Icon,
    color,
    trend,
    trendValue,
    chartData,
}: StatCardProps) {
    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : null;

    // Convert color class to hex for chart
    const getChartColor = (colorClass: string): string => {
        if (colorClass.includes('blue')) return '#3B82F6';
        if (colorClass.includes('purple')) return '#8B5CF6';
        if (colorClass.includes('green')) return '#10B981';
        if (colorClass.includes('amber')) return '#F59E0B';
        return '#6366F1';
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={cardHover}
            className="relative overflow-hidden bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300"
        >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <Icon className="w-full h-full" />
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    {trend && TrendIcon && (
                        <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend === 'up'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                }`}
                        >
                            <TrendIcon className="h-3 w-3" />
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{title}</p>

                {subtext && (
                    <p className="text-xs text-primary-500 font-medium">{subtext}</p>
                )}

                {chartData && chartData.length > 0 && (
                    <div className="mt-4 h-12">
                        <MiniChart data={chartData} color={getChartColor(color)} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
