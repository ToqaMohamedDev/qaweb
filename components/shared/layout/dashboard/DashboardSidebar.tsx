'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Sidebar - Sidebar موحد لـ Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import type { DashboardSidebarProps, NavItem, NavSection } from './types';

function isNavSectionArray(items: NavItem[] | NavSection[]): items is NavSection[] {
    return items.length > 0 && 'items' in items[0];
}

export function DashboardSidebar({ config, isOpen, onClose }: DashboardSidebarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore();

    const LogoIcon = config.logo;

    const userName = user?.name || user?.email?.split('@')[0] || 'مستخدم';
    const userEmail = user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    const isActive = (href: string) => {
        if (href === config.homeHref) return pathname === href;
        return pathname.startsWith(href);
    };

    const renderNavItem = (item: NavItem) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    active
                        ? `bg-gradient-to-r ${config.logoGradient} text-white shadow-lg`
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && item.badge > 0 && (
                    <span className="mr-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {item.badge > 99 ? '99+' : item.badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 right-0 h-screen w-[280px] bg-white dark:bg-[#0f0f12] border-l border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                        <Link href={config.homeHref} className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-gradient-to-br ${config.logoGradient} shadow-lg`}>
                                <LogoIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white text-lg">
                                    {config.title}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                    {config.subtitle}
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                        {isNavSectionArray(config.navItems) ? (
                            // Sectioned Navigation (Admin style)
                            config.navItems.map((section) => (
                                <div key={section.title}>
                                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                                        {section.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {section.items.map(renderNavItem)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Flat Navigation (Teacher style)
                            <div className="space-y-1">
                                {config.navItems.map(renderNavItem)}
                            </div>
                        )}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.logoGradient} flex items-center justify-center text-white font-bold`}>
                                {userInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {userName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {userEmail}
                                </p>
                            </div>
                            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <LogOut className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
