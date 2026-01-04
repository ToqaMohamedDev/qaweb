"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface StatItem {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export interface AdminStatsGridProps {
    stats: StatItem[];
    columns?: 2 | 3 | 4;
}

/**
 * AdminStatsGrid - شبكة إحصائيات Admin موحدة
 */
export function AdminStatsGrid({ stats, columns = 4 }: AdminStatsGridProps) {
    const gridClasses = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={`grid ${gridClasses[columns]} gap-4`}>
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                            <stat.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stat.value}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {stat.label}
                            </p>
                        </div>
                        {stat.trend && (
                            <div className={`mr-auto text-sm font-medium ${stat.trend.isPositive ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {stat.trend.isPositive ? '↑' : '↓'} {stat.trend.value}%
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
