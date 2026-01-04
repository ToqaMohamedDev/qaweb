'use client';

// =============================================
// ProfileTabs Component - تبويبات الملف الشخصي
// =============================================

import { TrendingUp, Trophy, Clock, Settings } from 'lucide-react';
import type { ProfileTab, TabItem } from './types';

interface ProfileTabsProps {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
}

const tabs: TabItem[] = [
    { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
    { id: 'achievements', label: 'الإنجازات', icon: Trophy },
    { id: 'activity', label: 'النشاط', icon: Clock },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
    return (
        <div className="flex gap-1 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg shadow-gray-200/30 dark:shadow-black/10 overflow-x-auto">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
