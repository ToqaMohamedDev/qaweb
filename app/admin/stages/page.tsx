"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, X, Save, Layers, GraduationCap, BookOpen, Sparkles, ChevronLeft, Loader2 } from "lucide-react";
import { GridSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";
import { useStagesAPI, useCreateStageAPI, useUpdateStageAPI, useDeleteStageAPI } from "@/lib/queries/adminQueries";
import { useUIStore } from "@/lib/stores";
import { ConfirmDialog } from "@/components/shared"; // Keeping provided import just in case, though unused here
import { DeleteConfirmModal } from "@/components/admin";
import { Database } from "@/lib/database.types";

type Stage = Database["public"]["Tables"]["educational_stages"]["Row"];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const gradientColors = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-pink-400",
    "from-amber-500 to-orange-400",
    "from-emerald-500 to-teal-400",
    "from-rose-500 to-red-400",
    "from-indigo-500 to-violet-400",
];

export default function StagesPage() {
    const { addToast } = useUIStore();

    // Query Hooks (API-based for Vercel compatibility)
    const { data: stages = [], isLoading: isQueryLoading } = useStagesAPI();
    const createMutation = useCreateStageAPI();
    const updateMutation = useUpdateStageAPI();
    const deleteMutation = useDeleteStageAPI();

    const isLoading = isQueryLoading;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    // Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStage, setCurrentStage] = useState<Partial<Stage> | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; stageId: string | null; stageName: string }>({ isOpen: false, stageId: null, stageName: "" });

    // Filtered Stages
    const filteredStages = stages.filter(stage =>
        stage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stage.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle Save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStage?.name || !currentStage?.slug) return;

        try {
            if (currentStage.id) {
                await updateMutation.mutateAsync({
                    id: currentStage.id,
                    name: currentStage.name,
                    description: currentStage.description,
                    image_url: currentStage.image_url,
                    slug: currentStage.slug
                });
                addToast({ type: 'success', message: 'تم تحديث المرحلة بنجاح' });
            } else {
                await createMutation.mutateAsync({
                    name: currentStage.name,
                    description: currentStage.description,
                    image_url: currentStage.image_url,
                    slug: currentStage.slug
                });
                addToast({ type: 'success', message: 'تم إنشاء المرحلة بنجاح' });
            }
            setIsModalOpen(false);
            setCurrentStage(null);
        } catch (error: any) {
            addToast({ type: 'error', message: error.message || 'حدث خطأ أثناء الحفظ' });
        }
    };

    // Handle Delete
    const handleDelete = async () => {
        if (!deleteModal.stageId) return;
        try {
            await deleteMutation.mutateAsync(deleteModal.stageId);
            setDeleteModal({ isOpen: false, stageId: null, stageName: "" });
            addToast({ type: 'success', message: 'تم حذف المرحلة بنجاح' });
        } catch (error: any) {
            addToast({ type: 'error', message: error.message || 'حدث خطأ أثناء الحذف' });
        }
    };

    const stats = [
        {
            label: "إجمالي المراحل",
            value: stages.length,
            icon: Layers,
            gradient: "from-blue-500 to-blue-600",
            bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
        },
        {
            label: "المراحل الإعدادية",
            value: stages.filter(s => s.name.includes("إعدادي") || s.slug.includes("prep")).length,
            icon: BookOpen,
            gradient: "from-purple-500 to-purple-600",
            bgGradient: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
        },
        {
            label: "المراحل الثانوية",
            value: stages.filter(s => s.name.includes("ثانوي") || s.slug.includes("sec")).length,
            icon: GraduationCap,
            gradient: "from-emerald-500 to-emerald-600",
            bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-60" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                            <Layers className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">المراحل الدراسية</h1>
                            <p className="text-white/80 mt-1">إدارة وتنظيم المراحل التعليمية في المنصة</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setCurrentStage({});
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-600 font-semibold shadow-lg shadow-black/10 hover:shadow-xl transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        <span>إضافة مرحلة جديدة</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoading ? (
                    <>
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </>
                ) : (
                    stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-5 border border-gray-200/50 dark:border-gray-700/50`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="البحث في المراحل الدراسية..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-12 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-[#1c1c24] focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 text-lg"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <GridSkeleton count={6} type="stage" />
            ) : filteredStages.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                        <Layers className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {searchQuery ? "لا توجد نتائج" : "لا توجد مراحل دراسية"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? `لم يتم العثور على مراحل تطابق "${searchQuery}"` : "لم تقم بإضافة أي مراحل دراسية بعد."}
                    </p>
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStages.map((stage, index) => (
                        <motion.div
                            key={stage.id}
                            variants={itemVariants}
                            layout
                            className="group relative bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <div className={`h-32 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50" />
                                {stage.image_url && (
                                    <img src={stage.image_url} alt={stage.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
                                )}
                                <div className="absolute top-4 right-4 p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                                    <GraduationCap className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button onClick={() => { setCurrentStage(stage); setIsModalOpen(true); }} className="p-2.5 rounded-xl bg-white/90 dark:bg-gray-900/90 hover:bg-white transition-colors shadow-lg">
                                        <Pencil className="h-4 w-4 text-gray-700 dark:text-white" />
                                    </button>
                                    <button onClick={() => setDeleteModal({ isOpen: true, stageId: stage.id, stageName: stage.name })} className="p-2.5 rounded-xl bg-red-500/90 text-white hover:bg-red-600 transition-colors shadow-lg">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{stage.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{stage.description || "لا يوجد وصف"}</p>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">{stage.slug}</span>
                                    <button className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                        <span>التفاصيل</span><ChevronLeft className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl overflow-hidden">
                            <div className="relative bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 px-6 py-8">
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"><Layers className="h-6 w-6 text-white" /></div>
                                        <div>
                                            <h3 className="font-bold text-xl text-white">{currentStage?.id ? "تعديل المرحلة" : "إضافة مرحلة جديدة"}</h3>
                                            <p className="text-white/70 text-sm">{currentStage?.id ? "تعديل بيانات المرحلة" : "أضف مرحلة جديدة"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white"><X className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-5">
                                <div><label className="block text-sm font-semibold mb-2">اسم المرحلة <span className="text-red-500">*</span></label><input type="text" required value={currentStage?.name || ""} onChange={e => setCurrentStage(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 outline-none" placeholder="مثال: الصف الأول الإعدادي" /></div>
                                <div><label className="block text-sm font-semibold mb-2">Slug (الرابط) <span className="text-red-500">*</span></label><input type="text" required value={currentStage?.slug || ""} onChange={e => setCurrentStage(prev => ({ ...prev, slug: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 outline-none font-mono text-sm" placeholder="example: first-prep" dir="ltr" /></div>
                                <div><label className="block text-sm font-semibold mb-2">الوصف</label><textarea value={currentStage?.description || ""} onChange={e => setCurrentStage(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 outline-none resize-none" placeholder="وصف مختصر..." /></div>
                                <div><label className="block text-sm font-semibold mb-2">رابط الصورة</label><input type="text" value={currentStage?.image_url || ""} onChange={e => setCurrentStage(prev => ({ ...prev, image_url: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 outline-none text-sm mb-3" placeholder="/images/stages/..." dir="ltr" />
                                    <div className="flex flex-wrap gap-2">
                                        {[{ label: "1 إعدادي", val: "/images/stages/prep_1.png", color: "bg-blue-100 text-blue-700" }, { label: "1 ثانوي", val: "/images/stages/sec_1.png", color: "bg-emerald-100 text-emerald-700" }].map(opt => (
                                            <button key={opt.val} type="button" onClick={() => setCurrentStage(prev => ({ ...prev, image_url: opt.val }))} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${opt.color} hover:opacity-80 transition-opacity`}>{opt.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold hover:bg-gray-200">إلغاء</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}<span>{currentStage?.id ? "حفظ التغييرات" : "إضافة المرحلة"}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title="حذف المرحلة"
                itemName={deleteModal.stageName}
                isDeleting={deleteMutation.isPending}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, stageId: null, stageName: "" })}
            />
        </div>
    );
}
