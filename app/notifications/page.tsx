"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Bell,
    BellRing,
    Check,
    CheckCheck,
    Trash2,
    ArrowRight,
    Settings,
    BookOpen,
    FileText,
    Trophy,
    User,
    Loader2,
    Clock,
    CreditCard,
    Users,
    Gift,
    Shield,
    Filter,
    RefreshCw,
    Inbox,
} from "lucide-react";
import {
    useNotifications,
    formatNotificationTime,
    NotificationType,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, typeof Bell> = {
    system: Settings,
    achievement: Trophy,
    quiz_result: FileText,
    new_content: BookOpen,
    subscription: CreditCard,
    reminder: Clock,
    social: Users,
    promotional: Gift,
    security: Shield,
    billing: CreditCard,
};

// Color mapping for notification types
const notificationColors: Record<
    NotificationType,
    { bg: string; text: string; gradient: string }
> = {
    system: {
        bg: "bg-violet-100 dark:bg-violet-900/30",
        text: "text-violet-600 dark:text-violet-400",
        gradient: "from-violet-500 to-purple-600",
    },
    achievement: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-400",
        gradient: "from-amber-500 to-orange-500",
    },
    quiz_result: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-600 dark:text-emerald-400",
        gradient: "from-emerald-500 to-teal-500",
    },
    new_content: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-600 dark:text-purple-400",
        gradient: "from-purple-500 to-pink-500",
    },
    subscription: {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        text: "text-pink-600 dark:text-pink-400",
        gradient: "from-pink-500 to-rose-500",
    },
    reminder: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-400",
        gradient: "from-blue-500 to-cyan-500",
    },
    social: {
        bg: "bg-teal-100 dark:bg-teal-900/30",
        text: "text-teal-600 dark:text-teal-400",
        gradient: "from-teal-500 to-green-500",
    },
    promotional: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-400",
        gradient: "from-orange-500 to-red-500",
    },
    security: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-600 dark:text-red-400",
        gradient: "from-red-500 to-rose-600",
    },
    billing: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-600 dark:text-green-400",
        gradient: "from-green-500 to-emerald-500",
    },
};

// Filter options
const filterOptions: { value: "all" | "unread" | NotificationType; label: string }[] = [
    { value: "all", label: "الكل" },
    { value: "unread", label: "غير مقروء" },
    { value: "system", label: "النظام" },
    { value: "achievement", label: "الإنجازات" },
    { value: "quiz_result", label: "نتائج الاختبارات" },
    { value: "new_content", label: "محتوى جديد" },
    { value: "reminder", label: "التذكيرات" },
];

export default function NotificationsPage() {
    const [filter, setFilter] = useState<"all" | "unread" | NotificationType>("all");

    const {
        notifications,
        unreadCount,
        loading,
        isAuthenticated,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch,
    } = useNotifications({ limit: 50, playSound: false });

    // Filter notifications
    const filteredNotifications = notifications.filter((n) => {
        if (filter === "all") return true;
        if (filter === "unread") return !n.is_read;
        return n.type === filter;
    });

    // Skeleton Loading Component
    const NotificationSkeleton = () => (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-[#2e2e3a] animate-pulse">
            <div className="flex gap-4">
                {/* Icon skeleton */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-100 dark:from-[#252530] dark:to-[#1c1c24] shrink-0" />

                {/* Content skeleton */}
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#252530] dark:via-[#2e2e3a] dark:to-[#252530] rounded-lg w-32 skeleton-shimmer" />
                        <div className="h-4 bg-primary-200 dark:bg-primary-900/30 rounded-full w-10" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#252530] dark:via-[#2e2e3a] dark:to-[#252530] rounded w-full skeleton-shimmer" />
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#252530] dark:via-[#2e2e3a] dark:to-[#252530] rounded w-3/4 skeleton-shimmer" />
                    </div>

                    {/* Footer skeleton */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2e2e3a]/50">
                        <div className="flex items-center gap-3">
                            <div className="h-4 bg-gray-200 dark:bg-[#252530] rounded w-16" />
                            <div className="h-5 bg-violet-100 dark:bg-violet-900/20 rounded-full w-14" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Loading state with skeleton
    if (loading) {
        return (
            <div
                className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]"
                dir="rtl"
            >
                <Navbar />
                <main className="relative z-10 py-8 pt-24">
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                        {/* Header Skeleton */}
                        <div className="mb-8 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-[#252530] rounded w-32 mb-6" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 opacity-50" />
                                    <div className="space-y-2">
                                        <div className="h-7 bg-gray-200 dark:bg-[#252530] rounded-lg w-28" />
                                        <div className="h-4 bg-gray-100 dark:bg-[#1c1c24] rounded w-36" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#252530]" />
                                    <div className="w-32 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/20" />
                                </div>
                            </div>
                        </div>

                        {/* Filter Skeleton */}
                        <div className="mb-6 animate-pulse">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                <div className="w-4 h-4 rounded bg-gray-200 dark:bg-[#252530]" />
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-9 rounded-xl ${i === 1
                                            ? "w-20 bg-primary-400/50"
                                            : "w-24 bg-gray-200 dark:bg-[#1c1c24]"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Notifications Skeleton */}
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        animationDelay: `${i * 100}ms`,
                                        opacity: 1 - i * 0.1,
                                    }}
                                >
                                    <NotificationSkeleton />
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        return (
            <div
                className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]"
                dir="rtl"
            >
                <Navbar />
                <main className="container mx-auto px-4 py-32 flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1c1c24] flex items-center justify-center">
                        <Bell className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            سجّل الدخول لعرض الإشعارات
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            يجب تسجيل الدخول لعرض الإشعارات الخاصة بك
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]"
            dir="rtl"
        >
            <Navbar />
            <main className="relative z-10 py-8 pt-24">
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 text-sm group"
                        >
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            <span>العودة للرئيسية</span>
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                                    <Bell className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                        الإشعارات
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {unreadCount > 0
                                            ? `${unreadCount} إشعار غير مقروء`
                                            : "لا توجد إشعارات جديدة"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={refetch}
                                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1c1c24] transition-colors border border-gray-200 dark:border-[#2e2e3a]"
                                    title="تحديث"
                                >
                                    <RefreshCw className="h-5 w-5 text-gray-500" />
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                        <span className="hidden sm:inline">تعيين الكل كمقروء</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Filter Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                    >
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                            {filterOptions.map((option) => {
                                const count =
                                    option.value === "all"
                                        ? notifications.length
                                        : option.value === "unread"
                                            ? unreadCount
                                            : notifications.filter((n) => n.type === option.value).length;

                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setFilter(option.value)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                                            filter === option.value
                                                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                                : "bg-gray-100 dark:bg-[#1c1c24] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#252530]"
                                        )}
                                    >
                                        <span>{option.label}</span>
                                        <span
                                            className={cn(
                                                "text-xs px-1.5 py-0.5 rounded-md",
                                                filter === option.value
                                                    ? "bg-white/20"
                                                    : "bg-gray-200 dark:bg-[#252530]"
                                            )}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Notifications List */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-[#1c1c24] rounded-3xl p-12 border border-gray-200/60 dark:border-[#2e2e3a] text-center"
                                >
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-[#252530] dark:to-[#1c1c24] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <Inbox className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {filter === "all"
                                            ? "لا توجد إشعارات"
                                            : filter === "unread"
                                                ? "لا توجد إشعارات غير مقروءة"
                                                : "لا توجد إشعارات من هذا النوع"}
                                    </h3>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                        {filter === "all"
                                            ? "ستظهر هنا الإشعارات الجديدة عند وصولها"
                                            : "جرّب تغيير الفلتر لعرض إشعارات أخرى"}
                                    </p>
                                </motion.div>
                            ) : (
                                filteredNotifications.map((notification, index) => {
                                    const Icon = notificationIcons[notification.type] || Bell;
                                    const colors = notificationColors[notification.type] || notificationColors.system;

                                    return (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ delay: index * 0.03 }}
                                            layout
                                            className={cn(
                                                "group relative bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border transition-all hover:shadow-lg",
                                                notification.is_read
                                                    ? "border-gray-200/60 dark:border-[#2e2e3a]"
                                                    : "border-primary-200 dark:border-primary-800/50 bg-gradient-to-l from-primary-50/50 dark:from-primary-950/20 to-transparent"
                                            )}
                                        >
                                            <div className="flex gap-4">
                                                {/* Icon */}
                                                <div
                                                    className={cn(
                                                        "p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-105",
                                                        notification.is_read
                                                            ? "bg-gray-100 dark:bg-[#252530]"
                                                            : colors.bg
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            "h-5 w-5",
                                                            notification.is_read
                                                                ? "text-gray-500"
                                                                : colors.text
                                                        )}
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3
                                                                    className={cn(
                                                                        "font-bold",
                                                                        notification.is_read
                                                                            ? "text-gray-700 dark:text-gray-300"
                                                                            : "text-gray-900 dark:text-white"
                                                                    )}
                                                                >
                                                                    {notification.title}
                                                                </h3>
                                                                {!notification.is_read && (
                                                                    <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold">
                                                                        جديد
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                                {notification.body}
                                                            </p>
                                                        </div>

                                                        {/* Unread indicator */}
                                                        {!notification.is_read && (
                                                            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shrink-0 mt-1.5 shadow-lg shadow-primary-500/30" />
                                                        )}
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-[#2e2e3a]/50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {formatNotificationTime(notification.created_at)}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                                                    colors.bg,
                                                                    colors.text
                                                                )}
                                                            >
                                                                {filterOptions.find((o) => o.value === notification.type)?.label ||
                                                                    String(notification.type)}
                                                            </span>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-20">
                                                            {!notification.is_read && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        markAsRead(notification.id);
                                                                    }}
                                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252530] transition-colors"
                                                                    title="تعيين كمقروء"
                                                                >
                                                                    <Check className="h-4 w-4 text-gray-500" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    deleteNotification(notification.id);
                                                                }}
                                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="حذف"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(() => {
                                                    const route = notification.data?.route;
                                                    if (typeof route === 'string') {
                                                        return (
                                                            <Link
                                                                href={route}
                                                                className="absolute inset-0 rounded-2xl"
                                                                onClick={() => {
                                                                    if (!notification.is_read) {
                                                                        markAsRead(notification.id);
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </motion.div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
