'use client';

// =============================================
// UserProfileDropdown - القائمة المنسدلة للمستخدم
// =============================================

import { useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User as UserIcon,
    ChevronDown,
    Shield,
    LogOut,
    Trophy,
    Crown,
    Zap,
    Sparkles,
    ArrowLeft,
    BookOpen,
} from 'lucide-react';
import { dropdownVariants, itemVariants } from '@/lib/animations';
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
                        className="absolute top-full left-0 mt-3 w-[360px] rounded-2xl bg-white dark:bg-[#1c1c24] backdrop-blur-xl border border-gray-200/80 dark:border-[#2e2e3a] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden"
                    >
                        {/* Elegant Gradient Header */}
                        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
                            {/* Subtle pattern overlay */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                    backgroundSize: '24px 24px'
                                }} />
                            </div>
                            
                            {/* Soft glow effect */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl" />
                            
                            {/* Minimal decorative icons */}
                            <motion.div
                                animate={{ 
                                    y: [0, -8, 0],
                                    opacity: [0.3, 0.5, 0.3]
                                }}
                                transition={{ 
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute top-4 right-5"
                            >
                                <Sparkles className="w-5 h-5 text-white/40" />
                            </motion.div>
                        </div>

                        {/* User Profile Section */}
                        <div className="relative -mt-16 px-6">
                            <div className="flex items-end gap-4 mb-4">
                                {/* Avatar with refined styling */}
                                <motion.div 
                                    variants={itemVariants} 
                                    className="relative"
                                >
                                    <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-[#252530] p-1.5 shadow-xl">
                                        <Avatar
                                            src={user?.user_metadata?.avatar_url}
                                            name={user?.user_metadata?.name}
                                            email={user?.email}
                                            size="xl"
                                            rounded="xl"
                                            customGradient="from-violet-500 via-purple-500 to-indigo-600"
                                        />
                                    </div>
                                </motion.div>
                                
                                {/* User info */}
                                <motion.div variants={itemVariants} className="flex-1 min-w-0 pb-2">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1">
                                        {user?.user_metadata?.name || user?.email?.split('@')[0]}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email}
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Stats Cards - Refined Design */}
                        <motion.div variants={itemVariants} className="px-6 pb-5">
                            <div className="grid grid-cols-3 gap-2.5">
                                <StatCard
                                    icon={Trophy}
                                    value="150"
                                    label="نقطة"
                                    gradient="from-amber-500 to-orange-600"
                                    iconBg="bg-amber-500"
                                />
                                <StatCard
                                    icon={Crown}
                                    value="#12"
                                    label="مرتبة"
                                    gradient="from-violet-500 to-purple-600"
                                    iconBg="bg-violet-500"
                                />
                                <StatCard
                                    icon={Zap}
                                    value="25"
                                    label="اختبار"
                                    gradient="from-cyan-500 to-blue-600"
                                    iconBg="bg-cyan-500"
                                />
                            </div>
                        </motion.div>

                        {/* Divider */}
                        <div className="px-6 pb-3">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                        </div>

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

                            {/* Divider */}
                            <motion.div variants={itemVariants} className="py-1.5">
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                            </motion.div>

                            {/* Logout Button - Refined */}
                            <motion.div variants={itemVariants}>
                                <button
                                    onClick={onSignOut}
                                    className="group relative w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl overflow-hidden transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                    <div className="relative p-2 rounded-lg bg-red-50 dark:bg-red-950/30 group-hover:bg-red-500 transition-all duration-200">
                                        <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="relative text-red-600 dark:text-red-400 font-semibold">
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
    iconBg: string;
}

function StatCard({ icon: Icon, value, label, gradient, iconBg }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="relative group cursor-pointer"
        >
            <div className="relative text-center p-3.5 rounded-xl bg-gray-50/80 dark:bg-[#252530]/50 border border-gray-200/60 dark:border-[#2e2e3a]/60 hover:border-gray-300 dark:hover:border-[#3e3e4a] transition-all duration-200">
                <div className={`w-9 h-9 mx-auto mb-2 rounded-lg ${iconBg} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <p className={`text-base font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent mb-0.5`}>
                    {value}
                </p>
                <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{label}</p>
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
            className="group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl overflow-hidden transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#252530]/50"
        >
            <div
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                    isPrimary
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm'
                        : 'bg-gray-100 dark:bg-[#252530] group-hover:bg-gray-200 dark:group-hover:bg-[#2e2e3a]'
                }`}
            >
                <Icon className={`w-4 h-4 ${isPrimary ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
            </div>
            <div className="relative flex-1 min-w-0">
                <div className={`font-semibold truncate ${isPrimary ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
                    {label}
                </div>
                <p className={`text-[11px] font-normal truncate ${isPrimary ? 'text-violet-500/70 dark:text-violet-400/60' : 'text-gray-500 dark:text-gray-400'}`}>
                    {description}
                </p>
            </div>
            <div
                className={`relative w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 ${
                    isPrimary ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-gray-100 dark:bg-[#252530]'
                }`}
            >
                <ArrowLeft className={`w-3.5 h-3.5 ${isPrimary ? 'text-violet-600 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'}`} />
            </div>
        </Link>
    );
}
