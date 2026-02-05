'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Header - Header موحد لـ Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, Search, Moon, Sun, Bell, HelpCircle, ChevronDown,
    LogOut, Users, Settings, Sparkles,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/utils/logger';
import type { DashboardHeaderProps } from './types';

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="تبديل الوضع"
        >
            {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-gray-600" />
            ) : (
                <Sun className="h-5 w-5 text-amber-500" />
            )}
        </button>
    );
}

export function DashboardHeader({ config, onMenuClick }: DashboardHeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { user } = useAuthStore();
    const router = useRouter();

    const userName = user?.name || user?.email?.split('@')[0] || 'مستخدم';
    const userEmail = user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-dropdown="user-menu"]')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/login');
        } catch (error) {
            logger.error('Error signing out', { context: 'DashboardHeader', data: error });
        }
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0f0f12]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
                {/* Right Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                    >
                        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Search - Admin only */}
                    {config.role === 'admin' && (
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 w-80">
                            <Search className="h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-mono">
                                ⌘K
                            </kbd>
                        </div>
                    )}

                    {/* Back to site - Teacher only */}
                    {config.role === 'teacher' && (
                        <Link href="/" className="text-sm text-primary-600 hover:underline font-medium">
                            العودة للموقع
                        </Link>
                    )}
                </div>

                {/* Left Section */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    {/* Help - Admin only */}
                    {config.role === 'admin' && (
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    )}

                    {/* User Menu */}
                    <div className="relative" data-dropdown="user-menu">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.logoGradient} flex items-center justify-center text-white text-sm font-bold`}>
                                {userInitial}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1c1c24] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                                >
                                    {/* User Info */}
                                    <div className={`p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-${config.primaryColor}-50 to-purple-50 dark:from-${config.primaryColor}-900/20 dark:to-purple-900/20`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.logoGradient} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                                                {userInitial}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {userName}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {userEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <Link
                                            href="/"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            <span className="text-sm font-medium">الرئيسية</span>
                                        </Link>
                                        <Link
                                            href="/profile"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <Users className="h-4 w-4" />
                                            <span className="text-sm font-medium">الملف الشخصي</span>
                                        </Link>
                                        <Link
                                            href={`${config.homeHref}/settings`}
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span className="text-sm font-medium">الإعدادات</span>
                                        </Link>
                                    </div>

                                    {/* Logout */}
                                    <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="text-sm font-medium">تسجيل الخروج</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
