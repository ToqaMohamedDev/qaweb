'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Layout - Layout موحد لـ Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardProtection } from './DashboardProtection';
import type { DashboardLayoutProps } from './types';

function DashboardLayoutContent({ children, config }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
            <div className="flex">
                <DashboardSidebar 
                    config={config} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                <div className="flex-1 min-w-0">
                    <DashboardHeader 
                        config={config} 
                        onMenuClick={() => setSidebarOpen(true)} 
                    />
                    <main className="p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
            </div>
        </div>
    );
}

export function DashboardLayout({ children, config }: DashboardLayoutProps) {
    return (
        <ThemeProvider>
            <DashboardProtection config={config}>
                <DashboardLayoutContent config={config}>
                    {children}
                </DashboardLayoutContent>
            </DashboardProtection>
        </ThemeProvider>
    );
}
