"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    BookOpen,
    FileText,
    Search,
    Filter,
    ArrowRight,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    CheckCircle2,
    Globe,
    AlertCircle,
    Languages,
    Clock,
    Calendar,
    MoreVertical,
    Eye,
    Copy,
    Download,
    TrendingUp,
    Layers,
    Target,
    X,
    ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Language = "arabic" | "english" | "all";
type ExamType = "arabic_comprehensive_exam" | "english_comprehensive_exam" | "all";
type StatusFilter = "all" | "published" | "draft";

interface ExamWithId {
    id: string;
    type: 'arabic_comprehensive_exam' | 'english_comprehensive_exam';
    language: 'arabic' | 'english';
    usageScope: string;
    lessonId: string | null;
    examTitle: string;
    examDescription: string | null;
    totalMarks: number | null;
    durationMinutes: number | null;
    passingScore: number | null;
    gradingMode: string;
    branchTags: string[];
    blocks: any;
    sections: any;
    isPublished: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
};

export default function ExamsManagement() {
    const [exams, setExams] = useState<ExamWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterLanguage, setFilterLanguage] = useState<Language>("all");
    const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
    const [showFilters, setShowFilters] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
        isOpen: boolean;
        examId: string | null;
        examTitle: string;
    }>({
        isOpen: false,
        examId: null,
        examTitle: "",
    });
    const [successNotification, setSuccessNotification] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({
        isOpen: false,
        message: "",
        type: 'success'
    });
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        fetchExams();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const fetchExams = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("comprehensive_exams")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const transformedData = (data || []).map((exam: any) => ({
                ...exam,
                examTitle: exam.exam_title,
                examDescription: exam.exam_description,
                usageScope: exam.usage_scope,
                lessonId: exam.lesson_id,
                totalMarks: exam.total_marks,
                durationMinutes: exam.duration_minutes,
                passingScore: exam.passing_score,
                gradingMode: exam.grading_mode,
                branchTags: exam.branch_tags,
                isPublished: exam.is_published,
            })) as unknown as ExamWithId[];

            setExams(transformedData);
        } catch (error) {
            console.error("Error fetching exams:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExam = (exam: ExamWithId) => {
        setDeleteConfirmModal({
            isOpen: true,
            examId: exam.id,
            examTitle: exam.examTitle.substring(0, 80) + (exam.examTitle.length > 80 ? "..." : ""),
        });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmModal.examId) return;

        try {
            const { error } = await supabase
                .from("comprehensive_exams")
                .delete()
                .eq("id", deleteConfirmModal.examId);

            if (error) throw error;

            await fetchExams();

            setDeleteConfirmModal({ isOpen: false, examId: null, examTitle: "" });
            setSuccessNotification({
                isOpen: true,
                message: "تم حذف الامتحان بنجاح",
                type: 'success'
            });

            setTimeout(() => {
                setSuccessNotification({ isOpen: false, message: "", type: 'success' });
            }, 3000);
        } catch (error) {
            console.error("Error deleting exam:", error);
            setDeleteConfirmModal({ isOpen: false, examId: null, examTitle: "" });
            setSuccessNotification({
                isOpen: true,
                message: "حدث خطأ أثناء حذف الامتحان",
                type: 'error'
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getBlocksCount = (exam: ExamWithId) => {
        if (exam.blocks) return exam.blocks.length || 0;
        if (exam.sections) return exam.sections.length || 0;
        return 0;
    };

    // Filter exams
    const filteredExams = exams.filter((exam) => {
        if (filterLanguage !== "all" && exam.language !== filterLanguage) return false;
        if (filterStatus === "published" && !exam.isPublished) return false;
        if (filterStatus === "draft" && exam.isPublished) return false;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const examTitle = exam.examTitle?.toLowerCase() || "";
            if (!examTitle.includes(query)) return false;
        }
        return true;
    });

    // Stats
    const arabicExams = exams.filter((e) => e.language === "arabic");
    const englishExams = exams.filter((e) => e.language === "english");
    const publishedExams = exams.filter((e) => e.isPublished);
    const draftExams = exams.filter((e) => !e.isPublished);

    const statsCards = [
        { label: "إجمالي الامتحانات", value: exams.length, icon: FileText, color: "primary" },
        { label: "امتحانات عربية", value: arabicExams.length, icon: BookOpen, color: "emerald" },
        { label: "امتحانات إنجليزية", value: englishExams.length, icon: Languages, color: "blue" },
        { label: "منشور", value: publishedExams.length, icon: CheckCircle2, color: "green" },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Hero Header */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold mb-0.5">إدارة الامتحانات</h1>
                            <p className="text-white/70 text-sm">عرض وتعديل وإدارة جميع الامتحانات الشاملة</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/questions/arabic-comprehensive-exam"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>امتحان عربي</span>
                        </Link>
                        <Link
                            href="/admin/questions/english-comprehensive-exam"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>امتحان إنجليزي</span>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200/80 dark:border-[#2e2e3a]/80 hover:shadow-md transition-all`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                                <stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Search and Filters */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="البحث في الامتحانات..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilterLanguage("all")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterLanguage === "all" ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                        >
                            الكل
                        </button>
                        <button
                            onClick={() => setFilterLanguage("arabic")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterLanguage === "arabic" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                        >
                            عربي
                        </button>
                        <button
                            onClick={() => setFilterLanguage("english")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterLanguage === "english" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                        >
                            English
                        </button>

                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        <button
                            onClick={() => setFilterStatus(filterStatus === "published" ? "all" : "published")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${filterStatus === "published" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            منشور
                        </button>
                        <button
                            onClick={() => setFilterStatus(filterStatus === "draft" ? "all" : "draft")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${filterStatus === "draft" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                        >
                            <Clock className="h-3.5 w-3.5" />
                            مسودة
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(filterLanguage !== "all" || filterStatus !== "all" || searchQuery) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">الفلاتر النشطة:</span>
                        {filterLanguage !== "all" && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs">
                                {filterLanguage === "arabic" ? "عربي" : "English"}
                                <button onClick={() => setFilterLanguage("all")} className="hover:text-red-500">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filterStatus !== "all" && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs">
                                {filterStatus === "published" ? "منشور" : "مسودة"}
                                <button onClick={() => setFilterStatus("all")} className="hover:text-red-500">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs">
                                "{searchQuery}"
                                <button onClick={() => setSearchQuery("")} className="hover:text-red-500">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => { setFilterLanguage("all"); setFilterStatus("all"); setSearchQuery(""); }}
                            className="text-xs text-primary-600 hover:underline"
                        >
                            مسح الكل
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Exams Grid */}
            <motion.div variants={itemVariants}>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-4 border-primary-200 dark:border-primary-900/50"></div>
                            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-gray-500 mt-4">جاري تحميل الامتحانات...</p>
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد امتحانات</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">لم يتم العثور على امتحانات بناءً على الفلاتر المحددة</p>
                        <Link
                            href="/admin/questions/arabic-comprehensive-exam"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            إنشاء امتحان جديد
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredExams.map((exam, index) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="group bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 dark:hover:border-primary-700 overflow-hidden transition-all duration-300 hover:shadow-xl"
                            >
                                {/* Card Header with Language Indicator */}
                                <div className={`h-2 ${exam.language === "arabic" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}></div>

                                <div className="p-5">
                                    {/* Top Row */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${exam.language === "arabic"
                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                }`}>
                                                {exam.language === "arabic" ? "عربي" : "English"}
                                            </span>
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${exam.isPublished
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                                }`}>
                                                {exam.isPublished ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                {exam.isPublished ? "منشور" : "مسودة"}
                                            </span>
                                        </div>

                                        {/* Actions Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === exam.id ? null : exam.id);
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                            </button>

                                            <AnimatePresence>
                                                {activeDropdown === exam.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#252530] rounded-xl shadow-xl border border-gray-200 dark:border-[#2e2e3a] py-1 z-20"
                                                    >
                                                        <Link
                                                            href={`/admin/questions/${exam.type === "arabic_comprehensive_exam" ? "arabic-comprehensive-exam" : "english-comprehensive-exam"}?id=${exam.id}`}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                            تعديل
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteExam(exam)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            حذف
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 mb-3 min-h-[48px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {exam.examTitle}
                                    </h3>

                                    {/* Meta Info */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Layers className="h-3.5 w-3.5" />
                                            <span>{getBlocksCount(exam)} قسم</span>
                                        </div>
                                        {exam.durationMinutes && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{exam.durationMinutes} دقيقة</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDate(exam.created_at)}</span>
                                        </div>
                                        {exam.usageScope && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <Target className="h-3.5 w-3.5" />
                                                <span>{exam.usageScope === "lesson" ? "قالب درس" : "امتحان"}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <Link
                                        href={`/admin/questions/${exam.type === "arabic_comprehensive_exam" ? "arabic-comprehensive-exam" : "english-comprehensive-exam"}?id=${exam.id}`}
                                        className="block w-full py-2.5 text-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <Edit3 className="h-4 w-4" />
                                            تعديل الامتحان
                                        </span>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {!isLoading && filteredExams.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        عرض {filteredExams.length} من {exams.length} امتحان
                    </div>
                )}
            </motion.div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmModal.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Red Header */}
                            <div className="h-2 bg-gradient-to-r from-red-500 to-rose-500"></div>

                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">حذف الامتحان</h3>
                                        <p className="text-sm text-gray-500">هذا الإجراء لا يمكن التراجع عنه</p>
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                    هل أنت متأكد من حذف <span className="font-bold text-gray-900 dark:text-white">"{deleteConfirmModal.examTitle}"</span>؟
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        نعم، احذف
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmModal({ isOpen: false, examId: null, examTitle: "" })}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530] font-semibold transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success/Error Notification */}
            <AnimatePresence>
                {successNotification.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: 50 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 50, x: 50 }}
                        className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white ${successNotification.type === 'success'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-red-500 to-rose-500'
                            }`}
                    >
                        {successNotification.type === 'success'
                            ? <CheckCircle2 className="h-5 w-5" />
                            : <AlertCircle className="h-5 w-5" />
                        }
                        <span className="font-medium">{successNotification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
