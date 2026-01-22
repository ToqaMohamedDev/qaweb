// =============================================
// Exams Admin Page - إدارة الامتحانات
// =============================================

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    FileText,
    Search,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    Clock,
    Calendar,
    MoreVertical,
    Layers,
    X,
    Eye,
} from "lucide-react";
import { useExamsAPI, useDeleteExamAPI, useUpdateExamAPI, useStagesAPI, useSubjectsAPI } from "@/lib/queries/adminQueries";
import { LoadingSpinner, NoExamsFound } from "@/components/shared";
import { DeleteConfirmModal } from "@/components/admin";
import { AdminStatsGrid } from "@/components/admin/shared";
import { useUIStore } from "@/lib/stores";
import { ComprehensiveExam } from "@/lib/types";
import type { StatItem } from "@/components/admin/shared";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type Language = "arabic" | "english" | "all";
type StatusFilter = "all" | "published" | "draft";

interface Stage {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface DeleteModalState {
    isOpen: boolean;
    examId: string | null;
    examTitle: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const ANIMATION_VARIANTS = {
    container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
    },
    item: {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 },
        },
    },
};

const LANGUAGE_OPTIONS = [
    { value: "all", label: "كل اللغات" },
    { value: "arabic", label: "عربي" },
    { value: "english", label: "English" },
];

const STATUS_OPTIONS = [
    { value: "all", label: "كل الحالات" },
    { value: "published", label: "منشور" },
    { value: "draft", label: "مسودة" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getBlocksCount(exam: ComprehensiveExam): number {
    const blocks = (exam.blocks as any[]) || (exam.sections as any[]) || [];
    return blocks.length || 0;
}

function getQuestionsCount(exam: ComprehensiveExam): number {
    const blocks = (exam.blocks as any[]) || (exam.sections as any[]) || [];
    return blocks.reduce((total: number, block: any) => {
        const subsections = block.subsections || [];
        const directQuestions = block.questions?.length || 0;
        const subsectionQuestions = subsections.reduce(
            (sum: number, sub: any) => sum + (sub.questions?.length || 0),
            0
        );
        return total + directQuestions + subsectionQuestions;
    }, 0);
}

function buildStatsItems(exams: ComprehensiveExam[]): StatItem[] {
    return [
        {
            label: "إجمالي الامتحانات",
            value: exams.length,
            icon: FileText,
            color: "from-primary-500 to-primary-600",
        },
        {
            label: "منشور",
            value: exams.filter((e) => e.is_published).length,
            icon: CheckCircle2,
            color: "from-green-500 to-green-600",
        },
        {
            label: "مسودة",
            value: exams.filter((e) => !e.is_published).length,
            icon: Clock,
            color: "from-gray-500 to-gray-600",
        },
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function ExamsManagement() {
    const { addToast } = useUIStore();

    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterLanguage, setFilterLanguage] = useState<Language>("all");
    const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Filters State
    const [selectedStage, setSelectedStage] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");

    // Auxiliary Data (API-based for Vercel compatibility)
    const { data: stages = [] } = useStagesAPI();
    const { data: subjects = [] } = useSubjectsAPI();

    // Queries & Mutations
    const { data: allExams = [], isLoading } = useExamsAPI();

    // Filter exams client-side
    const exams = allExams.filter((exam: any) => {
        const matchStage = !selectedStage || exam.stage_id === selectedStage;
        const matchSubject = !selectedSubject || exam.subject_id === selectedSubject;
        return matchStage && matchSubject;
    });

    const deleteExamMutation = useDeleteExamAPI();
    const updateExamMutation = useUpdateExamAPI();

    // Delete Modal State
    const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({
        isOpen: false,
        examId: null,
        examTitle: "",
    });

    // ═══════════════════════════════════════════════════════════════════════
    // Effects
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-dropdown-container]")) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // Memoized Values
    // ═══════════════════════════════════════════════════════════════════════

    const filteredExams = useMemo(() => {
        if (!exams) return [];
        return exams.filter((exam: ComprehensiveExam) => {
            if (filterLanguage !== "all" && exam.language !== filterLanguage) return false;
            if (filterStatus === "published" && !exam.is_published) return false;
            if (filterStatus === "draft" && exam.is_published) return false;
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const examTitle = exam.exam_title?.toLowerCase() || "";
                if (!examTitle.includes(query)) return false;
            }
            return true;
        });
    }, [exams, searchQuery, filterLanguage, filterStatus]);

    const stats = useMemo(() => buildStatsItems(exams), [exams]);

    const hasActiveFilters = useMemo(
        () =>
            !!(selectedStage ||
                selectedSubject ||
                filterLanguage !== "all" ||
                filterStatus !== "all" ||
                searchQuery),
        [selectedStage, selectedSubject, filterLanguage, filterStatus, searchQuery]
    );


    // ═══════════════════════════════════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════════════════════════════════

    const handleDeleteClick = useCallback((exam: ComprehensiveExam) => {
        setDeleteModalState({
            isOpen: true,
            examId: exam.id,
            examTitle: exam.exam_title,
        });
    }, []);

    const handleTogglePublish = useCallback(
        async (exam: ComprehensiveExam) => {
            const newStatus = !exam.is_published;
            try {
                await updateExamMutation.mutateAsync({
                    examId: exam.id,
                    updates: { is_published: newStatus },
                });

                // 🔔 إرسال إشعار عند النشر
                if (newStatus) {
                    fetch('/api/notifications/comprehensive-exam-published', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            examId: exam.id,
                            examTitle: exam.exam_title,
                            stageId: exam.stage_id,
                            // لا نملك اسم المرحلة هنا لكن الـ API يمكنه التعامل مع ذلك
                        }),
                    }).catch(err => console.error('Notification error:', err));
                }

                addToast({
                    type: "success",
                    message: newStatus ? "تم نشر الامتحان وإرسال الإشعارات" : "تم إلغاء نشر الامتحان",
                });
            } catch {
                addToast({ type: "error", message: "حدث خطأ أثناء تحديث حالة النشر" });
            }
        },
        [updateExamMutation, addToast]
    );

    const confirmDelete = useCallback(async () => {
        if (!deleteModalState.examId) return;
        try {
            await deleteExamMutation.mutateAsync(deleteModalState.examId);
            setDeleteModalState({ isOpen: false, examId: null, examTitle: "" });
            addToast({ type: "success", message: "تم حذف الامتحان بنجاح" });
        } catch {
            addToast({ type: "error", message: "حدث خطأ أثناء حذف الامتحان" });
        }
    }, [deleteModalState.examId, deleteExamMutation, addToast]);

    const clearFilters = useCallback(() => {
        setSelectedStage("");
        setSelectedSubject("");
        setFilterLanguage("all");
        setFilterStatus("all");
        setSearchQuery("");
    }, []);

    const toggleDropdown = useCallback((examId: string) => {
        setActiveDropdown((prev) => (prev === examId ? null : examId));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // Loading State
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <LoadingSpinner size="xl" text="جاري تحميل الامتحانات..." />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <motion.div
            variants={ANIMATION_VARIANTS.container}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <ExamsHeader />

            {/* Stats */}
            <motion.div variants={ANIMATION_VARIANTS.item}>
                <AdminStatsGrid stats={stats} columns={3} />
            </motion.div>

            {/* Search and Filters */}
            <motion.div variants={ANIMATION_VARIANTS.item}>
                <ExamsFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedStage={selectedStage}
                    onStageChange={setSelectedStage}
                    selectedSubject={selectedSubject}
                    onSubjectChange={setSelectedSubject}
                    filterLanguage={filterLanguage}
                    onLanguageChange={setFilterLanguage}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    stages={stages}
                    subjects={subjects}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                />
            </motion.div>

            {/* Exams Grid */}
            <motion.div variants={ANIMATION_VARIANTS.item}>
                {filteredExams.length === 0 ? (
                    <NoExamsFound
                        onCreateExam={() => (window.location.href = "/admin/exams/create")}
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredExams.map((exam: ComprehensiveExam, index: number) => (
                                <ExamCard
                                    key={exam.id}
                                    exam={exam}
                                    index={index}
                                    isDropdownActive={activeDropdown === exam.id}
                                    onToggleDropdown={() => toggleDropdown(exam.id)}
                                    onDelete={() => handleDeleteClick(exam)}
                                    onTogglePublish={() => handleTogglePublish(exam)}
                                />
                            ))}
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            عرض {filteredExams.length} من {exams.length} امتحان
                        </div>
                    </>
                )}
            </motion.div>

            {/* Delete Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalState.isOpen}
                onCancel={() =>
                    setDeleteModalState({ isOpen: false, examId: null, examTitle: "" })
                }
                onConfirm={confirmDelete}
                title="حذف الامتحان"
                itemName={deleteModalState.examTitle}
                isDeleting={deleteExamMutation.isPending}
            />
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════════════════════

function ExamsHeader() {
    return (
        <motion.div
            variants={ANIMATION_VARIANTS.item}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white"
        >
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                        <FileText className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold mb-0.5">إدارة الامتحانات</h1>
                        <p className="text-white/70 text-sm">عرض وتعديل وإدارة جميع الامتحانات</p>
                    </div>
                </div>
                <Link
                    href="/admin/exams/create"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-lg"
                >
                    <Plus className="h-4 w-4" />
                    <span>إنشاء امتحان جديد</span>
                </Link>
            </div>
        </motion.div>
    );
}

interface ExamsFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedStage: string;
    onStageChange: (value: string) => void;
    selectedSubject: string;
    onSubjectChange: (value: string) => void;
    filterLanguage: Language;
    onLanguageChange: (value: Language) => void;
    filterStatus: StatusFilter;
    onStatusChange: (value: StatusFilter) => void;
    stages: Stage[];
    subjects: Subject[];
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

function ExamsFilters({
    searchQuery,
    onSearchChange,
    selectedStage,
    onStageChange,
    selectedSubject,
    onSubjectChange,
    filterLanguage,
    onLanguageChange,
    filterStatus,
    onStatusChange,
    stages,
    subjects,
    hasActiveFilters,
    onClearFilters,
}: ExamsFiltersProps) {
    const selectClassName =
        "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-5">
            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="🔍 ابحث عن امتحان..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                    value={selectedStage}
                    onChange={(e) => onStageChange(e.target.value)}
                    className={selectClassName}
                >
                    <option value="">كل المراحل</option>
                    {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedSubject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    className={selectClassName}
                >
                    <option value="">كل المواد</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>

                <select
                    value={filterLanguage}
                    onChange={(e) => onLanguageChange(e.target.value as Language)}
                    className={selectClassName}
                >
                    {LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
                    className={selectClassName}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClearFilters}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                        <X className="h-3.5 w-3.5" />
                        مسح الفلاتر
                    </button>
                </div>
            )}
        </div>
    );
}

interface ExamCardProps {
    exam: ComprehensiveExam;
    index: number;
    isDropdownActive: boolean;
    onToggleDropdown: () => void;
    onDelete: () => void;
    onTogglePublish: () => void;
}

function ExamCard({
    exam,
    index,
    isDropdownActive,
    onToggleDropdown,
    onDelete,
    onTogglePublish,
}: ExamCardProps) {
    const examLink =
        exam.language === "english" ? `/english/exam/${exam.id}` : `/arabic/exam/${exam.id}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 dark:hover:border-primary-700 overflow-hidden transition-all duration-300 hover:shadow-lg"
        >
            {/* Card Header Line */}
            <div
                className={`h-1 ${exam.is_published ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"
                    }`}
            />

            <div className="p-5">
                {/* Badges & Menu */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <LanguageBadge language={exam.language} />
                        <StatusBadge isPublished={exam.is_published} />
                    </div>

                    {/* Dropdown Menu */}
                    <div className="relative" data-dropdown-container>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleDropdown();
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>

                        <AnimatePresence>
                            {isDropdownActive && (
                                <ExamDropdownMenu
                                    examId={exam.id}
                                    examLink={examLink}
                                    onDelete={onDelete}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 mb-3 min-h-[48px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {exam.exam_title}
                </h3>

                {/* Info */}
                <ExamInfo exam={exam} />

                {/* Actions */}
                <div className="space-y-2 mt-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePublish();
                        }}
                        className={`w-full py-2 text-center rounded-xl text-sm font-medium transition-colors ${exam.is_published
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                            : "bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                            }`}
                    >
                        {exam.is_published ? "✓ منشور" : "مسودة - اضغط للنشر"}
                    </button>

                    <Link
                        href={`/admin/exams/create?id=${exam.id}`}
                        className="block w-full py-2.5 text-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            تعديل الامتحان
                        </span>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

function LanguageBadge({ language }: { language: string }) {
    const isArabic = language === "arabic";
    return (
        <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isArabic
                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                }`}
        >
            {isArabic ? "عربي" : "English"}
        </span>
    );
}

function StatusBadge({ isPublished }: { isPublished: boolean | null }) {
    return (
        <span
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isPublished
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
        >
            {isPublished ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {isPublished ? "منشور" : "مسودة"}
        </span>
    );
}

function ExamDropdownMenu({
    examId,
    examLink,
    onDelete,
}: {
    examId: string;
    examLink: string;
    onDelete: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#252530] rounded-xl shadow-xl border border-gray-200 dark:border-[#2e2e3a] py-1 z-20"
        >
            <Link
                href={`/admin/exams/create?id=${examId}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <Edit3 className="h-4 w-4" />
                تعديل
            </Link>
            <Link
                href={examLink}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <Eye className="h-4 w-4" />
                عرض
            </Link>
            <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
                <Trash2 className="h-4 w-4" />
                حذف
            </button>
        </motion.div>
    );
}

function ExamInfo({ exam }: { exam: ComprehensiveExam }) {
    return (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>{getBlocksCount(exam)} قسم</span>
            </div>
            <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>{getQuestionsCount(exam)} سؤال</span>
            </div>
            {exam.duration_minutes && (
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{exam.duration_minutes} دقيقة</span>
                </div>
            )}
            <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(exam.created_at || '')}</span>
            </div>
        </div>
    );
}
