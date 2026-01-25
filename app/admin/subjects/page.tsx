"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, X, Save, BookOpen, Sparkles, Loader2, Check, GraduationCap, Languages } from "lucide-react";
import { GridSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";
import { useSubjectsAPI, useCreateSubjectAPI, useUpdateSubjectAPI, useDeleteSubjectAPI, useStagesAPI, useSubjectStagesAPI, useUpdateSubjectStagesAPI } from "@/lib/queries/adminQueries";
import { useUIStore } from "@/lib/stores";
import { DeleteConfirmModal } from "@/components/admin";
import { Database } from "@/lib/database.types";

type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Stage = Database["public"]["Tables"]["educational_stages"]["Row"];

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
    const { data: subjects = [], isLoading: isQueryLoading, refetch: refetchSubjects } = useSubjectsAPI();
    const { data: stages = [], isLoading: isStagesLoading } = useStagesAPI();
    const createMutation = useCreateSubjectAPI();
    const updateMutation = useUpdateSubjectAPI();
    const deleteMutation = useDeleteSubjectAPI();
    const updateStagesMutation = useUpdateSubjectStagesAPI();

    const isLoading = isQueryLoading || isStagesLoading;
    const isSaving = createMutation.isPending || updateMutation.isPending || updateStagesMutation.isPending;

    // Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<Partial<Subject> | null>(null);
    const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en'>('ar');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; subjectId: string | null; subjectName: string }>({ isOpen: false, subjectId: null, subjectName: "" });

    // جلب المراحل المرتبطة بالمادة عند فتح Modal التعديل
    const { data: subjectStages = [], isLoading: isLoadingSubjectStages, isFetching: isFetchingSubjectStages } = useSubjectStagesAPI(currentSubject?.id);

    // مسح المراحل وتحديد اللغة فوراً عند تغيير المادة المحددة
    useEffect(() => {
        // تفريغ المراحل فوراً عند فتح modal جديد
        setSelectedStageIds([]);
        // تحديد اللغة من المادة الحالية أو العربية كافتراضي
        setSelectedLanguage((currentSubject as any)?.language || 'ar');
    }, [currentSubject?.id]);

    // تحديث المراحل المختارة بعد تحميل البيانات الجديدة
    useEffect(() => {
        if (currentSubject?.id && !isLoadingSubjectStages && !isFetchingSubjectStages && subjectStages.length > 0) {
            // عند تعديل مادة موجودة، نستخدم المراحل المرتبطة بها بعد التحميل
            const stageIds = subjectStages.map(ss => ss.stage_id);
            setSelectedStageIds(stageIds);
        }
    }, [currentSubject?.id, subjectStages, isLoadingSubjectStages, isFetchingSubjectStages]);

    // Toggle stage selection
    const toggleStageSelection = (stageId: string) => {
        setSelectedStageIds(prev => 
            prev.includes(stageId) 
                ? prev.filter(id => id !== stageId)
                : [...prev, stageId]
        );
    };

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
            let subjectId = currentSubject.id;
            
            if (currentSubject.id) {
                // تحديث المادة
                await updateMutation.mutateAsync({
                    id: currentSubject.id,
                    name: currentSubject.name,
                    description: currentSubject.description,
                    image_url: currentSubject.image_url,
                    slug: currentSubject.slug,
                    is_active: currentSubject.is_active ?? true,
                    order_index: currentSubject.order_index ?? 0,
                    language: selectedLanguage
                } as any);
            } else {
                // إنشاء مادة جديدة
                const newSubject = await createMutation.mutateAsync({
                    name: currentSubject.name,
                    description: currentSubject.description,
                    image_url: currentSubject.image_url,
                    slug: currentSubject.slug,
                    is_active: currentSubject.is_active ?? true,
                    order_index: currentSubject.order_index ?? subjects.length,
                    language: selectedLanguage
                } as any);
                subjectId = newSubject?.id;
            }

            // تحديث ربط المراحل بالمادة (حتى لو فارغة لحذف الربط القديم)
            if (subjectId) {
                await updateStagesMutation.mutateAsync({
                    subjectId,
                    stageIds: selectedStageIds
                });
            }

            addToast({ type: 'success', message: currentSubject.id ? 'تم تحديث المادة بنجاح' : 'تم إنشاء المادة بنجاح' });
            setIsModalOpen(false);
            setCurrentSubject(null);
            setSelectedStageIds([]);
            refetchSubjects();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ';
            addToast({ type: 'error', message: errorMessage });
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

            {/* Modal - تصميم مدمج */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            {/* Header مصغر */}
                            <div className="bg-emerald-500 px-4 py-3 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-white" />
                                    <h3 className="font-bold text-white">{currentSubject?.id ? "تعديل المادة" : "إضافة مادة"}</h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X className="h-4 w-4" /></button>
                            </div>
                            
                            {/* Form مع scroll */}
                            <form onSubmit={handleSave} className="p-4 space-y-3 overflow-y-auto flex-1">
                                {/* صف الاسم و Slug */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">اسم المادة *</label>
                                        <input type="text" required value={currentSubject?.name || ""} onChange={e => { const name = e.target.value; setCurrentSubject(prev => ({ ...prev, name, slug: prev?.slug || generateSlug(name) })); }} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none text-sm" placeholder="اللغة العربية" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Slug *</label>
                                        <input type="text" required value={currentSubject?.slug || ""} onChange={e => setCurrentSubject(prev => ({ ...prev, slug: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none text-sm font-mono" placeholder="arabic" dir="ltr" />
                                    </div>
                                </div>
                                
                                {/* الوصف */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">الوصف</label>
                                    <textarea value={currentSubject?.description || ""} onChange={e => setCurrentSubject(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none resize-none text-sm" placeholder="وصف مختصر..." />
                                </div>
                                
                                {/* صورة + نشط */}
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">رابط الصورة</label>
                                        <input type="text" value={currentSubject?.image_url || ""} onChange={e => setCurrentSubject(prev => ({ ...prev, image_url: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 outline-none text-sm" placeholder="/images/..." dir="ltr" />
                                    </div>
                                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer shrink-0">
                                        <input type="checkbox" checked={currentSubject?.is_active ?? true} onChange={e => setCurrentSubject(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 rounded text-emerald-600" />
                                        <span className="text-xs font-medium">نشط</span>
                                    </label>
                                </div>
                                
                                {/* اختيار اللغة */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <Languages className="w-3.5 h-3.5" /> لغة المحتوى
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedLanguage('ar')}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                                selectedLanguage === 'ar'
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {selectedLanguage === 'ar' && <Check className="w-4 h-4" />}
                                            عربي (RTL)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedLanguage('en')}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                                selectedLanguage === 'en'
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {selectedLanguage === 'en' && <Check className="w-4 h-4" />}
                                            English (LTR)
                                        </button>
                                    </div>
                                </div>

                                {/* المراحل - مدمجة */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <GraduationCap className="w-3.5 h-3.5" /> المراحل الدراسية
                                        </span>
                                        {selectedStageIds.length > 0 && <span className="text-xs text-emerald-600 dark:text-emerald-400">{selectedStageIds.length} مختارة</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {stages.map(stage => (
                                            <button key={stage.id} type="button" onClick={() => toggleStageSelection(stage.id)}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                                    selectedStageIds.includes(stage.id)
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}>
                                                {selectedStageIds.includes(stage.id) && <Check className="w-3 h-3 inline ml-1" />}
                                                {stage.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* أزرار */}
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700">إلغاء</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        <span>{currentSubject?.id ? "حفظ" : "إضافة"}</span>
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
