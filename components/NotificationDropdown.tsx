"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    BellRing,
    Check,
    CheckCheck,
    Trash2,
    Settings,
    Trophy,
    BookOpen,
    FileText,
    User,
    Sparkles,
    AlertCircle,
    Gift,
    Shield,
    CreditCard,
    Clock,
    Users,
    Megaphone,
    ArrowLeft,
    Loader2,
    X,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatNotificationTime, NotificationType } from "@/lib/notifications";
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
    { bg: string; text: string; border: string }
> = {
    system: {
        bg: "bg-violet-100 dark:bg-violet-900/30",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-200 dark:border-violet-800/50",
    },
    achievement: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800/50",
    },
    quiz_result: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800/50",
    },
    new_content: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800/50",
    },
    subscription: {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        text: "text-pink-600 dark:text-pink-400",
        border: "border-pink-200 dark:border-pink-800/50",
    },
    reminder: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800/50",
    },
    social: {
        bg: "bg-teal-100 dark:bg-teal-900/30",
        text: "text-teal-600 dark:text-teal-400",
        border: "border-teal-200 dark:border-teal-800/50",
    },
    promotional: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800/50",
    },
    security: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-200 dark:border-red-800/50",
    },
    billing: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800/50",
    },
};

// Animation variants
const dropdownVariants = {
    hidden: {
        opacity: 0,
        y: -10,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 350,
            damping: 25,
            staggerChildren: 0.03,
            delayChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        scale: 0.98,
        transition: { duration: 0.15 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: "spring" as const, stiffness: 400, damping: 25 },
    },
};

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const {
        notifications,
        unreadCount,
        loading,
        isAuthenticated,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications({ limit: 10, playSound: true });

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    if (!isAuthenticated) {
        return (
            <Link
                href="/login"
                className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1c1c24] transition-colors"
                aria-label="تسجيل الدخول للإشعارات"
            >
                <Bell className="h-5 w-5" />
            </Link>
        );
    }

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-200",
                    isOpen
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1c1c24]"
                )}
                aria-label={`الإشعارات ${unreadCount > 0 ? `(${unreadCount} جديد)` : ""}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {unreadCount > 0 ? (
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <BellRing className="h-5 w-5" />
                    </motion.div>
                ) : (
                    <Bell className="h-5 w-5" />
                )}

                {/* Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 mt-3 w-[380px] max-h-[70vh] rounded-2xl bg-white/95 dark:bg-[#1a1a24]/95 backdrop-blur-xl border border-gray-200/60 dark:border-[#2e2e3a]/60 shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 px-4 py-3 bg-white/90 dark:bg-[#1a1a24]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#2e2e3a]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
                                        <Bell className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                            الإشعارات
                                        </h3>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {unreadCount > 0
                                                ? `${unreadCount} غير مقروء`
                                                : "لا توجد إشعارات جديدة"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsRead()}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252530] transition-colors"
                                            title="تعيين الكل كمقروء"
                                        >
                                            <CheckCheck className="h-4 w-4 text-primary-500" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252530] transition-colors"
                                    >
                                        <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto max-h-[400px] overscroll-contain">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#252530] flex items-center justify-center mx-auto mb-4">
                                        <Bell className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                        لا توجد إشعارات
                                    </p>
                                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                        ستظهر الإشعارات الجديدة هنا
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-[#2e2e3a]/50">
                                    {notifications.map((notification, index) => {
                                        const Icon =
                                            notificationIcons[notification.type] || Bell;
                                        const colors = notificationColors[notification.type] || notificationColors.system;

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                variants={itemVariants}
                                                className={cn(
                                                    "group relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252530]/50 transition-colors cursor-pointer",
                                                    !notification.is_read &&
                                                    "bg-primary-50/40 dark:bg-primary-950/20"
                                                )}
                                                onClick={() => {
                                                    if (!notification.is_read) {
                                                        markAsRead(notification.id);
                                                    }
                                                    // Navigate if there's a route in data
                                                    if (notification.data?.route) {
                                                        window.location.href =
                                                            notification.data.route as string;
                                                    }
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Icon */}
                                                    <div
                                                        className={cn(
                                                            "p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                                                            colors.bg
                                                        )}
                                                    >
                                                        <Icon className={cn("h-4 w-4", colors.text)} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h4
                                                                    className={cn(
                                                                        "text-sm font-semibold truncate",
                                                                        notification.is_read
                                                                            ? "text-gray-700 dark:text-gray-300"
                                                                            : "text-gray-900 dark:text-white"
                                                                    )}
                                                                >
                                                                    {notification.title}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                                    {notification.body}
                                                                </p>
                                                            </div>

                                                            {/* Unread indicator */}
                                                            {!notification.is_read && (
                                                                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                                                            )}
                                                        </div>

                                                        {/* Time & Actions */}
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                                {formatNotificationTime(
                                                                    notification.created_at
                                                                )}
                                                            </span>

                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!notification.is_read && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markAsRead(notification.id);
                                                                        }}
                                                                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#353545] transition-colors"
                                                                        title="تعيين كمقروء"
                                                                    >
                                                                        <Check className="h-3.5 w-3.5 text-gray-500" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteNotification(notification.id);
                                                                    }}
                                                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                                                    title="حذف"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="sticky bottom-0 p-3 bg-gray-50/90 dark:bg-[#151520]/90 backdrop-blur-md border-t border-gray-100 dark:border-[#2e2e3a]">
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-[#252530] hover:bg-gray-200 dark:hover:bg-[#2e2e40] text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
                                >
                                    <span>عرض كل الإشعارات</span>
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default NotificationDropdown;
