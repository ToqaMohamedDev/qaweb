"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, X, Save, BookOpen, Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { GridSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";
import { useSubjectsAPI, useCreateSubjectAPI, useUpdateSubjectAPI, useDeleteSubjectAPI } from "@/lib/queries/adminQueries";
import { useUIStore } from "@/lib/stores";
import { ConfirmDialog } from "@/components/shared"; // Keeping if needed else removed
import { DeleteConfirmModal } from "@/components/admin";
import { Database } from "@/lib/database.types";

type Subject = Database["public"]["Tables"]["subjects"]["Row"];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const subjectColors = [
    { bg: "from-blue-500 to-cyan-400", light: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
    { bg: "from-purple-500 to-pink-400", light: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    { bg: "from-amber-500 to-orange-400", light: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
    { bg: "from-emerald-500 to-teal-400", light: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
    { bg: "from-rose-500 to-red-400", light: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400" },
    { bg: "from-indigo-500 to-violet-400", light: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
];

export default function SubjectsPage() {
    const { addToast } = useUIStore();

    // Queries & Mutations (API-based for Vercel compatibility)
    const { data: subjects = [], isLoading: isQueryLoading } = useSubjectsAPI();
    const createMutation = useCreateSubjectAPI();
    const updateMutation = useUpdateSubjectAPI();
    const deleteMutation = useDeleteSubjectAPI();

    const isLoading = isQueryLoading;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    // Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<Partial<Subject> | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subjectId: string | null; subjectName: string }>({ isOpen: false, subjectId: null, subjectName: "" });

    // Filter Logic
    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSubject?.name || !currentSubject?.slug) return;

        try {
            if (currentSubject.id) {
                await updateMutation.mutateAsync({
                    id: currentSubject.id,
                    name: currentSubject.name,
                    description: currentSubject.description,
                    image_url: currentSubject.image_url,
                    slug: currentSubject.slug,
                    is_active: currentSubject.is_active ?? true,
                    order_index: currentSubject.order_index ?? 0
                });
                addToast({ type: 'success', message: 'تم تحديث المادة بنجاح' });
            } else {
                await createMutation.mutateAsync({
                    name: currentSubject.name,
                    description: currentSubject.description,
                    image_url: currentSubject.image_url,
                    slug: currentSubject.slug,
                    is_active: currentSubject.is_active ?? true,
                    order_index: currentSubject.order_index ?? subjects.length
                });
                addToast({ type: 'success', message: 'تم إنشاء المادة بنجاح' });
            }
            setIsModalOpen(false);
            setCurrentSubject(null);
        } catch (error: any) {
            addToast({ type: 'error', message: error.message || 'حدث خطأ أثناء الحفظ' });
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.subjectId) return;
        try {
            await deleteMutation.mutateAsync(deleteModal.subjectId);
            setDeleteModal({ isOpen: false, subjectId: null, subjectName: "" });
            addToast({ type: 'success', message: 'تم حذف المادة بنجاح' });
        } catch (error: any) {
            addToast({ type: 'error', message: error.message || 'حدث خطأ أثناء الحذف' });
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateMutation.mutateAsync({ id, is_active: !currentStatus });
            addToast({ type: 'success', message: !currentStatus ? 'تم تفعيل المادة' : 'تم تعطيل المادة' });
        } catch (error: any) {
            addToast({ type: 'error', message: error.message || 'حدث خطأ' });
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-60" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm"><BookOpen className="h-8 w-8 text-white" /></div>
                        <div><h1 className="text-3xl font-bold text-white">المواد الدراسية</h1><p className="text-white/80 mt-1">إدارة وتنظيم المواد التعليمية في المنصة</p></div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setCurrentSubject({ is_active: true }); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-600 font-semibold shadow-lg shadow-black/10 hover:shadow-xl transition-all">
                        <Plus className="h-5 w-5" /><span>إضافة مادة جديدة</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoading ? (
                    <>
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </>
                ) : (
                    <>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-5 border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي المواد</p><p className="text-3xl font-bold text-gray-900 dark:text-white">{subjects.length}</p></div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"><BookOpen className="h-6 w-6 text-white" /></div>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 border border-blue-200/50 dark:border-blue-700/50">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مواد نشطة</p><p className="text-3xl font-bold text-gray-900 dark:text-white">{subjects.filter(s => s.is_active).length}</p></div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"><Sparkles className="h-6 w-6 text-white" /></div>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-5 border border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مواد غير نشطة</p><p className="text-3xl font-bold text-gray-900 dark:text-white">{subjects.filter(s => !s.is_active).length}</p></div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg"><BookOpen className="h-6 w-6 text-white" /></div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="البحث في المواد الدراسية..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-12 pl-12 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-[#1c1c24] focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 text-lg" />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>}
            </div>

            {/* Content */}
            {isLoading ? (
                <GridSkeleton count={8} type="subject" />
            ) : filteredSubjects.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6"><BookOpen className="h-12 w-12 text-gray-400" /></div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{searchQuery ? "لا توجد نتائج" : "لا توجد مواد دراسية"}</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">{searchQuery ? `لم يتم العثور على مواد تطابق "${searchQuery}"` : "لم تقم بإضافة أي مواد دراسية بعد."}</p>
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredSubjects.map((subject, index) => {
                        const colorSet = subjectColors[index % subjectColors.length];
                        return (
                            <motion.div key={subject.id} variants={itemVariants} layout className="group relative bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                <div className={`h-24 bg-gradient-to-br ${colorSet.bg} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50" />
                                    {subject.image_url && <img src={subject.image_url} alt={subject.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />}
                                    <div className="absolute top-3 right-3 p-2.5 rounded-xl bg-white/20 backdrop-blur-sm"><BookOpen className="h-5 w-5 text-white" /></div>
                                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={() => { setCurrentSubject(subject); setIsModalOpen(true); }} className="p-2 rounded-lg bg-white/90 dark:bg-gray-900/90 hover:bg-white transition-colors shadow-lg"><Pencil className="h-4 w-4" /></button>
                                        <button onClick={() => setDeleteModal({ isOpen: true, subjectId: subject.id, subjectName: subject.name })} className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-colors shadow-lg"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{subject.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 min-h-[40px]">{subject.description || "لا يوجد وصف"}</p>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-600 dark:text-gray-400">{subject.slug}</span>
                                        <button onClick={() => toggleActive(subject.id, !!subject.is_active)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${subject.is_active ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{subject.is_active ? "نشط" : "غير نشط"}</button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl overflow-hidden">
                            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 py-8">
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"><BookOpen className="h-6 w-6 text-white" /></div>
                                        <div><h3 className="font-bold text-xl text-white">{currentSubject?.id ? "تعديل المادة" : "إضافة مادة جديدة"}</h3><p className="text-white/70 text-sm">{currentSubject?.id ? "تعديل بيانات المادة" : "أضف مادة جديدة"}</p></div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white"><X className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-5">
                                <div><label className="block text-sm font-semibold mb-2">اسم المادة <span className="text-red-500">*</span></label><input type="text" required value={currentSubject?.name || ""} onChange={e => { const name = e.target.value; setCurrentSubject(prev => ({ ...prev, name, slug: prev?.slug || generateSlug(name) })); }} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none" placeholder="مثال: اللغة العربية" /></div>
                                <div><label className="block text-sm font-semibold mb-2">Slug (الرابط) <span className="text-red-500">*</span></label><input type="text" required value={currentSubject?.slug || ""} onChange={e => setCurrentSubject(prev => ({ ...prev, slug: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none font-mono text-sm" placeholder="arabic" dir="ltr" /></div>
                                <div><label className="block text-sm font-semibold mb-2">الوصف</label><textarea value={currentSubject?.description || ""} onChange={e => setCurrentSubject(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none resize-none" placeholder="وصف مختصر..." /></div>
                                <div><label className="block text-sm font-semibold mb-2">رابط الصورة</label><input type="text" value={currentSubject?.image_url || ""} onChange={e => setCurrentSubject(prev => ({ ...prev, image_url: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none text-sm" placeholder="/images/subjects/..." dir="ltr" /></div>
                                <div className="flex items-center gap-3"><input type="checkbox" id="is_active" checked={currentSubject?.is_active ?? true} onChange={e => setCurrentSubject(prev => ({ ...prev, is_active: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><label htmlFor="is_active" className="text-sm font-medium">المادة نشطة (ظاهرة للمستخدمين)</label></div>
                                <div className="flex items-center gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold hover:bg-gray-200">إلغاء</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 text-white font-semibold hover:to-emerald-700 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}<span>{currentSubject?.id ? "حفظ التغييرات" : "إضافة المادة"}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title="حذف المادة"
                itemName={deleteModal.subjectName}
                isDeleting={deleteMutation.isPending}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, subjectId: null, subjectName: "" })}
            />
        </div>
    );
}
