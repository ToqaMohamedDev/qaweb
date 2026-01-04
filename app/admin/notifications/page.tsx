"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    Search,
    Plus,
    Trash2,
    Send,
    Users,
    User,
    GraduationCap,
    Clock,
    CheckCheck,
    X,
    Loader2,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Shield,
    Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { DeleteConfirmModal } from "@/components/admin";
import { useUIStore } from "@/lib/stores";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const targetTypes: Record<string, { label: string; icon: typeof Users; color: string }> = {
    all: { label: "الجميع", icon: Users, color: "bg-primary-100 dark:bg-primary-900/30 text-primary-600" },
    students: { label: "الطلاب", icon: User, color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    teachers: { label: "المعلمين", icon: GraduationCap, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
    admins: { label: "المشرفين", icon: Shield, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
};

const statusTypes: Record<string, { label: string; color: string }> = {
    sent: { label: "تم الإرسال", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    pending: { label: "معلق", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
    failed: { label: "فشل", color: "bg-red-100 dark:bg-red-900/30 text-red-600" },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        target_role: "all" as Notification["target_role"],
        status: "draft" as Notification["status"],
        scheduled_for: ""
    });
    const [userCounts, setUserCounts] = useState({ all: 0, students: 0, teachers: 0, admins: 0 });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; title: string }>({
        isOpen: false,
        id: null,
        title: ""
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const { addToast } = useUIStore();
    const itemsPerPage = 10;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();

            // جلب عدد المستخدمين
            const { data: profiles } = await supabase.from("profiles").select("role");
            const students = profiles?.filter(p => p.role === "student").length || 0;
            const teachers = profiles?.filter(p => p.role === "teacher").length || 0;
            const admins = profiles?.filter(p => p.role === "admin").length || 0;
            setUserCounts({ all: (profiles?.length || 0), students, teachers, admins });

            // جلب الإشعارات
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                if (error.code === "42P01") {
                    setError("جدول الإشعارات غير موجود. يرجى تنفيذ الـ migration أولاً.");
                    return;
                }
                throw error;
            }
            setNotifications(data || []);
        } catch (err: any) {
            setError(err.message || "حدث خطأ في جلب البيانات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = notifications.filter((n) => {
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.message.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || n.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const stats = [
        { label: "إجمالي الإشعارات", value: notifications.length, icon: Bell, color: "primary" },
        { label: "تم الإرسال", value: notifications.filter(n => n.status === "sent").length, icon: CheckCheck, color: "green" },
        { label: "معلق", value: notifications.filter(n => n.status === "pending").length, icon: Clock, color: "amber" },
    ];

    const handleNew = () => {
        setSelectedNotification(null);
        setFormData({ title: "", message: "", target_role: "all", status: "pending", scheduled_for: "" });
        setShowModal(true);
    };

    const handleEdit = (notification: Notification) => {
        setSelectedNotification(notification);
        setFormData({
            title: notification.title,
            message: notification.message,
            target_role: notification.target_role,
            status: notification.status,
            scheduled_for: notification.scheduled_for || ""
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.message) {
            addToast({ type: 'error', message: 'يرجى ملء جميع الحقول المطلوبة' });
            return;
        }
        setSaving(true);
        try {
            const supabase = createClient();
            const now = new Date().toISOString();

            if (selectedNotification) {
                const { error } = await supabase
                    .from("notifications")
                    .update({
                        title: formData.title,
                        message: formData.message,
                        target_role: formData.target_role,
                        status: formData.status,
                        sent_at: formData.status === "sent" ? now : null,
                        scheduled_for: formData.scheduled_for || null,
                        updated_at: now
                    })
                    .eq("id", selectedNotification.id);
                if (error) throw error;
                addToast({ type: 'success', message: 'تم تحديث الإشعار بنجاح' });
            } else {
                const { error } = await supabase
                    .from("notifications")
                    .insert({
                        title: formData.title,
                        message: formData.message,
                        target_role: formData.target_role,
                        status: formData.status,
                        sent_at: formData.status === "sent" ? now : null,
                        scheduled_for: formData.scheduled_for || null
                    });
                if (error) throw error;
                addToast({ type: 'success', message: 'تم إنشاء الإشعار بنجاح' });
            }

            await fetchData();
            setShowModal(false);
        } catch (err: any) {
            addToast({ type: 'error', message: err.message || 'حدث خطأ' });
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (notification: Notification) => {
        setDeleteModal({ isOpen: true, id: notification.id, title: notification.title });
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("notifications").delete().eq("id", deleteModal.id);
            if (error) throw error;
            await fetchData();
            setDeleteModal({ isOpen: false, id: null, title: "" });
            addToast({ type: 'success', message: 'تم حذف الإشعار بنجاح' });
        } catch (err: any) {
            addToast({ type: 'error', message: err.message || 'حدث خطأ' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSend = async (notification: Notification) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("notifications")
                .update({
                    status: "sent",
                    sent_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq("id", notification.id);
            if (error) throw error;
            await fetchData();
            addToast({
                type: 'success',
                message: `تم إرسال "${notification.title}" إلى ${userCounts[notification.target_role || 'all']} مستخدم`
            });
        } catch (err: any) {
            addToast({ type: 'error', message: err.message || 'حدث خطأ' });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
                <p className="text-gray-500">جاري تحميل الإشعارات...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-600 mb-2">حدث خطأ</h3>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <Megaphone className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">إدارة الإشعارات</h1>
                            <p className="text-white/70 text-sm">إرسال إشعارات للمستخدمين وإدارتها</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-lg"
                        >
                            <Plus className="h-4 w-4" />
                            <span>إشعار جديد</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200 dark:border-[#2e2e3a]">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-900/30`}>
                                <s.icon className={`h-5 w-5 text-${s.color}-600 dark:text-${s.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200 dark:border-[#2e2e3a]">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث في الإشعارات..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-sm focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">جميع الحالات</option>
                        <option value="sent">تم الإرسال</option>
                        <option value="pending">معلق</option>
                        <option value="sent">تم الإرسال</option>
                        <option value="failed">فشل</option>
                    </select>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-[#252530]">
                            <tr>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">العنوان</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">الهدف</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">الحالة</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">التاريخ</th>
                                <th className="px-5 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#2e2e3a]">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">لا توجد إشعارات</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.map((notification) => {
                                const target = targetTypes[notification.target_role || 'all'] || targetTypes.all;
                                const status = statusTypes[notification.status || 'pending'] || statusTypes.pending;
                                return (
                                    <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors">
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-xs">{notification.message}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${target.color}`}>
                                                <target.icon className="h-3.5 w-3.5" />
                                                {target.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {notification.sent_at ? new Date(notification.sent_at).toLocaleDateString("ar-SA") : "-"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-1">
                                                {notification.status === "pending" && (
                                                    <button
                                                        onClick={() => handleSend(notification)}
                                                        className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                        title="إرسال"
                                                    >
                                                        <Send className="h-4 w-4 text-green-500" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(notification)}
                                                    className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit2 className="h-4 w-4 text-primary-500" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(notification)}
                                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                        <p className="text-sm text-gray-500">صفحة {page} من {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252530] disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252530] disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-[#2e2e3a] shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                                        <Bell className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedNotification ? "تعديل الإشعار" : "إشعار جديد"}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#252530] rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 text-sm"
                                        placeholder="عنوان الإشعار"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الرسالة</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                                        placeholder="محتوى الإشعار..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">إرسال إلى</label>
                                        <select
                                            value={formData.target_role || 'all'}
                                            onChange={e => setFormData({ ...formData, target_role: e.target.value as Notification["target_role"] })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 text-sm"
                                        >
                                            <option value="all">الجميع ({userCounts.all})</option>
                                            <option value="students">الطلاب ({userCounts.students})</option>
                                            <option value="teachers">المعلمين ({userCounts.teachers})</option>
                                            <option value="admins">المشرفين ({userCounts.admins})</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحالة</label>
                                        <select
                                            value={formData.status || 'pending'}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as Notification["status"] })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 text-sm"
                                        >
                                            <option value="pending">مجدول/معلق</option>
                                            <option value="sent">إرسال فوري</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Scheduled Time - فقط عند اختيار معلق */}
                                {formData.status === 'pending' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                وقت الإرسال المجدول (اختياري)
                                            </div>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.scheduled_for}
                                            onChange={e => setFormData({ ...formData, scheduled_for: e.target.value })}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            اترك فارغاً للإرسال الفوري، أو حدد وقتاً للجدولة
                                        </p>
                                    </div>
                                )}

                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#252530] text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !formData.title || !formData.message}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50 transition-colors"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "حفظ"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title="حذف الإشعار"
                itemName={deleteModal.title}
                isDeleting={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: null, title: "" })}
            />
        </motion.div>
    );
}
