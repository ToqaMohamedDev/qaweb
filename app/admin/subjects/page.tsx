"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2,
    X,
    Save,
    BookOpen,
    Sparkles,
    GripVertical,
    Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { GridSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";

type Subject = Database["public"]["Tables"]["subjects"]["Row"];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
};

// Subject colors
const subjectColors = [
    { bg: "from-blue-500 to-cyan-400", light: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
    { bg: "from-purple-500 to-pink-400", light: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    { bg: "from-amber-500 to-orange-400", light: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
    { bg: "from-emerald-500 to-teal-400", light: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
    { bg: "from-rose-500 to-red-400", light: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400" },
    { bg: "from-indigo-500 to-violet-400", light: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
];

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tableError, setTableError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<Partial<Subject> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Fetch Subjects
    const fetchSubjects = async () => {
        try {
            setIsLoading(true);
            setTableError(null);

            const { data, error } = await supabase
                .from("subjects")
                .select("*")
                .order("order_index", { ascending: true });

            if (error) {
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    setTableError('tables_missing');
                    return;
                }
                throw error;
            }
            setSubjects(data || []);
        } catch (error: any) {
            console.error("Error fetching subjects:", error);
            if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                setTableError('tables_missing');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    // Filtered Subjects
    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    };

    // Handle Save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSubject?.name || !currentSubject?.slug) return;

        try {
            setIsSaving(true);

            if (currentSubject.id) {
                const { error } = await supabase
                    .from("subjects")
                    .update({
                        name: currentSubject.name,
                        description: currentSubject.description,
                        image_url: currentSubject.image_url,
                        slug: currentSubject.slug,
                        is_active: currentSubject.is_active ?? true,
                        order_index: currentSubject.order_index ?? 0
                    })
                    .eq("id", currentSubject.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("subjects")
                    .insert([{
                        name: currentSubject.name,
                        description: currentSubject.description,
                        image_url: currentSubject.image_url,
                        slug: currentSubject.slug,
                        is_active: currentSubject.is_active ?? true,
                        order_index: currentSubject.order_index ?? subjects.length
                    }]);

                if (error) throw error;
            }

            setIsModalOpen(false);
            setCurrentSubject(null);
            fetchSubjects();
        } catch (error) {
            console.error("Error saving subject:", error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Delete
    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("subjects")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setDeleteConfirmId(null);
            fetchSubjects();
        } catch (error) {
            console.error("Error deleting subject:", error);
            alert("حدث خطأ أثناء الحذف");
        }
    };

    // Toggle Active Status
    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("subjects")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;
            fetchSubjects();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header with Gradient Background */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-60" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                            <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                المواد الدراسية
                            </h1>
                            <p className="text-white/80 mt-1">
                                إدارة وتنظيم المواد التعليمية في المنصة
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setCurrentSubject({ is_active: true, order_index: subjects.length });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-600 font-semibold shadow-lg shadow-black/10 hover:shadow-xl transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        <span>إضافة مادة جديدة</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-5 border border-emerald-200/50 dark:border-emerald-700/50"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي المواد</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{subjects.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 border border-blue-200/50 dark:border-blue-700/50"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مواد نشطة</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{subjects.filter(s => s.is_active).length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-5 border border-gray-200/50 dark:border-gray-700/50"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مواد غير نشطة</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{subjects.filter(s => !s.is_active).length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="البحث في المواد الدراسية..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-4 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-[#1c1c24] focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 text-lg"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 left-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-6">
                    {/* Stats Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </div>
                    {/* Grid Skeleton */}
                    <GridSkeleton count={8} type="subject" />
                </div>
            ) : tableError === 'tables_missing' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                        <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        يجب إنشاء الجداول أولاً
                    </h3>
                    <button
                        onClick={() => fetchSubjects()}
                        className="mt-6 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            ) : filteredSubjects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <Sparkles className="h-5 w-5 text-emerald-500" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {searchQuery ? "لا توجد نتائج" : "لا توجد مواد دراسية"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                        {searchQuery
                            ? `لم يتم العثور على مواد تطابق "${searchQuery}"`
                            : "لم تقم بإضافة أي مواد دراسية بعد. ابدأ بإضافة مادة جديدة الآن."
                        }
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => {
                                setCurrentSubject({ is_active: true });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            <span>إضافة مادة جديدة</span>
                        </button>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                    {filteredSubjects.map((subject, index) => {
                        const colorSet = subjectColors[index % subjectColors.length];
                        return (
                            <motion.div
                                key={subject.id}
                                variants={itemVariants}
                                layout
                                className="group relative bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                            >
                                {/* Gradient Header */}
                                <div className={`h-24 bg-gradient-to-br ${colorSet.bg} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50" />
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />

                                    {/* Image if exists */}
                                    {subject.image_url && (
                                        <img
                                            src={subject.image_url}
                                            alt={subject.name}
                                            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                                        />
                                    )}

                                    {/* Icon */}
                                    <div className="absolute top-3 right-3 p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                                        <BookOpen className="h-5 w-5 text-white" />
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={() => {
                                                setCurrentSubject(subject);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 rounded-lg bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-white hover:bg-white transition-colors shadow-lg backdrop-blur-sm"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(subject.id)}
                                            className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-600 transition-colors shadow-lg backdrop-blur-sm"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                        {subject.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 min-h-[40px]">
                                        {subject.description || "لا يوجد وصف"}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-600 dark:text-gray-400">
                                            {subject.slug}
                                        </span>
                                        <button
                                            onClick={() => toggleActive(subject.id, subject.is_active)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${subject.is_active
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                }`}
                                        >
                                            {subject.is_active ? "نشط" : "غير نشط"}
                                        </button>
                                    </div>
                                </div>

                                {/* Delete Confirmation Overlay */}
                                <AnimatePresence>
                                    {deleteConfirmId === subject.id && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0.9 }}
                                                className="text-center"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                                                    <Trash2 className="h-6 w-6 text-red-500" />
                                                </div>
                                                <p className="text-white font-semibold mb-4">حذف هذه المادة؟</p>
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                                                    >
                                                        إلغاء
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(subject.id)}
                                                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 py-8">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <BookOpen className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-white">
                                                {currentSubject?.id ? "تعديل المادة" : "إضافة مادة جديدة"}
                                            </h3>
                                            <p className="text-white/70 text-sm">
                                                {currentSubject?.id ? "قم بتعديل بيانات المادة" : "أضف مادة دراسية جديدة"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        اسم المادة <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={currentSubject?.name || ""}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            setCurrentSubject(prev => ({
                                                ...prev,
                                                name,
                                                slug: prev?.slug || generateSlug(name)
                                            }));
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                        placeholder="مثال: اللغة العربية"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Slug (الرابط) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={currentSubject?.slug || ""}
                                        onChange={(e) => setCurrentSubject(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all font-mono text-sm text-gray-900 dark:text-white"
                                        placeholder="arabic"
                                        dir="ltr"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        الوصف
                                    </label>
                                    <textarea
                                        value={currentSubject?.description || ""}
                                        onChange={(e) => setCurrentSubject(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all resize-none text-gray-900 dark:text-white"
                                        placeholder="وصف مختصر للمادة..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        رابط الصورة
                                    </label>
                                    <input
                                        type="text"
                                        value={currentSubject?.image_url || ""}
                                        onChange={(e) => setCurrentSubject(prev => ({ ...prev, image_url: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-all text-sm text-gray-900 dark:text-white"
                                        placeholder="/images/subjects/..."
                                        dir="ltr"
                                    />
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={currentSubject?.is_active ?? true}
                                        onChange={(e) => setCurrentSubject(prev => ({ ...prev, is_active: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        المادة نشطة (ظاهرة للمستخدمين)
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                                    >
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        <span>{currentSubject?.id ? "حفظ التغييرات" : "إضافة المادة"}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
