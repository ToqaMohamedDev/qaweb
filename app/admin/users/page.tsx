"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, Edit2, Trash2, Eye, Download, UserPlus, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, X, User, GraduationCap, Crown, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const roles: Record<string, { label: string; color: string; icon: typeof User }> = {
    student: { label: "طالب", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", icon: User },
    teacher: { label: "معلم", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", icon: GraduationCap },
    admin: { label: "أدمن", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", icon: Crown },
};

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "student" as Profile["role"],
        bio: "",
        specialization: "",
        teacher_title: "",
        years_of_experience: 0,
        education: "",
        phone: "",
        website: "",
        teaching_style: ""
    });
    const itemsPerPage = 10;

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            setError(err.message || "حدث خطأ في جلب البيانات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const filtered = users.filter((u) => {
        const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const stats = [
        { label: "إجمالي", value: users.length, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "طلاب", value: users.filter(u => u.role === "student").length, icon: User, color: "from-green-500 to-green-600" },
        { label: "معلمين", value: users.filter(u => u.role === "teacher").length, icon: GraduationCap, color: "from-purple-500 to-purple-600" },
        { label: "مشرفين", value: users.filter(u => u.role === "admin").length, icon: Crown, color: "from-amber-500 to-amber-600" },
    ];

    const handleEdit = (user: Profile) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || "",
            email: user.email || "",
            role: user.role,
            bio: user.bio || "",
            specialization: user.specialization || "",
            teacher_title: user.teacher_title || "",
            years_of_experience: user.years_of_experience || 0,
            education: user.education || "",
            phone: user.phone || "",
            website: user.website || "",
            teaching_style: user.teaching_style || ""
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const updates: any = {
                name: formData.name,
                role: formData.role,
                bio: formData.bio,
                specialization: formData.specialization,
                updated_at: new Date().toISOString()
            };

            if (formData.role === 'teacher') {
                updates.teacher_title = formData.teacher_title;
                updates.years_of_experience = formData.years_of_experience;
                updates.education = formData.education;
                updates.phone = formData.phone;
                updates.website = formData.website;
                updates.teaching_style = formData.teaching_style;
            }

            const { error } = await supabase.from("profiles").update(updates).eq("id", selectedUser.id);
            if (error) throw error;
            await fetchUsers();
            setShowModal(false);
        } catch (err: any) {
            alert("خطأ: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
        try {
            const supabase = createClient();
            const { error } = await supabase.from("profiles").delete().eq("id", userId);
            if (error) throw error;
            await fetchUsers();
        } catch (err: any) {
            alert("خطأ: " + err.message);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    if (error) return <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-red-600 dark:text-red-400">{error}</p><button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">إعادة المحاولة</button></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">إدارة المستخدمين</h1><p className="text-gray-600 dark:text-gray-400 mt-1">إدارة جميع المستخدمين ({users.length})</p></div>
                <div className="flex gap-3">
                    <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium"><Download className="h-4 w-4" /><span>تصدير</span></button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="flex-1 relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="text" placeholder="بحث بالاسم أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none"><option value="all">جميع الأدوار</option><option value="student">طلاب</option><option value="teacher">معلمين</option><option value="admin">مشرفين</option></select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50"><tr><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">المستخدم</th><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">الدور</th><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">التخصص</th><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">موثق</th><th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">التسجيل</th><th className="px-5 py-4"></th></tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {paginated.length === 0 ? (<tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">لا توجد نتائج</td></tr>) : paginated.map((user) => {
                                const role = roles[user.role] || roles.student;
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">{user.name?.charAt(0) || "?"}</div><div><p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div></div></td>
                                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${role.color}`}><role.icon className="h-3.5 w-3.5" />{role.label}</span></td>
                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{user.specialization || "-"}</td>
                                        <td className="px-5 py-4">{user.is_verified ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-gray-400" />}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString("ar-SA")}</td>
                                        <td className="px-5 py-4"><div className="flex gap-1"><button onClick={() => handleEdit(user)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Edit2 className="h-4 w-4 text-gray-500" /></button><button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4 text-red-500" /></button></div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800"><p className="text-sm text-gray-500">صفحة {page} من {totalPages}</p><div className="flex gap-2"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>{Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? "bg-primary-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{p}</button>)}<button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button></div></div>}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && selectedUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل المستخدم</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="h-5 w-5" /></button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-2">الاسم</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                                <div><label className="block text-sm font-medium mb-2">البريد الإلكتروني</label><input type="email" value={formData.email} disabled className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none opacity-50" /></div>
                                <div><label className="block text-sm font-medium mb-2">الدور</label><select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Profile["role"] })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none"><option value="student">طالب</option><option value="teacher">معلم</option><option value="admin">مشرف</option></select></div>
                                <div><label className="block text-sm font-medium mb-2">التخصص</label><input type="text" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                                <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium mb-2">نبذة</label><textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none resize-none" /></div>

                                {formData.role === 'teacher' && (
                                    <>
                                        <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-200 dark:border-gray-800"><h3 className="font-semibold mb-4 text-primary-500">بيانات المعلم</h3></div>
                                        <div><label className="block text-sm font-medium mb-2">اللقب الوظيفي</label><input type="text" value={formData.teacher_title} onChange={e => setFormData({ ...formData, teacher_title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" placeholder="مثال: أستاذ أول فيزياء" /></div>
                                        <div><label className="block text-sm font-medium mb-2">سنوات الخبرة</label><input type="number" value={formData.years_of_experience} onChange={e => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                                        <div><label className="block text-sm font-medium mb-2">المؤهل العلمي</label><input type="text" value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                                        <div><label className="block text-sm font-medium mb-2">رقم الهاتف</label><input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                                        <div><label className="block text-sm font-medium mb-2">الموقع الإلكتروني</label><input type="text" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                                        <div className="col-span-1 md:col-span-2"><label className="block text-sm font-medium mb-2">أسلوب التدريس</label><textarea value={formData.teaching_style} onChange={e => setFormData({ ...formData, teaching_style: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none resize-none" /></div>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-medium">إلغاء</button><button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium disabled:opacity-50">{saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "حفظ"}</button></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
