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
    FileText,
    ChevronDown,
    Eye,
    EyeOff,
    MessageSquare,
    Sparkles,
    BookOpen,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { GridSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";

type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Stage = Database["public"]["Tables"]["educational_stages"]["Row"];

interface LessonWithRelations extends Lesson {
    subjects?: Subject | null;
    educational_stages?: Stage | null;
}

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

export default function LessonsPage() {
    const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [selectedStage, setSelectedStage] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLesson, setCurrentLesson] = useState<Partial<Lesson> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Fetch Data
    const fetchData = async () => {
        try {
            setIsLoading(true);

            // Fetch Stages
            const { data: stagesData } = await supabase
                .from("educational_stages")
                .select("*")
                .order("order_index", { ascending: true });
            setStages(stagesData || []);

            // Fetch Subjects
            const { data: subjectsData } = await supabase
                .from("subjects")
                .select("*")
                .order("order_index", { ascending: true });
            setSubjects(subjectsData || []);

            // Fetch Lessons with Subject and Stage
            const { data: lessonsData, error } = await supabase
                .from("lessons")
                .select(`
                    *,
                    subjects (*),
                    educational_stages (*)
                `)
                .order("order_index", { ascending: true });

            if (error) throw error;
            setLessons(lessonsData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered Lessons
    const filteredLessons = lessons.filter(lesson => {
        const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = selectedSubject === "all" || lesson.subject_id === selectedSubject;
        // التعامل مع stage_id الذي قد يكون null
        const lessonStageId = lesson.stage_id || lesson.educational_stages?.id;
        const matchesStage = selectedStage === "all" || lessonStageId === selectedStage;
        return matchesSearch && matchesSubject && matchesStage;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedLessons = filteredLessons.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedSubject, selectedStage]);

    // Handle Save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLesson?.title || !currentLesson?.subject_id || !currentLesson?.stage_id) return;

        try {
            setIsSaving(true);

            if (currentLesson.id) {
                const { error } = await supabase
                    .from("lessons")
                    .update({
                        title: currentLesson.title,
                        description: currentLesson.description,
                        content: currentLesson.content,
                        image_url: currentLesson.image_url,
                        subject_id: currentLesson.subject_id,
                        stage_id: currentLesson.stage_id,
                        is_published: currentLesson.is_published ?? false,
                        order_index: currentLesson.order_index ?? 0
                    })
                    .eq("id", currentLesson.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("lessons")
                    .insert([{
                        title: currentLesson.title,
                        description: currentLesson.description,
                        content: currentLesson.content,
                        image_url: currentLesson.image_url,
                        subject_id: currentLesson.subject_id,
                        stage_id: currentLesson.stage_id,
                        is_published: currentLesson.is_published ?? false,
                        order_index: currentLesson.order_index ?? lessons.length
                    }]);

                if (error) throw error;
            }

            setIsModalOpen(false);
            setCurrentLesson(null);
            fetchData();
        } catch (error) {
            console.error("Error saving lesson:", error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Delete
    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("lessons")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setDeleteConfirmId(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting lesson:", error);
            alert("حدث خطأ أثناء الحذف");
        }
    };

    // Toggle Published Status
    const togglePublished = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("lessons")
                .update({ is_published: !currentStatus })
                .eq("id", id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header with Gradient Background */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-60" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                            <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                الدروس
                            </h1>
                            <p className="text-white/80 mt-1">
                                إدارة دروس كل مرحلة ومادة
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setCurrentLesson({ is_published: false, order_index: lessons.length });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-600 font-semibold shadow-lg shadow-black/10 hover:shadow-xl transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        <span>إضافة درس جديد</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 p-5 border border-violet-200/50 dark:border-violet-700/50"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي الدروس</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{lessons.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 border border-green-200/50 dark:border-green-700/50"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">دروس منشورة</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{lessons.filter(l => l.is_published).length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                            <Eye className="h-6 w-6 text-white" />
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
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مسودات</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{lessons.filter(l => !l.is_published).length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg">
                            <EyeOff className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="البحث في الدروس..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-12 pl-4 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-[#1c1c24] focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                </div>
                <div className="relative min-w-[180px]">
                    <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-[#1c1c24] focus:ring-2 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                    >
                        <option value="all">جميع المراحل</option>
                        {stages.map(stage => (
                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative min-w-[180px]">
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-[#1c1c24] focus:ring-2 focus:ring-purple-500 transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                    >
                        <option value="all">جميع المواد</option>
                        {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
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
                    <GridSkeleton count={6} type="lesson" />
                </div>
            ) : filteredLessons.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                            <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {searchQuery ? "لا توجد نتائج" : "لا توجد دروس"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                        {searchQuery
                            ? `لم يتم العثور على دروس تطابق "${searchQuery}"`
                            : "لم تقم بإضافة أي دروس بعد. ابدأ بإضافة درس جديد الآن."
                        }
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => {
                                setCurrentLesson({ is_published: false });
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            <span>إضافة درس جديد</span>
                        </button>
                    )}
                </motion.div>
            ) : (
                <>
                    {/* Results Count */}
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            عرض {startIndex + 1} - {Math.min(endIndex, filteredLessons.length)} من {filteredLessons.length} درس
                        </p>
                        {totalPages > 1 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                صفحة {currentPage} من {totalPages}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedLessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className="group relative bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200"
                            >
                                {/* Content */}
                                <div className="p-4">
                                    {/* Header: Title + Status */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 flex-1">
                                            {lesson.title}
                                        </h3>
                                        <span className={`shrink-0 w-2 h-2 rounded-full mt-2 ${lesson.is_published ? "bg-green-500" : "bg-gray-400"
                                            }`} title={lesson.is_published ? "منشور" : "مسودة"} />
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {lesson.educational_stages && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                <GraduationCap className="h-2.5 w-2.5" />
                                                {lesson.educational_stages.name.replace("الصف ", "").replace(" الإعدادي", " إع").replace(" الثانوي", " ث")}
                                            </span>
                                        )}
                                        {lesson.subjects && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                                <BookOpen className="h-2.5 w-2.5" />
                                                {lesson.subjects.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <Link
                                            href={`/admin/lessons/${lesson.id}`}
                                            className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                        >
                                            <MessageSquare className="h-3 w-3" />
                                            <span>الأسئلة</span>
                                        </Link>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setCurrentLesson(lesson);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(lesson.id)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => togglePublished(lesson.id, lesson.is_published)}
                                                className={`p-1.5 rounded-lg transition-colors ${lesson.is_published
                                                    ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    }`}
                                            >
                                                {lesson.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Confirmation Overlay */}
                                <AnimatePresence>
                                    {deleteConfirmId === lesson.id && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0.9 }}
                                                className="text-center"
                                            >
                                                <p className="text-white text-sm font-medium mb-3">حذف؟</p>
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs hover:bg-white/30 transition-colors"
                                                    >
                                                        لا
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(lesson.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 transition-colors"
                                                    >
                                                        نعم
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            {/* First Page */}
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                title="الصفحة الأولى"
                            >
                                <ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* Previous Page */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                title="الصفحة السابقة"
                            >
                                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`min-w-[40px] h-10 rounded-lg font-medium text-sm transition-colors ${currentPage === pageNum
                                                ? "bg-purple-600 text-white"
                                                : "bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next Page */}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                title="الصفحة التالية"
                            >
                                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* Last Page */}
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                title="الصفحة الأخيرة"
                            >
                                <ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl overflow-hidden my-8"
                        >
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-8">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <FileText className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-white">
                                                {currentLesson?.id ? "تعديل الدرس" : "إضافة درس جديد"}
                                            </h3>
                                            <p className="text-white/70 text-sm">
                                                {currentLesson?.id ? "قم بتعديل بيانات الدرس" : "أضف درس جديد للمرحلة والمادة"}
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

                            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                                {/* Stage & Subject Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            المرحلة <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={currentLesson?.stage_id || ""}
                                            onChange={(e) => setCurrentLesson(prev => ({ ...prev, stage_id: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                        >
                                            <option value="">اختر المرحلة</option>
                                            {stages.map(stage => (
                                                <option key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            المادة <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={currentLesson?.subject_id || ""}
                                            onChange={(e) => setCurrentLesson(prev => ({ ...prev, subject_id: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                        >
                                            <option value="">اختر المادة</option>
                                            {subjects.map(subject => (
                                                <option key={subject.id} value={subject.id}>
                                                    {subject.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        عنوان الدرس <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={currentLesson?.title || ""}
                                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-white"
                                        placeholder="مثال: مقدمة في النحو"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        الوصف
                                    </label>
                                    <textarea
                                        value={currentLesson?.description || ""}
                                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none transition-all resize-none text-gray-900 dark:text-white"
                                        placeholder="وصف مختصر للدرس..."
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        محتوى الدرس
                                    </label>
                                    <textarea
                                        value={currentLesson?.content || ""}
                                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, content: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none transition-all resize-none font-mono text-sm text-gray-900 dark:text-white"
                                        placeholder="محتوى الدرس..."
                                    />
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        صورة الدرس
                                    </label>
                                    <input
                                        type="text"
                                        value={currentLesson?.image_url || ""}
                                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, image_url: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:outline-none transition-all text-sm text-gray-900 dark:text-white"
                                        placeholder="/images/lessons/..."
                                        dir="ltr"
                                    />
                                </div>

                                {/* Published Status */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_published"
                                        checked={currentLesson?.is_published ?? false}
                                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, is_published: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        نشر الدرس (ظاهر للمستخدمين)
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
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                                    >
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        <span>{currentLesson?.id ? "حفظ التغييرات" : "إضافة الدرس"}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
