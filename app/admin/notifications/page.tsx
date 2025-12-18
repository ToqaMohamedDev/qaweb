"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Plus, Trash2, Send, Users, User, GraduationCap, Clock, CheckCheck, X, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Edit2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const targetTypes: Record<string, { label: string; icon: typeof Users; color: string }> = {
    all: { label: "الجميع", icon: Users, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    students: { label: "الطلاب", icon: User, color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    teachers: { label: "المعلمين", icon: GraduationCap, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
    admins: { label: "المشرفين", icon: Shield, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
};

const statusTypes: Record<string, { label: string; color: string }> = {
    sent: { label: "تم الإرسال", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    scheduled: { label: "مجدول", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
    draft: { label: "مسودة", color: "bg-gray-100 dark:bg-gray-800 text-gray-600" },
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
    const [formData, setFormData] = useState({ title: "", message: "", target_role: "all" as Notification["target_role"], status: "draft" as Notification["status"], scheduled_for: "" });
    const [userCounts, setUserCounts] = useState({ all: 0, students: 0, teachers: 0, admins: 0 });
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
            const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
            if (error) {
                // إذا الجدول غير موجود، نعرض رسالة
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
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || n.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const stats = [
        { label: "إجمالي الإشعارات", value: notifications.length, icon: Bell, color: "from-blue-500 to-blue-600" },
        { label: "تم الإرسال", value: notifications.filter(n => n.status === "sent").length, icon: CheckCheck, color: "from-green-500 to-green-600" },
        { label: "مجدول", value: notifications.filter(n => n.status === "scheduled").length, icon: Clock, color: "from-amber-500 to-amber-600" },
    ];

    const handleNew = () => {
        setSelectedNotification(null);
        setFormData({ title: "", message: "", target_role: "all", status: "draft", scheduled_for: "" });
        setShowModal(true);
    };

    const handleEdit = (notification: Notification) => {
        setSelectedNotification(notification);
        setFormData({ title: notification.title, message: notification.message, target_role: notification.target_role, status: notification.status, scheduled_for: notification.scheduled_for || "" });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.message) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const now = new Date().toISOString();

            if (selectedNotification) {
                // تعديل
                const { error } = await supabase.from("notifications").update({ title: formData.title, message: formData.message, target_role: formData.target_role, status: formData.status, sent_at: formData.status === "sent" ? now : null, scheduled_for: formData.scheduled_for || null, updated_at: now }).eq("id", selectedNotification.id);
                if (error) throw error;
            } else {
                // إضافة
                const { error } = await supabase.from("notifications").insert({ title: formData.title, message: formData.message, target_role: formData.target_role, status: formData.status, sent_at: formData.status === "sent" ? now : null, scheduled_for: formData.scheduled_for || null });
                if (error) throw error;
            }

            await fetchData();
            setShowModal(false);
        } catch (err: any) {
            alert("خطأ: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;
        try {
            const supabase = createClient();
            const { error } = await supabase.from("notifications").delete().eq("id", id);
            if (error) throw error;
            await fetchData();
        } catch (err: any) {
            alert("خطأ: " + err.message);
        }
    };

    const handleSend = async (notification: Notification) => {
        try {
            const supabase = createClient();
            const { error } = await supabase.from("notifications").update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", notification.id);
            if (error) throw error;
            await fetchData();
            alert(`تم إرسال الإشعار "${notification.title}" إلى ${userCounts[notification.target_role]} مستخدم`);
        } catch (err: any) {
            alert("خطأ: " + err.message);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    if (error) return <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-red-600">{error}</p><button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">إعادة المحاولة</button></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">إدارة الإشعارات</h1><p className="text-gray-600 dark:text-gray-400 mt-1">إرسال إشعارات للمستخدمين</p></div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium"><RefreshCw className="h-4 w-4" /></button>
                    <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium shadow-lg shadow-primary-500/25"><Plus className="h-4 w-4" /><span>إشعار جديد</span></button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}><s.icon className="h-5 w-5 text-white" /></div>
                            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm outline-none" /></div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none"><option value="all">جميع الحالات</option><option value="sent">تم الإرسال</option><option value="scheduled">مجدول</option><option value="draft">مسودة</option></select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50"><tr><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">العنوان</th><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">الهدف</th><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">الحالة</th><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">التاريخ</th><th className="px-5 py-4"></th></tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {paginated.length === 0 ? (<tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">لا توجد إشعارات</td></tr>) : paginated.map((notification) => {
                                const target = targetTypes[notification.target_role] || targetTypes.all;
                                const status = statusTypes[notification.status] || statusTypes.draft;
                                return (
                                    <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-5 py-4"><div><p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p><p className="text-xs text-gray-500 truncate max-w-xs">{notification.message}</p></div></td>
                                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${target.color}`}><target.icon className="h-3.5 w-3.5" />{target.label}</span></td>
                                        <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.color}`}>{status.label}</span></td>
                                        <td className="px-5 py-4 text-sm text-gray-500">{notification.sent_at ? new Date(notification.sent_at).toLocaleDateString("ar-SA") : "-"}</td>
                                        <td className="px-5 py-4"><div className="flex gap-1">{notification.status === "draft" && <button onClick={() => handleSend(notification)} className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title="إرسال"><Send className="h-4 w-4 text-green-500" /></button>}<button onClick={() => handleEdit(notification)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Edit2 className="h-4 w-4 text-gray-500" /></button><button onClick={() => handleDelete(notification.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4 text-red-500" /></button></div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800"><p className="text-sm text-gray-500">صفحة {page} من {totalPages}</p><div className="flex gap-2"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button></div></div>}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 w-full max-w-lg">
                            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedNotification ? "تعديل الإشعار" : "إشعار جديد"}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button></div>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium mb-2">العنوان</label><input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" placeholder="عنوان الإشعار" /></div>
                                <div><label className="block text-sm font-medium mb-2">الرسالة</label><textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none resize-none" placeholder="محتوى الإشعار..." /></div>
                                <div><label className="block text-sm font-medium mb-2">إرسال إلى</label><select value={formData.target_role} onChange={e => setFormData({ ...formData, target_role: e.target.value as Notification["target_role"] })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none"><option value="all">الجميع ({userCounts.all})</option><option value="students">الطلاب ({userCounts.students})</option><option value="teachers">المعلمين ({userCounts.teachers})</option><option value="admins">المشرفين ({userCounts.admins})</option></select></div>
                                <div><label className="block text-sm font-medium mb-2">الحالة</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Notification["status"] })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none"><option value="draft">مسودة</option><option value="sent">إرسال فوري</option><option value="scheduled">جدولة</option></select></div>
                                {formData.status === "scheduled" && <div><label className="block text-sm font-medium mb-2">تاريخ الإرسال</label><input type="datetime-local" value={formData.scheduled_for} onChange={e => setFormData({ ...formData, scheduled_for: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>}
                            </div>
                            <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-medium">إلغاء</button><button onClick={handleSave} disabled={saving || !formData.title || !formData.message} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium disabled:opacity-50">{saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "حفظ"}</button></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
