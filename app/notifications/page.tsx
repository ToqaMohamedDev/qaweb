"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Bell, BellRing, Check, CheckCheck, Trash2, ArrowRight, Settings, BookOpen, FileText, Trophy, Sparkles, User, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: typeof Bell;
}

const iconMap: Record<string, typeof Bell> = {
    exam: FileText,
    achievement: Trophy,
    lesson: BookOpen,
    system: Settings,
    teacher: User,
    default: BellRing,
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            // جلب الإشعارات من قاعدة البيانات
            const { data, error } = await supabase.from("notifications").select("*").eq("status", "sent").order("sent_at", { ascending: false });

            if (error) {
                // إذا لم يوجد الجدول، استخدم بيانات mock
                console.log("Using mock data:", error.message);
                setNotifications(mockNotifications);
            } else if (data && data.length > 0) {
                // تحويل البيانات للشكل المطلوب
                setNotifications(data.map(n => ({
                    id: n.id,
                    type: "system",
                    title: n.title,
                    message: n.message,
                    time: getTimeAgo(n.sent_at || n.created_at),
                    read: false,
                    icon: iconMap[n.target_role] || iconMap.default,
                })));
            } else {
                setNotifications(mockNotifications);
            }
        } catch (err) {
            console.error(err);
            setNotifications(mockNotifications);
        } finally {
            setLoading(false);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return "الآن";
        if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
        if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
        if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
        return new Date(dateStr).toLocaleDateString("ar-SA");
    };

    const mockNotifications: Notification[] = [
        { id: "1", type: "exam", title: "امتحان جديد متاح!", message: "تم إضافة امتحان النحو الشامل من أ/ محمد أحمد", time: "منذ 5 دقائق", read: false, icon: FileText },
        { id: "2", type: "achievement", title: "إنجاز جديد! 🏆", message: "حصلت على شارة 'المتميز' لإكمال 10 امتحانات", time: "منذ ساعة", read: false, icon: Trophy },
        { id: "3", type: "lesson", title: "درس جديد", message: "تمت إضافة درس 'البلاغة المتقدمة' للغة العربية", time: "منذ 3 ساعات", read: true, icon: BookOpen },
        { id: "4", type: "system", title: "تحديث النظام", message: "تم تحسين سرعة المنصة وإضافة ميزات جديدة", time: "منذ يوم", read: true, icon: Settings },
        { id: "5", type: "exam", title: "نتيجة امتحان", message: "حصلت على 95% في امتحان القواعد النحوية", time: "منذ يومين", read: true, icon: FileText },
        { id: "6", type: "teacher", title: "معلم جديد", message: "أ/ سارة علي انضمت للمنصة كمعلمة للغة الإنجليزية", time: "منذ 3 أيام", read: true, icon: User },
    ];

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const filteredNotifications = filter === "unread" ? notifications.filter(n => !n.read) : notifications;
    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir="rtl">
                <Navbar />
                <main className="container mx-auto px-4 py-20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir="rtl">
            <Navbar />
            <main className="relative z-10 py-8">
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 text-sm">
                            <ArrowRight className="h-4 w-4" />
                            <span>العودة للرئيسية</span>
                        </Link>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                                    <Bell className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">الإشعارات</h1>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{unreadCount > 0 ? `${unreadCount} إشعارات غير مقروءة` : "لا توجد إشعارات جديدة"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={fetchNotifications} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><RefreshCw className="h-5 w-5 text-gray-500" /></button>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
                                        <CheckCheck className="h-4 w-4" />
                                        <span className="hidden sm:inline">تعيين الكل كمقروء</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Filter Tabs */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-6">
                        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "all" ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"}`}>
                            الكل ({notifications.length})
                        </button>
                        <button onClick={() => setFilter("unread")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === "unread" ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"}`}>
                            غير مقروء ({unreadCount})
                        </button>
                    </motion.div>

                    {/* Notifications List */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.length === 0 ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-12 border border-gray-200/60 dark:border-[#2e2e3a] text-center">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                        <Bell className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد إشعارات</h3>
                                    <p className="text-gray-500 text-sm">سيظهر هنا أي إشعارات جديدة</p>
                                </motion.div>
                            ) : (
                                filteredNotifications.map((notification, index) => {
                                    const IconComponent = notification.icon;
                                    return (
                                        <motion.div key={notification.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: index * 0.05 }} layout className={`group relative bg-white dark:bg-[#1c1c24] rounded-xl p-4 border transition-all hover:shadow-md ${notification.read ? "border-gray-200/60 dark:border-[#2e2e3a]" : "border-primary-200 dark:border-primary-800/50 bg-primary-50/30 dark:bg-primary-950/10"}`}>
                                            <div className="flex gap-4">
                                                <div className={`p-3 rounded-xl shrink-0 ${notification.read ? "bg-gray-100 dark:bg-gray-800" : "bg-primary-100 dark:bg-primary-900/30"}`}>
                                                    <IconComponent className={`h-5 w-5 ${notification.read ? "text-gray-500" : "text-primary-600"}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className={`font-semibold mb-1 ${notification.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>{notification.title}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{notification.message}</p>
                                                        </div>
                                                        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-xs text-gray-400">{notification.time}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!notification.read && (
                                                                <button onClick={() => markAsRead(notification.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="تعيين كمقروء">
                                                                    <Check className="h-4 w-4 text-gray-500" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => deleteNotification(notification.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="حذف">
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
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
