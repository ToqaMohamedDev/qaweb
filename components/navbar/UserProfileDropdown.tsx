'use client';

// =============================================
// UserProfileDropdown - القائمة المنسدلة للمستخدم
// =============================================

import { useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User as UserIcon,
    UserCircle,
    ChevronDown,
    Shield,
    Settings,
    LogOut,
    Trophy,
    Crown,
    Zap,
    Star,
    Sparkles,
    ArrowLeft,
    BookOpen,
} from 'lucide-react';
import { dropdownVariants, itemVariants, floatingVariants, glowVariants } from '@/lib/animations';
import { Avatar } from '@/components/common';
import type { User } from '@supabase/supabase-js';

interface UserProfileDropdownProps {
    user: User;
    isUserAdmin: boolean;
    isApprovedTeacher?: boolean;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onSignOut: () => Promise<void>;
}

export function UserProfileDropdown({
    user,
    isUserAdmin,
    isApprovedTeacher = false,
    isOpen,
    onToggle,
    onClose,
    onSignOut,
}: UserProfileDropdownProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Click outside handler
    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
            isOpen &&
            menuRef.current &&
            !menuRef.current.contains(target) &&
            buttonRef.current &&
            !buttonRef.current.contains(target)
        ) {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, handleClickOutside]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={onToggle}
                className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-gray-50 dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] hover:border-gray-300 dark:hover:border-[#3e3e4a] transition-all"
            >
                <Avatar
                    src={user.user_metadata?.avatar_url}
                    name={user.user_metadata?.name}
                    email={user.email}
                    size="sm"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={menuRef}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ perspective: '1000px' }}
                        className="absolute top-full left-0 mt-4 w-80 rounded-3xl bg-white/80 dark:bg-[#1a1a24]/90 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6)] overflow-hidden"
                    >
                        {/* Premium Gradient Header */}
                        <div className="relative h-28 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-400/30 via-transparent to-transparent" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent" />

                            {/* Floating decorative elements */}
                            <motion.div
                                variants={floatingVariants}
                                initial="initial"
                                animate="animate"
                                className="absolute top-3 right-4"
                            >
                                <Sparkles className="w-5 h-5 text-white/40" />
                            </motion.div>
                            <motion.div
                                variants={floatingVariants}
                                initial="initial"
                                animate="animate"
                                className="absolute bottom-6 left-6"
                            >
                                <Star className="w-4 h-4 text-white/30" />
                            </motion.div>

                            {/* Glow effects */}
                            <motion.div
                                variants={glowVariants}
                                initial="initial"
                                animate="animate"
                                className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"
                            />
                        </div>

                        {/* User Avatar */}
                        <div className="relative -mt-14 px-5">
                            <div className="flex items-end gap-4">
                                <motion.div variants={itemVariants} className="relative group">
                                    <div className="absolute -inset-1.5 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity" />
                                    <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-[#252530] p-1.5 shadow-xl ring-4 ring-white/80 dark:ring-[#1a1a24]/80">
                                        <Avatar
                                            src={user?.user_metadata?.avatar_url}
                                            name={user?.user_metadata?.name}
                                            email={user?.email}
                                            size="xl"
                                            rounded="xl"
                                            customGradient="from-violet-500 via-purple-500 to-fuchsia-500"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-[3px] border-white dark:border-[#1a1a24] shadow-lg flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                                    </div>
                                </motion.div>
                                <motion.div variants={itemVariants} className="flex-1 min-w-0 pb-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                            {user?.user_metadata?.name || user?.email?.split('@')[0]}
                                        </h3>
                                        <div className="flex-shrink-0 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-white uppercase tracking-wider">
                                            VIP
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email}
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <motion.div variants={itemVariants} className="px-5 py-4 mt-2">
                            <div className="grid grid-cols-3 gap-3">
                                <StatCard
                                    icon={Trophy}
                                    value="150"
                                    label="نقطة"
                                    gradient="from-amber-400 to-orange-500"
                                    bgGradient="from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40"
                                />
                                <StatCard
                                    icon={Crown}
                                    value="#12"
                                    label="مرتبة"
                                    gradient="from-violet-500 to-purple-600"
                                    bgGradient="from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40"
                                />
                                <StatCard
                                    icon={Zap}
                                    value="25"
                                    label="اختبار"
                                    gradient="from-cyan-400 to-blue-500"
                                    bgGradient="from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40"
                                />
                            </div>
                        </motion.div>

                        {/* Menu Items */}
                        <div className="px-3 pb-3 space-y-1">
                            {isUserAdmin && (
                                <motion.div variants={itemVariants}>
                                    <MenuLink
                                        href="/admin"
                                        icon={Shield}
                                        label="لوحة التحكم"
                                        description="إدارة المحتوى والمستخدمين"
                                        variant="primary"
                                    />
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants}>
                                <MenuLink
                                    href="/profile"
                                    icon={UserIcon}
                                    label="الملف الشخصي"
                                    description="عرض وتعديل بياناتك"
                                />
                            </motion.div>

                            {isApprovedTeacher && !isUserAdmin && (
                                <motion.div variants={itemVariants}>
                                    <MenuLink
                                        href="/teacher"
                                        icon={BookOpen}
                                        label="لوحة المدرس"
                                        description="إدارة امتحاناتك وطلابك"
                                        variant="primary"
                                    />
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants}>
                                <MenuLink
                                    href="/settings"
                                    icon={Settings}
                                    label="الإعدادات"
                                    description="تخصيص التطبيق"
                                />
                            </motion.div>

                            {/* Divider */}
                            <motion.div variants={itemVariants} className="py-2">
                                <div className="h-px bg-gradient-to-l from-gray-200 via-gray-300/50 to-transparent dark:from-gray-700 dark:via-gray-600/30 dark:to-transparent" />
                            </motion.div>

                            {/* Logout Button */}
                            <motion.div variants={itemVariants}>
                                <button
                                    onClick={onSignOut}
                                    className="group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl overflow-hidden transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-l from-red-100 via-rose-50 to-transparent dark:from-red-900/30 dark:via-rose-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-rose-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
                                        <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="relative text-red-600 dark:text-red-400">
                                        تسجيل الخروج
                                    </span>
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper Components
interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
    gradient: string;
    bgGradient: string;
}

function StatCard({ icon: Icon, value, label, gradient, bgGradient }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative group cursor-pointer"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-sm opacity-0 group-hover:opacity-40 transition-opacity`} />
            <div className={`relative text-center p-3 rounded-2xl bg-gradient-to-br ${bgGradient} border border-opacity-50 shadow-sm`}>
                <div className={`w-8 h-8 mx-auto mb-1.5 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <p className={`text-sm font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
                    {value}
                </p>
                <p className="text-[10px] font-medium opacity-70">{label}</p>
            </div>
        </motion.div>
    );
}

interface MenuLinkProps {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    variant?: 'default' | 'primary';
}

function MenuLink({ href, icon: Icon, label, description, variant = 'default' }: MenuLinkProps) {
    const isPrimary = variant === 'primary';

    return (
        <Link
            href={href}
            className="group relative flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl overflow-hidden transition-all duration-300"
        >
            <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isPrimary
                    ? 'bg-gradient-to-l from-violet-100 via-purple-50 to-transparent dark:from-violet-900/30 dark:via-purple-900/20 dark:to-transparent'
                    : 'bg-gradient-to-l from-gray-100 via-gray-50 to-transparent dark:from-gray-800/50 dark:via-gray-800/30 dark:to-transparent'
                    }`}
            />
            <div
                className={`relative p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-all duration-300 ${isPrimary
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25 group-hover:shadow-violet-500/40'
                    : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                    }`}
            >
                <Icon className={`w-4 h-4 ${isPrimary ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
            </div>
            <div className="relative flex-1">
                <span className={isPrimary ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200'}>
                    {label}
                </span>
                <p className={`text-[10px] font-normal ${isPrimary ? 'text-violet-500/60 dark:text-violet-400/50' : 'text-gray-500/60 dark:text-gray-400/50'}`}>
                    {description}
                </p>
            </div>
            <div
                className={`relative w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 ${isPrimary ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}
            >
                <ArrowLeft className={`w-4 h-4 ${isPrimary ? 'text-violet-600 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'}`} />
            </div>
        </Link>
    );
}
