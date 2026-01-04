'use client';

// =============================================
// MobileMenu - قائمة الموبايل
// =============================================

import { useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogIn,
    UserPlus,
    UserCircle,
    LogOut,
    Shield,
    Crown,
    Trophy,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/common';
import { navItems } from './constants';
import type { User } from '@supabase/supabase-js';

interface MobileMenuProps {
    isOpen: boolean;
    user: User | null;
    isUserAdmin: boolean;
    activePaths: Set<string>;
    onClose: () => void;
    onSignOut: () => Promise<void>;
}

// Animation variants
const mobileMenuVariants = {
    hidden: {
        opacity: 0,
        y: -30,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 25,
            staggerChildren: 0.07,
            delayChildren: 0.1,
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.95,
        transition: { duration: 0.2 },
    },
};

const mobileItemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.9 },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
    },
};

export function MobileMenu({
    isOpen,
    user,
    isUserAdmin,
    activePaths,
    onClose,
    onSignOut,
}: MobileMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (menuRef.current && !menuRef.current.contains(target)) {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, handleClickOutside]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    />

                    {/* Menu */}
                    <motion.div
                        ref={menuRef}
                        variants={mobileMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-x-0 top-[72px] z-50 md:hidden px-4"
                    >
                        <div className="bg-white/95 dark:bg-[#1c1c24]/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-200/50 dark:border-[#2e2e3a]/50 overflow-hidden">
                            {/* User Profile Card */}
                            {user && (
                                <UserProfileCard user={user} />
                            )}

                            <div className="p-4 space-y-3">
                                {/* Navigation Items */}
                                <motion.div
                                    variants={mobileItemVariants}
                                    className="bg-gray-50/80 dark:bg-[#252530]/80 rounded-2xl p-2 border border-gray-200/30 dark:border-[#2e2e3a]/30"
                                >
                                    <div className="space-y-1">
                                        {navItems.map((item, index) => {
                                            const Icon = item.icon;
                                            const isActive = activePaths.has(item.href);
                                            return (
                                                <motion.div
                                                    key={item.href}
                                                    variants={mobileItemVariants}
                                                    custom={index}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        onClick={onClose}
                                                        className={cn(
                                                            'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                                                            isActive
                                                                ? 'bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2a2a38]'
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'p-2 rounded-lg transition-all',
                                                                isActive
                                                                    ? 'bg-white/20'
                                                                    : 'bg-gray-100 dark:bg-[#2a2a38] group-hover:bg-gray-200 dark:group-hover:bg-[#353545]'
                                                            )}
                                                        >
                                                            <Icon
                                                                className={cn(
                                                                    'h-4 w-4',
                                                                    isActive
                                                                        ? 'text-white'
                                                                        : 'text-gray-600 dark:text-gray-400'
                                                                )}
                                                            />
                                                        </div>
                                                        <span>{item.label}</span>
                                                        {isActive && (
                                                            <motion.div
                                                                layoutId="mobileActiveIndicator"
                                                                className="mr-auto w-1.5 h-1.5 rounded-full bg-white"
                                                            />
                                                        )}
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>

                                {/* Divider */}
                                <motion.div
                                    variants={mobileItemVariants}
                                    className="h-px bg-gradient-to-l from-gray-200 via-gray-100 to-transparent dark:from-[#2e2e3a] dark:via-[#252530] dark:to-transparent"
                                />

                                {/* Auth Section */}
                                <motion.div variants={mobileItemVariants} className="space-y-2">
                                    {user ? (
                                        <AuthenticatedSection
                                            isUserAdmin={isUserAdmin}
                                            onClose={onClose}
                                            onSignOut={onSignOut}
                                        />
                                    ) : (
                                        <GuestSection onClose={onClose} />
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Helper Components
function UserProfileCard({ user }: { user: User }) {
    return (
        <motion.div variants={mobileItemVariants} className="relative">
            <div className="relative h-16 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
            <div className="relative -mt-8 px-4 pb-4">
                <div className="flex items-end gap-3">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#252530] p-0.5 shadow-lg ring-4 ring-white/50 dark:ring-[#1c1c24]/50">
                            <Avatar
                                src={user.user_metadata?.avatar_url}
                                name={user.user_metadata?.name}
                                email={user.email}
                                size="lg"
                                rounded="xl"
                                customGradient="from-primary-400 to-purple-500"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#1c1c24]" />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {user.user_metadata?.name || user.email?.split('@')[0]}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100/50 dark:border-amber-800/20">
                        <Trophy className="w-4 h-4 mx-auto text-amber-500 mb-0.5" />
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">150 نقطة</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100/50 dark:border-purple-800/20">
                        <Crown className="w-4 h-4 mx-auto text-purple-500 mb-0.5" />
                        <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400">#12 مرتبة</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/20">
                        <Zap className="w-4 h-4 mx-auto text-blue-500 mb-0.5" />
                        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">25 اختبار</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function AuthenticatedSection({
    isUserAdmin,
    onClose,
    onSignOut,
}: {
    isUserAdmin: boolean;
    onClose: () => void;
    onSignOut: () => Promise<void>;
}) {
    return (
        <>
            {isUserAdmin && (
                <Link
                    href="/admin"
                    onClick={onClose}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all border border-primary-100/50 dark:border-primary-800/30"
                >
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110 transition-transform">
                        <Shield className="h-4 w-4" />
                    </div>
                    <span>لوحة التحكم</span>
                    <Crown className="w-4 h-4 mr-auto text-primary-400" />
                </Link>
            )}
            <Link
                href="/profile"
                onClick={onClose}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a38] transition-all"
            >
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#2a2a38] group-hover:scale-110 transition-transform">
                    <UserCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <span>الملف الشخصي</span>
            </Link>
            <button
                onClick={onSignOut}
                className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all border border-red-100/50 dark:border-red-800/30"
            >
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:scale-110 transition-transform">
                    <LogOut className="h-4 w-4" />
                </div>
                <span>تسجيل الخروج</span>
            </button>
        </>
    );
}

function GuestSection({ onClose }: { onClose: () => void }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <Link
                href="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#252530] hover:bg-gray-200 dark:hover:bg-[#2a2a38] transition-all border border-gray-200/50 dark:border-[#2e2e3a]/50"
            >
                <LogIn className="h-4 w-4" />
                <span>تسجيل الدخول</span>
            </Link>
            <Link
                href="/signup"
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-l from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold transition-all shadow-lg shadow-primary-500/25"
            >
                <UserPlus className="h-4 w-4" />
                <span>إنشاء حساب</span>
            </Link>
        </div>
    );
}
