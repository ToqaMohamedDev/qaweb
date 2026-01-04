"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Database,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    BookOpen,
    GraduationCap,
    Layers,
    FileQuestion,
    Trash2,
    Edit3,
    CheckCircle2,
    BarChart3,
    RefreshCw,
    MessageSquare,
    List,
} from "lucide-react";
import { useQuestions, useDeleteQuestion, useDeleteQuestions, useStages, useSubjects, useLessons } from "@/lib/queries";
import { LoadingSpinner, NoQuestionsFound } from "@/components/shared";
import { DeleteConfirmModal } from "@/components/admin";
import { useUIStore } from "@/lib/stores";
import { LessonQuestion } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface ExtendedQuestion extends Omit<LessonQuestion, 'text' | 'options' | 'media' | 'explanation' | 'section_title'> {
    text: { ar: string; en: string } | null;
    options: any[] | null;
    media: { content: any } | null;
    explanation: { ar: string } | null;
    section_title?: { ar: string } | null;
    group_id?: string | null;
}

interface QuestionGroup {
    groupId: string;
    sectionTitle: string;
    questions: ExtendedQuestion[];
}

const difficultyConfig = {
    easy: { label: "سهل", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    medium: { label: "متوسط", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    hard: { label: "صعب", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
};

const typeLabels: Record<string, string> = {
    'mcq': 'اختيار من متعدد',
    'true_false': 'صح/خطأ',
    'essay': 'مقالي',
    'fill_blank': 'ملء فراغات',
    'matching': 'توصيل',
    'parsing': 'إعراب',
    'extraction': 'استخراج',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function QuestionBankPage() {
    // ─── UI State ───
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'question' | 'group'; id: string | null; name: string; count?: number }>({ isOpen: false, type: 'question', id: null, name: "", count: 0 });
    const { addToast } = useUIStore();

    // ─── Filter State ───
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedLesson, setSelectedLesson] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);

    // ─── Queries ───
    const { data: stages = [] } = useStages();
    const { data: subjects = [] } = useSubjects();
    const { data: lessons = [] } = useLessons({ stage_id: selectedStage, subject_id: selectedSubject });

    const questionsResult = useQuestions({
        stage_id: selectedStage || undefined,
        subject_id: selectedSubject || undefined,
        lesson_id: selectedLesson || undefined,
        difficulty: selectedDifficulty.length === 1 ? selectedDifficulty[0] as any : undefined,
        search: searchQuery || undefined,
    });
    const questions: ExtendedQuestion[] = (questionsResult.data || []) as any;
    const isLoading = questionsResult.isLoading;
    const refetch = questionsResult.refetch;

    const deleteQuestionMutation = useDeleteQuestion();
    const deleteQuestionsMutation = useDeleteQuestions();

    const isDeleting = deleteQuestionMutation.isPending || deleteQuestionsMutation.isPending;

    // ─── Grouping Logic ───
    const groupedQuestions = useMemo(() => {
        const groups: QuestionGroup[] = [];
        const groupMap = new Map<string, ExtendedQuestion[]>();

        let filteredQuestions = questions;
        if (selectedDifficulty.length > 1) {
            filteredQuestions = questions.filter(q => q.difficulty && selectedDifficulty.includes(q.difficulty));
        }

        filteredQuestions.forEach(q => {
            const titleAr = q.section_title?.ar || '';
            const groupKey = q.group_id || `${titleAr || 'بدون عنوان'}_${q.created_at?.split('T')[0] || 'unknown'}`;
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, []);
            }
            groupMap.get(groupKey)!.push(q);
        });

        groupMap.forEach((qs, groupKey) => {
            const sectionTitle = qs[0]?.section_title?.ar || 'أسئلة بدون عنوان';
            groups.push({
                groupId: groupKey,
                sectionTitle,
                questions: qs.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            });
        });

        return groups.sort((a, b) => {
            const dateA = a.questions[0]?.created_at || '';
            const dateB = b.questions[0]?.created_at || '';
            return dateB.localeCompare(dateA);
        });
    }, [questions, selectedDifficulty]);

    // ─── Stats ───
    const stats = useMemo(() => ({
        total: questions.length,
        groups: groupedQuestions.length,
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length,
    }), [questions, groupedQuestions]);

    // ─── Handlers ───
    const openDeleteQuestionModal = (question: ExtendedQuestion) => {
        const textAr = question.text?.ar || '';
        const textEn = question.text?.en || '';
        setDeleteModal({ isOpen: true, type: 'question', id: question.id, name: textAr || textEn || 'هذا السؤال' });
    };

    const openDeleteGroupModal = (groupId: string) => {
        const group = groupedQuestions.find(g => g.groupId === groupId);
        setDeleteModal({ isOpen: true, type: 'group', id: groupId, name: group?.sectionTitle || 'هذه المجموعة', count: group?.questions.length || 0 });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;

        try {
            if (deleteModal.type === 'question') {
                await deleteQuestionMutation.mutateAsync(deleteModal.id);
            } else {
                const group = groupedQuestions.find(g => g.groupId === deleteModal.id);
                if (group) {
                    const ids = group.questions.map(q => q.id);
                    await deleteQuestionsMutation.mutateAsync(ids);
                }
            }
            setDeleteModal({ isOpen: false, type: 'question', id: null, name: "", count: 0 });
            addToast({ type: 'success', message: 'تم الحذف بنجاح' });
        } catch (error) {
            addToast({ type: 'error', message: 'حدث خطأ أثناء الحذف' });
        }
    };

    const toggleGroup = (groupId: string) => {
        const updated = new Set(expandedGroups);
        if (updated.has(groupId)) {
            updated.delete(groupId);
        } else {
            updated.add(groupId);
        }
        setExpandedGroups(updated);
    };

    const expandAll = () => setExpandedGroups(new Set(groupedQuestions.map(g => g.groupId)));
    const collapseAll = () => setExpandedGroups(new Set());

    // ─── Render ───

    const getQuestionText = (q: ExtendedQuestion) => q.text?.ar || q.text?.en || 'بدون نص';
    const getMediaContent = (q: ExtendedQuestion) => q.media?.content;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20" dir="rtl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white"
            >
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <Database className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">بنك الأسئلة</h1>
                            <p className="text-white/70 text-sm">
                                {stats.total} سؤال في {stats.groups} مجموعة
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/question-bank/create"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-lg"
                    >
                        <Plus className="h-5 w-5" />
                        <span>إضافة أسئلة</span>
                    </Link>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200 dark:border-[#2e2e3a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <FileQuestion className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                            <p className="text-xs text-gray-500">إجمالي الأسئلة</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200 dark:border-[#2e2e3a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <List className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.groups}</p>
                            <p className="text-xs text-gray-500">مجموعات</p>
                        </div>
                    </div>
                </div>
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <div key={diff} className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200 dark:border-[#2e2e3a]">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${difficultyConfig[diff].bg}`}>
                                <BarChart3 className={`h-5 w-5 ${difficultyConfig[diff].color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats[diff]}</p>
                                <p className="text-xs text-gray-500">{difficultyConfig[diff].label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-5 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في الأسئلة أو عناوين الأقسام..."
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${showFilters
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-600'
                                : 'border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            الفلاتر
                        </button>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={expandAll}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                        >
                            فتح الكل
                        </button>
                        <button
                            onClick={collapseAll}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                        >
                            إغلاق الكل
                        </button>
                    </div>
                </div>

                {/* Filter Options */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                        >
                            {/* Stage */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    <GraduationCap className="h-3 w-3 inline ml-1" />
                                    المرحلة
                                </label>
                                <select
                                    value={selectedStage}
                                    onChange={(e) => setSelectedStage(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                >
                                    <option value="">كل المراحل</option>
                                    {stages.map(s => <option key={s.id} value={s.id}>{s.name || s.slug}</option>)}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    <BookOpen className="h-3 w-3 inline ml-1" />
                                    المادة
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                    disabled={!selectedStage}
                                >
                                    <option value="">كل المواد</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Lesson */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    <Layers className="h-3 w-3 inline ml-1" />
                                    الدرس
                                </label>
                                <select
                                    value={selectedLesson}
                                    onChange={(e) => setSelectedLesson(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                                    disabled={!selectedSubject}
                                >
                                    <option value="">كل الدروس</option>
                                    {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    <BarChart3 className="h-3 w-3 inline ml-1" />
                                    الصعوبة
                                </label>
                                <div className="flex gap-2">
                                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                                        <button
                                            key={diff}
                                            onClick={() => {
                                                setSelectedDifficulty(prev =>
                                                    prev.includes(diff)
                                                        ? prev.filter(d => d !== diff)
                                                        : [...prev, diff]
                                                );
                                            }}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedDifficulty.includes(diff)
                                                ? `${difficultyConfig[diff].bg} ${difficultyConfig[diff].color}`
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                }`}
                                        >
                                            {difficultyConfig[diff].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size="lg" text="جاري تحميل الأسئلة..." />
                    </div>
                ) : questions.length === 0 ? (
                    <NoQuestionsFound onCreateQuestion={() => window.location.href = '/admin/question-bank/create'} />
                ) : (
                    groupedQuestions.map((group, groupIndex) => (
                        <motion.div
                            key={group.groupId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIndex * 0.05 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                        >
                            {/* Group Header */}
                            <div
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#252530] border-b border-gray-200 dark:border-[#2e2e3a] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                                onClick={() => toggleGroup(group.groupId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 rounded-lg">
                                        <Layers className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {group.sectionTitle}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {group.questions.length} سؤال
                                            {getMediaContent(group.questions[0])?.type === 'reading' && (
                                                <span className="mr-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">📖 نص قراءة</span>
                                            )}
                                            {getMediaContent(group.questions[0])?.type === 'poetry' && (
                                                <span className="mr-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">🎭 شعر</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/question-bank/edit-group?groupId=${encodeURIComponent(group.groupId)}&lesson=${group.questions[0]?.lesson_id || ''}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg text-primary-600"
                                        title="تعديل المجموعة"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openDeleteGroupModal(group.groupId); }}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                                        title="حذف المجموعة"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    {expandedGroups.has(group.groupId) ? (
                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Reading/Poetry Content Display */}
                            {expandedGroups.has(group.groupId) && getMediaContent(group.questions[0]) && (
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/30 dark:to-gray-900/30">
                                    {getMediaContent(group.questions[0]).type === 'reading' && (
                                        <div className="space-y-2">
                                            {getMediaContent(group.questions[0]).title && (
                                                <h4 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5" />
                                                    {getMediaContent(group.questions[0]).title}
                                                </h4>
                                            )}
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {getMediaContent(group.questions[0]).text}
                                            </div>
                                        </div>
                                    )}
                                    {getMediaContent(group.questions[0]).type === 'poetry' && (
                                        <div className="space-y-2">
                                            {getMediaContent(group.questions[0]).title && (
                                                <h4 className="text-lg font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                                    🎭 {getMediaContent(group.questions[0]).title}
                                                </h4>
                                            )}
                                            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                                <div className="space-y-2 text-center">
                                                    {getMediaContent(group.questions[0]).verses?.map((verse: any, vIndex: number) => (
                                                        <div key={vIndex} className="flex items-center justify-center gap-8 text-gray-800 dark:text-gray-200">
                                                            <span className="text-lg">{verse.first || verse.firstLine}</span>
                                                            <span className="text-amber-400">⋯</span>
                                                            <span className="text-lg">{verse.second || verse.secondLine}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Group Questions */}
                            <AnimatePresence>
                                {expandedGroups.has(group.groupId) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="divide-y divide-gray-100 dark:divide-gray-800"
                                    >
                                        {group.questions.map((question, qIndex) => (
                                            <div
                                                key={question.id}
                                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                                                        {qIndex + 1}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-900 dark:text-white font-medium mb-3">
                                                            {getQuestionText(question)}
                                                        </p>

                                                        {question.type === 'mcq' && question.options && (
                                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                                {question.options.map((opt: any, i: number) => (
                                                                    <div
                                                                        key={i}
                                                                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${opt.isCorrect
                                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                                            }`}
                                                                    >
                                                                        {opt.isCorrect && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                                                                        <span>{opt.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {question.explanation?.ar && (
                                                            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                                                                <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                                <div>
                                                                    <span className="font-medium text-blue-700 dark:text-blue-300">الشرح: </span>
                                                                    <span className="text-blue-600 dark:text-blue-400">{question.explanation.ar}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-3 mt-3">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyConfig[question.difficulty as 'easy' | 'medium' | 'hard'].bg} ${difficultyConfig[question.difficulty as 'easy' | 'medium' | 'hard'].color}`}>
                                                                {difficultyConfig[question.difficulty as 'easy' | 'medium' | 'hard'].label}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                                                {typeLabels[question.type || 'mcq'] || question.type}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {question.points} نقطة
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <Link
                                                            href={`/admin/question-bank/${question.id}/edit`}
                                                            className="p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg text-primary-600"
                                                            title="تعديل"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => openDeleteQuestionModal(question)}
                                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onCancel={() => setDeleteModal({ isOpen: false, type: 'question', id: null, name: "", count: 0 })}
                onConfirm={confirmDelete}
                title={deleteModal.type === 'question' ? "حذف السؤال" : "حذف المجموعة"}
                itemName={deleteModal.name}
                description={
                    deleteModal.type === 'group'
                        ? `سيتم حذف ${deleteModal.count} سؤال تابع للمجموعة. هذا الإجراء لا يمكن التراجع عنه.`
                        : "هذا الإجراء لا يمكن التراجع عنه"
                }
                isDeleting={isDeleting}
            />
        </div>
    );
}
