'use client';

// =============================================
// ProfileSidebar Component - الشريط الجانبي للملف الشخصي
// =============================================

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Mail,
    Shield,
    BookOpen,
    Calendar,
    ChevronLeft,
    Edit3,
    LogOut,
    Crown,
    CheckCircle,
    GraduationCap,
    TrendingUp,
    Bell,
    FileText,
    Heart,
} from 'lucide-react';
import { Avatar } from '@/components/common';
import type { UserProfile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

interface ProfileSidebarProps {
    user: User;
    profile: UserProfile | null;
    userLevel: number;
    levelProgress: number;
    onEditClick: () => void;
    onLogout: () => void;
}

export function ProfileSidebar({
    user,
    profile,
    userLevel,
    levelProgress,
    onEditClick,
    onLogout,
}: ProfileSidebarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-gray-800/60 overflow-hidden sticky top-24 shadow-xl shadow-gray-200/50 dark:shadow-black/20"
        >
            {/* Cover with Pattern */}
            <div className="h-32 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-40" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent" />

                {/* Level Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                    <Crown className="h-3.5 w-3.5" />
                    <span>المستوى {userLevel}</span>
                </div>
            </div>

            {/* Avatar */}
            <div className="relative px-5 pb-5">
                <div className="absolute -top-14 right-5">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-3xl bg-white dark:bg-[#1c1c24] p-1.5 shadow-2xl ring-4 ring-white dark:ring-gray-900">
                            <Avatar
                                src={profile?.avatarUrl}
                                name={profile?.name}
                                email={user.email}
                                size="2xl"
                                rounded="2xl"
                                customGradient="from-violet-500 via-purple-500 to-fuchsia-500"
                            />
                        </div>
                        {profile?.role === 'admin' && (
                            <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-white dark:ring-gray-900">
                                <Shield className="h-4 w-4 text-white" />
                            </div>
                        )}
                        {profile?.isVerified && (
                            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900">
                                <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-16">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {profile?.name || 'مستخدم جديد'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                    </p>

                    {profile?.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                            {profile.bio}
                        </p>
                    )}

                    {/* Level Progress */}
                    <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-800/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                                تقدم المستوى
                            </span>
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                {levelProgress}%
                            </span>
                        </div>
                        <div className="h-2 bg-violet-200 dark:bg-violet-900/50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${levelProgress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Role Badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${profile?.role === 'admin'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                : profile?.role === 'teacher'
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {profile?.role === 'admin' ? (
                                <>
                                    <Shield className="h-3 w-3" /> مسؤول
                                </>
                            ) : profile?.role === 'teacher' ? (
                                <>
                                    <BookOpen className="h-3 w-3" /> معلم
                                </>
                            ) : (
                                <>
                                    <GraduationCap className="h-3 w-3" /> طالب
                                </>
                            )}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            منذ{' '}
                            {new Date(profile?.createdAt || user.created_at).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                            })}
                        </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-gray-800/60 space-y-3">
                        {/* Teacher Dashboard - Only show for teachers (NOT admins, NOT students) */}
                        {profile?.role === 'teacher' && (
                            <Link
                                href="/teacher"
                                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all text-sm font-bold shadow-lg shadow-primary-500/25 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                        <GraduationCap className="h-4 w-4" />
                                    </div>
                                    <div className="text-right">
                                        <span className="block">لوحة المدرس</span>
                                        <span className="text-xs font-normal opacity-80">إدارة امتحاناتك وطلابك</span>
                                    </div>
                                </div>
                                <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                        )}

                        {/* Quick Links */}
                        <div className="space-y-2">
                            {/* Learning Progress */}
                            <Link
                                href="/profile/progress"
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                        <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">تقدم التعلم</span>
                                </div>
                                <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:-translate-x-1 transition-transform" />
                            </Link>

                            {/* Exam History */}
                            <Link
                                href="/profile/exam-history"
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">تاريخ الامتحانات</span>
                                </div>
                                <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:-translate-x-1 transition-transform" />
                            </Link>

                            {/* My Subscriptions */}
                            <Link
                                href="/profile/subscriptions"
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                        <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">اشتراكاتي</span>
                                </div>
                                <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:-translate-x-1 transition-transform" />
                            </Link>

                            {/* Notification Settings */}
                            <Link
                                href="/profile/notification-settings"
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">إعدادات الإشعارات</span>
                                </div>
                                <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={onEditClick}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all text-sm font-medium"
                            >
                                <Edit3 className="h-4 w-4" />
                                <span>تعديل</span>
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-medium"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>خروج</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
