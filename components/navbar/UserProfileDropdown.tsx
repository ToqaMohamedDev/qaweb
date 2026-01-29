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
                        className="absolute top-full left-0 mt-3 w-[300px] rounded-2xl bg-white dark:bg-[#1c1c24] backdrop-blur-xl border border-gray-200/80 dark:border-[#2e2e3a] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden"
                    >
                        {/* Compact User Profile Section */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <motion.div variants={itemVariants} className="relative">
                                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-0.5 shadow-lg">
                                        <div className="w-full h-full rounded-[10px] overflow-hidden bg-white dark:bg-[#252530]">
                                            <Avatar
                                                src={user?.user_metadata?.avatar_url}
                                                name={user?.user_metadata?.name}
                                                email={user?.email}
                                                size="lg"
                                                rounded="xl"
                                                customGradient="from-violet-500 via-purple-500 to-indigo-600"
                                            />
                                        </div>
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#1c1c24]" />
                                </motion.div>
                                
                                {/* User info */}
                                <motion.div variants={itemVariants} className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {user?.user_metadata?.name || user?.email?.split('@')[0]}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email}
                                    </p>
                                </motion.div>
                                
                                {/* Sparkle decoration */}
                                <Sparkles className="w-4 h-4 text-violet-400 opacity-60" />
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 space-y-0.5">
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
                            <div className="my-1 mx-2 h-px bg-gray-100 dark:bg-gray-800" />

                            {/* Logout Button */}
                            <motion.div variants={itemVariants}>
                                <button
                                    onClick={onSignOut}
                                    className="group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 group-hover:bg-red-500 transition-all duration-200">
                                        <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-red-600 dark:text-red-400 font-medium">
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
            className="group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-[#252530]/50"
        >
            <div
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isPrimary
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm'
                        : 'bg-gray-100 dark:bg-[#252530] group-hover:bg-gray-200 dark:group-hover:bg-[#2e2e3a]'
                }`}
            >
                <Icon className={`w-4 h-4 ${isPrimary ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${isPrimary ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
                    {label}
                </div>
                <p className={`text-[10px] font-normal truncate ${isPrimary ? 'text-violet-500/70 dark:text-violet-400/60' : 'text-gray-500 dark:text-gray-400'}`}>
                    {description}
                </p>
            </div>
            <ArrowLeft className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isPrimary ? 'text-violet-500' : 'text-gray-400'}`} />
        </Link>
    );
}
