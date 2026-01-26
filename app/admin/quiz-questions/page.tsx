"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Trash2,
    Edit,
    Eye,
    EyeOff,
    RefreshCw,
    Loader2,
    CheckCircle,
    XCircle,
    Gamepad2,
    BookOpen,
    HelpCircle,
    Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { QuizQuestion } from "@/lib/database.types";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Stage {
    id: string;
    name: string;
    slug: string;
    is_active: boolean | null;
    order_index: number | null;
}

interface Subject {
    id: string;
    name: string;
    slug: string;
    stage_id: string | null;
    is_active: boolean | null;
    order_index: number | null;
    color: string | null;
    icon: string | null;
}

interface SubjectStage {
    id: string;
    subject_id: string;
    stage_id: string;
    is_active: boolean | null;
}

interface QuestionWithDetails extends Omit<QuizQuestion, 'stage_id' | 'subject_id' | 'language'> {
    lessons?: { title: string } | null;
    language?: string | null;
    stage_id?: string | null;
    subject_id?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DIFFICULTIES = [
    { id: "easy", name: "سهل", color: "bg-green-500" },
    { id: "medium", name: "متوسط", color: "bg-yellow-500" },
    { id: "hard", name: "صعب", color: "bg-red-500" },
] as const;

const QUESTION_TYPES = [
    { id: "multiple_choice", name: "اختيار من متعدد" },
    { id: "true_false", name: "صح أو خطأ" },
    { id: "fill_blank", name: "أكمل الفراغ" },
] as const;

const LANGUAGES = [
    { id: "ar", name: "عربي", icon: "🇸🇦" },
    { id: "en", name: "English", icon: "🇬🇧" },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════

function useStagesAndSubjects() {
    const [stages, setStages] = useState<Stage[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectStages, setSubjectStages] = useState<SubjectStage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            
            // Fetch stages and subjects
            const [stagesRes, subjectsRes] = await Promise.all([
                supabase
                    .from("educational_stages")
                    .select("id, name, slug, is_active, order_index")
                    .eq("is_active", true)
                    .order("order_index"),
                supabase
                    .from("subjects")
                    .select("id, name, slug, stage_id, is_active, order_index, color, icon")
                    .eq("is_active", true)
                    .order("order_index"),
            ]);

            // Fetch subject_stages - table exists but not in TypeScript types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ssClient = supabase as any;
            const { data: ssData } = await ssClient
                .from("subject_stages")
                .select("id, subject_id, stage_id, is_active")
                .eq("is_active", true) as { data: SubjectStage[] | null };

            if (stagesRes.data) setStages(stagesRes.data);
            if (subjectsRes.data) setSubjects(subjectsRes.data);
            if (ssData) setSubjectStages(ssData);
            setIsLoading(false);
        };

        fetchData();
    }, []);

    return { stages, subjects, subjectStages, isLoading };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function QuizQuestionsPage() {
    // Data from database
    const { stages, subjects, subjectStages, isLoading: loadingMeta } = useStagesAndSubjects();
    
    // Questions state
    const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStage, setSelectedStage] = useState<string>("all");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [showInactive, setShowInactive] = useState(false);
    
    // Modal state
    const [isCreating, setIsCreating] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuestionWithDetails | null>(null);
    const [stats, setStats] = useState({ total: 0, active: 0, forGame: 0 });

    // Filter subjects by selected stage using subject_stages junction table
    const filteredSubjects = useMemo(() => {
        if (selectedStage === "all") return subjects;
        // Get subject IDs that are linked to the selected stage
        const subjectIdsForStage = subjectStages
            .filter(ss => ss.stage_id === selectedStage)
            .map(ss => ss.subject_id);
        return subjects.filter(s => subjectIdsForStage.includes(s.id));
    }, [subjects, subjectStages, selectedStage]);

    // Reset subject when stage changes (only if subject is not in filtered list)
    useEffect(() => {
        if (selectedStage !== "all" && selectedSubject !== "all") {
            const subjectIdsForStage = subjectStages
                .filter(ss => ss.stage_id === selectedStage)
                .map(ss => ss.subject_id);
            if (!subjectIdsForStage.includes(selectedSubject)) {
                setSelectedSubject("all");
            }
        }
    }, [selectedStage, selectedSubject, subjectStages]);

    // Fetch questions
    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        const supabase = createClient();

        let query = supabase
            .from("quiz_questions")
            .select("*, lessons(title)")
            .order("created_at", { ascending: false });

        if (!showInactive) {
            query = query.eq("is_active", true);
        }
        if (selectedStage !== "all") {
            query = query.eq("stage_id", selectedStage);
        }
        if (selectedSubject !== "all") {
            query = query.eq("subject_id", selectedSubject);
        }
        if (selectedLanguage !== "all") {
            query = query.eq("language", selectedLanguage);
        }
        if (selectedDifficulty !== "all") {
            query = query.eq("difficulty", selectedDifficulty);
        }
        if (selectedType !== "all") {
            query = query.eq("type", selectedType);
        }

        const { data, error } = await query;

        if (!error && data) {
            setQuestions(data);
        }
        setIsLoading(false);
    }, [showInactive, selectedStage, selectedSubject, selectedLanguage, selectedDifficulty, selectedType]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("quiz_questions")
            .select("id, is_active, type");

        if (data) {
            setStats({
                total: data.length,
                active: data.filter((q) => q.is_active).length,
                forGame: data.filter((q) => q.is_active && q.type === "multiple_choice").length,
            });
        }
    }, []);

    useEffect(() => {
        fetchQuestions();
        fetchStats();
    }, [fetchQuestions, fetchStats]);

    // Filter by search
    const filteredQuestions = questions.filter((q) => {
        if (!searchQuery) return true;
        const text = (q.text as { ar?: string; en?: string })?.ar || "";
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Toggle active status
    const toggleActive = async (id: string, currentStatus: boolean) => {
        const supabase = createClient();
        await supabase
            .from("quiz_questions")
            .update({ is_active: !currentStatus })
            .eq("id", id);
        fetchQuestions();
        fetchStats();
    };

    // Delete question
    const deleteQuestion = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;
        const supabase = createClient();
        await supabase.from("quiz_questions").delete().eq("id", id);
        fetchQuestions();
        fetchStats();
    };

    // Get question text based on language
    const getQuestionText = (q: QuestionWithDetails) => {
        const text = q.text as { ar?: string; en?: string };
        return text?.ar || text?.en || "بدون نص";
    };

    // Get difficulty info
    const getDifficultyInfo = (difficultyId: string | null) => {
        const diff = DIFFICULTIES.find((d) => d.id === difficultyId);
        return diff || { name: "متوسط", color: "bg-gray-500" };
    };

    // Get language info
    const getLanguageInfo = (langId: string | null | undefined) => {
        const lang = LANGUAGES.find((l) => l.id === langId);
        return lang || { id: "ar", name: "عربي", icon: "🇸🇦" };
    };

    // Get subject name by ID
    const getSubjectName = (subjectId: string | null | undefined) => {
        if (!subjectId) return null;
        const subject = subjects.find(s => s.id === subjectId);
        return subject?.name || null;
    };

    // Get stage name by ID
    const getStageName = (stageId: string | null | undefined) => {
        if (!stageId) return null;
        const stage = stages.find(s => s.id === stageId);
        return stage?.name || null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                            <Gamepad2 className="h-6 w-6 text-white" />
                        </div>
                        أسئلة الكويز
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        إدارة الأسئلة للدروس ونظام اللعبة
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="h-5 w-5" />
                    إضافة سؤال
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الأسئلة</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">الأسئلة النشطة</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Gamepad2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">متاحة للعبة</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.forGame}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث في الأسئلة..."
                            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                </div>

                {/* Stage Filter */}
                <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">كل المراحل</option>
                    {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                            {stage.name}
                        </option>
                    ))}
                </select>

                {/* Subject Filter */}
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={loadingMeta}
                >
                    <option value="all">كل المواد</option>
                    {filteredSubjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.name}
                        </option>
                    ))}
                </select>

                {/* Language Filter */}
                <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">كل اللغات</option>
                    {LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                            {lang.icon} {lang.name}
                        </option>
                    ))}
                </select>

                {/* Difficulty Filter */}
                <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">كل المستويات</option>
                        {DIFFICULTIES.map((diff) => (
                            <option key={diff.id} value={diff.id}>
                                {diff.name}
                            </option>
                        ))}
                </select>

                {/* Type Filter */}
                <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">كل الأنواع</option>
                        {QUESTION_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                </select>

                {/* Show Inactive Toggle */}
                <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                            showInactive
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400"
                        }`}
                    >
                        {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {showInactive ? "إخفاء غير النشطة" : "إظهار غير النشطة"}
                </button>

                {/* Refresh */}
                <button
                        onClick={() => {
                            fetchQuestions();
                            fetchStats();
                        }}
                        className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Questions List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                ) : filteredQuestions.length === 0 ? (
                        <div className="text-center py-20">
                            <HelpCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">لا توجد أسئلة</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-4 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                            >
                                إضافة أول سؤال
                            </button>
                    </div>
                ) : (
                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredQuestions.map((question, index) => (
                                <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                                        !question.is_active ? "opacity-60" : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-900 dark:text-white font-medium truncate">
                                                {getQuestionText(question)}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {/* Stage Badge */}
                                                {getStageName(question.stage_id) && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                        <Layers className="h-3 w-3" />
                                                        {getStageName(question.stage_id)}
                                                    </span>
                                                )}
                                                {/* Subject Badge */}
                                                {getSubjectName(question.subject_id) && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                        <BookOpen className="h-3 w-3" />
                                                        {getSubjectName(question.subject_id)}
                                                    </span>
                                                )}
                                                {/* Language Badge */}
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                                    {getLanguageInfo(question.language).icon} {getLanguageInfo(question.language).name}
                                                </span>
                                                {/* Difficulty Badge */}
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs text-white ${
                                                        getDifficultyInfo(question.difficulty).color
                                                    }`}
                                                >
                                                    {getDifficultyInfo(question.difficulty).name}
                                                </span>
                                                {/* Type Badge */}
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {QUESTION_TYPES.find((t) => t.id === question.type)?.name || question.type}
                                                </span>
                                                {/* Game Ready Badge */}
                                                {question.type === "multiple_choice" && question.is_active && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                        <Gamepad2 className="h-3 w-3" />
                                                        جاهز للعبة
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => toggleActive(question.id, question.is_active || false)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    question.is_active
                                                        ? "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                }`}
                                                title={question.is_active ? "إلغاء التفعيل" : "تفعيل"}
                                            >
                                                {question.is_active ? (
                                                    <CheckCircle className="h-5 w-5" />
                                                ) : (
                                                    <XCircle className="h-5 w-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setEditingQuestion(question)}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                                title="تعديل"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteQuestion(question.id)}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {(isCreating || editingQuestion) && (
                    <QuestionModal
                        question={editingQuestion}
                        onClose={() => {
                            setIsCreating(false);
                            setEditingQuestion(null);
                        }}
                        onSave={() => {
                            setIsCreating(false);
                            setEditingQuestion(null);
                            fetchQuestions();
                            fetchStats();
                        }}
                        stages={stages}
                        subjects={subjects}
                        subjectStages={subjectStages}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Question Modal Component
function QuestionModal({
    question,
    onClose,
    onSave,
    stages,
    subjects,
    subjectStages,
}: {
    question: QuestionWithDetails | null;
    onClose: () => void;
    onSave: () => void;
    stages: Stage[];
    subjects: Subject[];
    subjectStages: SubjectStage[];
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        textAr: "",
        textEn: "",
        type: "multiple_choice",
        stageId: "",
        subjectId: "",
        language: "ar",
        difficulty: "medium",
        options: [
            { id: "1", textAr: "", textEn: "" },
            { id: "2", textAr: "", textEn: "" },
            { id: "3", textAr: "", textEn: "" },
            { id: "4", textAr: "", textEn: "" },
        ],
        correctOptionId: "1",
        explanationAr: "",
        explanationEn: "",
        isActive: true,
    });

    // Filter subjects by selected stage using subject_stages junction table
    const filteredSubjects = useMemo(() => {
        if (!formData.stageId) return subjects;
        // Get subject IDs that are linked to the selected stage
        const subjectIdsForStage = subjectStages
            .filter(ss => ss.stage_id === formData.stageId)
            .map(ss => ss.subject_id);
        return subjects.filter(s => subjectIdsForStage.includes(s.id));
    }, [subjects, subjectStages, formData.stageId]);

    // Load existing question data
    useEffect(() => {
        if (question) {
            const text = question.text as { ar?: string; en?: string } | null;
            const explanation = question.explanation as { ar?: string; en?: string } | null;
            const options = question.options as { id: string; text: { ar?: string; en?: string } }[] | null;

            setFormData({
                textAr: text?.ar || "",
                textEn: text?.en || "",
                type: question.type || "multiple_choice",
                stageId: question.stage_id || "",
                subjectId: question.subject_id || "",
                language: question.language || "ar",
                difficulty: question.difficulty || "medium",
                options: options?.map((o) => ({
                    id: o.id,
                    textAr: o.text?.ar || "",
                    textEn: o.text?.en || "",
                })) || [
                    { id: "1", textAr: "", textEn: "" },
                    { id: "2", textAr: "", textEn: "" },
                    { id: "3", textAr: "", textEn: "" },
                    { id: "4", textAr: "", textEn: "" },
                ],
                correctOptionId: question.correct_option_id || "1",
                explanationAr: explanation?.ar || "",
                explanationEn: explanation?.en || "",
                isActive: question.is_active ?? true,
            });
        }
    }, [question]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const supabase = createClient();

        const questionData = {
            text: { ar: formData.textAr, en: formData.textEn },
            type: formData.type,
            stage_id: formData.stageId || null,
            subject_id: formData.subjectId || null,
            language: formData.language,
            difficulty: formData.difficulty,
            options: formData.options.map((o) => ({
                id: o.id,
                text: { ar: o.textAr, en: o.textEn },
            })),
            correct_option_id: formData.correctOptionId,
            explanation: { ar: formData.explanationAr, en: formData.explanationEn },
            is_active: formData.isActive,
        };

        if (question) {
            await supabase
                .from("quiz_questions")
                .update(questionData)
                .eq("id", question.id);
        } else {
            await supabase.from("quiz_questions").insert(questionData);
        }

        setIsLoading(false);
        onSave();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
            >
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {question ? "تعديل السؤال" : "إضافة سؤال جديد"}
                        </h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Question Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                نص السؤال (عربي)
                            </label>
                            <textarea
                                value={formData.textAr}
                                onChange={(e) => setFormData({ ...formData, textAr: e.target.value })}
                                rows={3}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="أدخل نص السؤال..."
                            />
                        </div>

                        {/* Type, Category, Difficulty */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    النوع
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {QUESTION_TYPES.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    الصعوبة
                                </label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {DIFFICULTIES.map((diff) => (
                                        <option key={diff.id} value={diff.id}>
                                            {diff.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Stage, Subject, Language Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    المرحلة الدراسية
                                </label>
                                <select
                                    value={formData.stageId}
                                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value, subjectId: "" })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">اختر المرحلة</option>
                                    {stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    المادة
                                </label>
                                <select
                                    value={formData.subjectId}
                                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">اختر المادة</option>
                                    {filteredSubjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    لغة المحتوى
                                </label>
                                <select
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.id} value={lang.id}>
                                            {lang.icon} {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Options (for MCQ) */}
                        {formData.type === "multiple_choice" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    الخيارات
                                </label>
                                <div className="space-y-3">
                                    {formData.options.map((option, index) => (
                                        <div key={option.id} className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="correctOption"
                                                checked={formData.correctOptionId === option.id}
                                                onChange={() => setFormData({ ...formData, correctOptionId: option.id })}
                                                className="w-5 h-5 text-green-500 focus:ring-green-500"
                                            />
                                            <input
                                                type="text"
                                                value={option.textAr}
                                                onChange={(e) => {
                                                    const newOptions = [...formData.options];
                                                    newOptions[index].textAr = e.target.value;
                                                    setFormData({ ...formData, options: newOptions });
                                                }}
                                                placeholder={`الخيار ${index + 1}`}
                                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                            {formData.correctOptionId === option.id && (
                                                <span className="text-green-500 text-sm">✓ صحيح</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    اختر الإجابة الصحيحة بالضغط على الدائرة
                                </p>
                            </div>
                        )}

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="isActive" className="text-gray-700 dark:text-gray-300">
                                السؤال نشط (متاح للاستخدام)
                            </label>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {question ? "حفظ التغييرات" : "إضافة السؤال"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
