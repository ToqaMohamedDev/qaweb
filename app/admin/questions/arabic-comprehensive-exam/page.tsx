"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Plus,
    X,
    Trash2,
    Save,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
    ArabicBlockType,
    ArabicQuestionType,
    BranchTag,
    ExamBlock,
    ArabicExamQuestion,
    ReadingBlock,
    PoetryBlock,
    GrammarBlock,
    ExpressionBlock,
    UsageScope,
    GradingMode,
} from "@/lib/types/exam-templates";

// Types for database entities
interface EducationalStage {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    slug: string;
    created_at: string;
    updated_at: string;
}

interface Subject {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    order_index?: number;
}

interface Lesson {
    id: string;
    subject_id: string;
    title: string;
    description: string | null;
    is_published: boolean;
    order_index?: number;
}

const branchOptions: BranchTag[] = ["Naho", "Adab", "Balagha", "Qiraa", "Qesaa", "Taraaib", "TafkirNaqdi"];

const blockTypeLabels: Record<ArabicBlockType, string> = {
    reading_passage: "نص قراءة",
    poetry_text: "نص شعري",
    grammar_block: "نحو/قواعد",
    expression_block: "تعبير",
};

const questionTypeLabels: Record<ArabicQuestionType, string> = {
    mcq: "اختيار من متعدد",
    maqali: "سؤال مقالي",
    comparison_story: "مقارنة قصة",
    rhetoric: "بلاغة",
    grammar_extraction: "استخراج نحوي",
};

export default function ArabicComprehensiveExam() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = searchParams?.get("id") || null;

    // Educational hierarchy state
    const [stages, setStages] = useState<EducationalStage[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [isLoadingStages, setIsLoadingStages] = useState(true);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [isLoadingLessons, setIsLoadingLessons] = useState(false);

    // Exam state
    const [examTitle, setExamTitle] = useState("");
    const [examDescription, setExamDescription] = useState("");
    const [totalMarks, setTotalMarks] = useState<number | "">(80);
    const [durationMinutes, setDurationMinutes] = useState<number | "">(150);
    const [gradingMode, setGradingMode] = useState<GradingMode>("hybrid");
    const [branchTags, setBranchTags] = useState<BranchTag[]>(["Qiraa", "Adab"]);
    const [usageScope, setUsageScope] = useState<UsageScope>("exam");
    const [selectedLesson, setSelectedLesson] = useState<string>("");
    const [blocks, setBlocks] = useState<ExamBlock[]>([]);
    const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingExam, setIsLoadingExam] = useState(false);
    const [successNotification, setSuccessNotification] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: "",
    });

    // Fetch educational stages on mount
    useEffect(() => {
        const fetchStages = async () => {
            setIsLoadingStages(true);
            try {
                const { data, error } = await supabase
                    .from("educational_stages")
                    .select("*")
                    .order("created_at", { ascending: true });

                if (error) throw error;
                setStages(data || []);
            } catch (err) {
                console.error("Error fetching stages:", err);
            } finally {
                setIsLoadingStages(false);
            }
        };
        fetchStages();
    }, []);

    // Fetch subjects when stage is selected
    // Note: Subjects are now independent from stages, so we fetch all active subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedStage) {
                setSubjects([]);
                setSelectedSubject("");
                return;
            }

            setIsLoadingSubjects(true);
            try {
                // المواد الآن مستقلة - نجلب جميع المواد النشطة
                const { data, error } = await supabase
                    .from("subjects")
                    .select("*")
                    .eq("is_active", true)
                    .order("order_index", { ascending: true });

                if (error) throw error;
                setSubjects(data || []);
                setSelectedSubject("");
                setLessons([]);
                setSelectedLesson("");
            } catch (err) {
                console.error("Error fetching subjects:", err);
            } finally {
                setIsLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, [selectedStage]);

    // Fetch lessons when subject is selected (filtered by stage and subject)
    useEffect(() => {
        const fetchLessons = async () => {
            if (!selectedSubject || !selectedStage) {
                setLessons([]);
                setSelectedLesson("");
                return;
            }

            setIsLoadingLessons(true);
            try {
                // جلب الدروس المرتبطة بالمرحلة والمادة معاً
                const { data, error } = await supabase
                    .from("lessons")
                    .select("*")
                    .eq("subject_id", selectedSubject)
                    .eq("stage_id", selectedStage)
                    .order("order_index", { ascending: true });

                if (error) throw error;
                setLessons(data || []);
                setSelectedLesson("");
            } catch (err) {
                console.error("Error fetching lessons:", err);
            } finally {
                setIsLoadingLessons(false);
            }
        };
        fetchLessons();
    }, [selectedSubject, selectedStage]);

    // Load exam if editing
    useEffect(() => {
        const loadExam = async () => {
            if (!examId) return;
            setIsLoadingExam(true);
            try {
                const { data, error } = await supabase
                    .from("comprehensive_exams")
                    .select("*")
                    .eq("id", examId)
                    .single();

                if (error) throw error;

                if (data && data.type === "arabic_comprehensive_exam") {
                    setExamTitle(data.exam_title || "");
                    setExamDescription(data.exam_description || "");
                    setTotalMarks(data.total_marks ?? "");
                    setDurationMinutes(data.duration_minutes ?? "");
                    setGradingMode((data.grading_mode as GradingMode) || "hybrid");
                    setBranchTags((data.branch_tags as BranchTag[]) || []);
                    setUsageScope((data.usage_scope as UsageScope) || "exam");
                    setSelectedLesson(data.lesson_id || "");
                    setBlocks((data.blocks as unknown as ExamBlock[]) || []);

                    // Expand first block
                    const blocksData = data.blocks as unknown as ExamBlock[];
                    if (blocksData && blocksData.length > 0) {
                        setExpandedBlocks({ [blocksData[0].id]: true });
                    }
                }
            } catch (err) {
                console.error("Error loading exam", err);
                alert("حدث خطأ أثناء تحميل الامتحان");
            } finally {
                setIsLoadingExam(false);
            }
        };
        loadExam();
    }, [examId]);

    const toggleBlock = (blockId: string) => {
        setExpandedBlocks((prev) => ({
            ...prev,
            [blockId]: !prev[blockId],
        }));
    };

    const addBlock = (type: ArabicBlockType) => {
        const base = {
            id: `blk-${type}-${Date.now()}`,
            type,
            order: blocks.length + 1,
            branchTag: undefined,
            title: "",
        };

        let block: ExamBlock;
        if (type === "reading_passage") {
            block = {
                ...base,
                type: "reading_passage",
                genre: "Scientific",
                bodyText: "",
                questions: [],
            } as ReadingBlock;
        } else if (type === "poetry_text") {
            block = {
                ...base,
                type: "poetry_text",
                poemTitle: "",
                poet: "",
                verses: [{ shatrA: "", shatrB: "" }],
                questions: [],
            } as PoetryBlock;
        } else if (type === "grammar_block") {
            block = {
                ...base,
                type: "grammar_block",
                contextText: "",
                questions: [],
            } as GrammarBlock;
        } else {
            block = {
                ...base,
                type: "expression_block",
                variant: "functional",
                prompt: "",
                constraints: { maxLines: 8 },
                questions: [],
            } as ExpressionBlock;
        }

        setBlocks((prev) => [...prev, block]);
        setExpandedBlocks((prev) => ({ ...prev, [block.id]: true }));
    };

    const removeBlock = (id: string) => {
        setBlocks((prev) =>
            prev.filter((b) => b.id !== id).map((b, idx) => ({ ...b, order: idx + 1 }))
        );
    };

    const updateBlock = (id: string, updater: (b: ExamBlock) => ExamBlock) => {
        setBlocks((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
    };

    const addQuestion = (blockId: string, type: ArabicQuestionType) => {
        const newQ: ArabicExamQuestion =
            type === "mcq"
                ? {
                    id: `q-${Date.now()}`,
                    type: "mcq",
                    weight: 1,
                    stem: "",
                    options: ["", "", "", ""],
                    correctIndex: 0,
                }
                : type === "maqali"
                    ? { id: `q-${Date.now()}`, type: "maqali", weight: 4, prompt: "", modelAnswerKeywords: [] }
                    : type === "comparison_story"
                        ? {
                            id: `q-${Date.now()}`,
                            type: "comparison_story",
                            weight: 4,
                            prompt: "",
                            externalSnippet: "",
                            modelAnswerKeywords: [],
                        }
                        : type === "rhetoric"
                            ? { id: `q-${Date.now()}`, type: "rhetoric", weight: 2, prompt: "", correctAnswer: "" }
                            : {
                                id: `q-${Date.now()}`,
                                type: "grammar_extraction",
                                weight: 2,
                                prompt: "",
                                correctAnswer: "",
                            };

        updateBlock(blockId, (b) => ({
            ...b,
            questions: [...b.questions, newQ],
        }));
    };

    const updateQuestion = (blockId: string, qId: string, updater: (q: ArabicExamQuestion) => ArabicExamQuestion) => {
        updateBlock(blockId, (b) => ({
            ...b,
            questions: b.questions.map((q) => (q.id === qId ? updater(q) : q)),
        }));
    };

    const removeQuestion = (blockId: string, qId: string) => {
        updateBlock(blockId, (b) => ({
            ...b,
            questions: b.questions.filter((q) => q.id !== qId),
        }));
    };

    const validate = () => {
        if (!selectedStage) {
            setSubmitError("اختر المرحلة التعليمية");
            return false;
        }
        if (!selectedSubject) {
            setSubmitError("اختر المادة");
            return false;
        }
        if (!examTitle.trim()) {
            setSubmitError("أدخل عنوان الامتحان");
            return false;
        }
        if (usageScope === "lesson" && !selectedLesson) {
            setSubmitError("اختر درساً عند استخدام قالب درس");
            return false;
        }
        if (!blocks.length) {
            setSubmitError("أضف على الأقل كتلة واحدة");
            return false;
        }
        setSubmitError("");
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        setSuccessNotification({ isOpen: false, message: "" });

        try {
            const payload = {
                type: "arabic_comprehensive_exam",
                language: "arabic",
                usage_scope: usageScope,
                stage_id: selectedStage || null,
                subject_id: selectedSubject || null,
                lesson_id: usageScope === "lesson" && selectedLesson ? selectedLesson : null,
                exam_title: examTitle.trim(),
                exam_description: examDescription.trim() || null,
                total_marks: totalMarks !== "" ? Number(totalMarks) : null,
                duration_minutes: durationMinutes !== "" ? Number(durationMinutes) : null,
                grading_mode: gradingMode,
                branch_tags: branchTags,
                blocks: blocks.map((b, idx) => ({ ...b, order: idx + 1 })),
                is_published: false,
                updated_at: new Date().toISOString(),
            };

            if (examId) {
                const { error } = await supabase
                    .from("comprehensive_exams")
                    .update(payload as any)
                    .eq("id", examId);

                if (error) throw error;
                setSuccessNotification({ isOpen: true, message: "تم تحديث الامتحان" });
            } else {
                const { error } = await supabase.from("comprehensive_exams").insert({
                    ...payload,
                    created_by: "admin",
                    created_at: new Date().toISOString(),
                } as any);

                if (error) throw error;
                setSuccessNotification({ isOpen: true, message: "تم إنشاء الامتحان" });
                setBlocks([]);
                setExamTitle("");
                setExamDescription("");
            }

            setTimeout(() => {
                setSuccessNotification({ isOpen: false, message: "" });
                router.push("/admin/questions");
            }, 1200);
        } catch (err) {
            console.error("Error saving exam", err);
            setSubmitError("حدث خطأ أثناء حفظ الامتحان");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderQuestionCard = (block: ExamBlock, q: ArabicExamQuestion) => {
        const common = (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">الوزن (درجة)</label>
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={q.weight}
                        onChange={(e) =>
                            updateQuestion(block.id, q.id, (qq) => ({ ...qq, weight: Number(e.target.value) }))
                        }
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24]"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">فرع</label>
                    <select
                        value={q.branchTag || ""}
                        onChange={(e) =>
                            updateQuestion(block.id, q.id, (qq) => ({
                                ...qq,
                                branchTag: (e.target.value || undefined) as BranchTag,
                            }))
                        }
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] text-sm"
                    >
                        <option value="">بدون</option>
                        {branchOptions.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );

        if (q.type === "mcq") {
            return (
                <div className="space-y-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
                    <textarea
                        rows={2}
                        value={q.stem}
                        onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, stem: e.target.value }))}
                        placeholder="اكتب نص السؤال..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                    />
                    <div className="space-y-2">
                        {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={`mc-${block.id}-${q.id}`}
                                    checked={q.correctIndex === optIndex}
                                    onChange={() =>
                                        updateQuestion(block.id, q.id, (qq) => ({ ...qq, correctIndex: optIndex }))
                                    }
                                    className="h-4 w-4 text-primary-600"
                                />
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                        const next = [...q.options];
                                        next[optIndex] = e.target.value;
                                        updateQuestion(block.id, q.id, (qq) => ({ ...qq, options: next }));
                                    }}
                                    placeholder={`الخيار ${optIndex + 1}`}
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24]"
                                />
                            </div>
                        ))}
                    </div>
                    {common}
                </div>
            );
        }

        if (q.type === "maqali") {
            return (
                <div className="space-y-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
                    <textarea
                        rows={3}
                        value={q.prompt}
                        onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, prompt: e.target.value }))}
                        placeholder="اكتب نص السؤال..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                        كلمات مفتاحية للإجابة النموذجية
                    </label>
                    <textarea
                        rows={2}
                        value={(q.modelAnswerKeywords || []).join(", ")}
                        onChange={(e) =>
                            updateQuestion(block.id, q.id, (qq) => ({
                                ...qq,
                                modelAnswerKeywords: e.target.value
                                    .split(",")
                                    .map((w) => w.trim())
                                    .filter(Boolean),
                            }))
                        }
                        placeholder="مثال: مقدمة، عرض، خاتمة"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                    />
                    {common}
                </div>
            );
        }

        if (q.type === "comparison_story") {
            return (
                <div className="space-y-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
                    <textarea
                        rows={3}
                        value={q.prompt}
                        onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, prompt: e.target.value }))}
                        placeholder="اكتب نص السؤال..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400">مقتطف من «الأيام»</label>
                    <textarea
                        rows={3}
                        value={q.externalSnippet}
                        onChange={(e) =>
                            updateQuestion(block.id, q.id, (qq) => ({ ...qq, externalSnippet: e.target.value }))
                        }
                        placeholder="ضع المقتطف المطلوب المقارنة معه..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400">كلمات مفتاحية</label>
                    <textarea
                        rows={2}
                        value={(q.modelAnswerKeywords || []).join(", ")}
                        onChange={(e) =>
                            updateQuestion(block.id, q.id, (qq) => ({
                                ...qq,
                                modelAnswerKeywords: e.target.value
                                    .split(",")
                                    .map((w) => w.trim())
                                    .filter(Boolean),
                            }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                    />
                    {common}
                </div>
            );
        }

        // rhetoric or grammar_extraction
        return (
            <div className="space-y-3">
                <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
                <textarea
                    rows={2}
                    value={q.prompt}
                    onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, prompt: e.target.value }))}
                    placeholder="اكتب نص السؤال..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                />
                <label className="text-xs text-gray-500 dark:text-gray-400">الإجابة المرجعية (اختياري)</label>
                <textarea
                    rows={2}
                    value={q.correctAnswer || ""}
                    onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, correctAnswer: e.target.value }))}
                    placeholder="ضع إجابة مرجعية للمعلم"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                />
                {common}
            </div>
        );
    };

    if (isLoadingExam) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50">
                        <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {examId ? "تعديل امتحان عربي شامل" : "إنشاء امتحان عربي شامل"}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            قالب كتل: قراءة، شعر، نحو، تعبير مع أسئلة متعددة الأنماط.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => router.push("/admin/questions")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors"
                >
                    <X className="h-4 w-4" />
                    إلغاء
                </button>
            </div>

            {/* Exam Info */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">معلومات الامتحان</h2>

                {/* Usage Scope */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        نطاق الاستخدام *
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="usageScope"
                                value="exam"
                                checked={usageScope === "exam"}
                                onChange={() => setUsageScope("exam")}
                                className="h-4 w-4 text-primary-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">امتحان شامل</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="usageScope"
                                value="lesson"
                                checked={usageScope === "lesson"}
                                onChange={() => setUsageScope("lesson")}
                                className="h-4 w-4 text-primary-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">قالب درس</span>
                        </label>
                    </div>
                </div>

                {/* Educational Hierarchy Selection - Always show for both exam and lesson scopes */}
                <div className="space-y-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                        {usageScope === "lesson" ? "اختيار السياق التعليمي" : "اختيار المرحلة والمادة"}
                    </h3>

                    {/* Stage Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            المرحلة التعليمية *
                        </label>
                        <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            disabled={isLoadingStages}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            <option value="">
                                {isLoadingStages ? "جاري التحميل..." : "اختر المرحلة..."}
                            </option>
                            {stages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Selection */}
                    {selectedStage && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                المادة *
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={isLoadingSubjects}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {isLoadingSubjects ? "جاري التحميل..." : subjects.length === 0 ? "لا توجد مواد" : "اختر المادة..."}
                                </option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Lesson Selection - Only for lesson scope */}
                    {usageScope === "lesson" && selectedSubject && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                الدرس *
                            </label>
                            <select
                                value={selectedLesson}
                                onChange={(e) => setSelectedLesson(e.target.value)}
                                disabled={isLoadingLessons}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {isLoadingLessons ? "جاري التحميل..." : lessons.length === 0 ? "لا توجد دروس" : "اختر الدرس..."}
                                </option>
                                {lessons.map((lesson) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        {lesson.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Selection Summary */}
                    {(usageScope === "exam" && selectedSubject) && (
                        <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ تم الاختيار: {stages.find(s => s.id === selectedStage)?.name} ← {subjects.find(s => s.id === selectedSubject)?.name}
                            </p>
                        </div>
                    )}
                    {(usageScope === "lesson" && selectedLesson) && (
                        <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ تم الاختيار: {stages.find(s => s.id === selectedStage)?.name} ← {subjects.find(s => s.id === selectedSubject)?.name} ← {lessons.find(l => l.id === selectedLesson)?.title}
                            </p>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        عنوان الامتحان *
                    </label>
                    <input
                        type="text"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder="مثال: امتحان اللغة العربية - الفصل الأول"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        الوصف (اختياري)
                    </label>
                    <textarea
                        rows={3}
                        value={examDescription}
                        onChange={(e) => setExamDescription(e.target.value)}
                        placeholder="وصف مختصر للامتحان..."
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Marks */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            الدرجة الكلية
                        </label>
                        <input
                            type="number"
                            value={totalMarks}
                            onChange={(e) => setTotalMarks(e.target.value ? Number(e.target.value) : "")}
                            placeholder="80"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            المدة (دقيقة)
                        </label>
                        <input
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : "")}
                            placeholder="150"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Grading Mode */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            وضع التصحيح
                        </label>
                        <select
                            value={gradingMode}
                            onChange={(e) => setGradingMode(e.target.value as GradingMode)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="auto">تلقائي</option>
                            <option value="manual">يدوي</option>
                            <option value="hybrid">مختلط</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Add Blocks */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">إضافة كتل</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(blockTypeLabels) as ArabicBlockType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => addBlock(type)}
                            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 dark:border-[#2e2e3a] hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                        >
                            <Plus className="h-4 w-4 text-primary-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {blockTypeLabels[type]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Blocks */}
            <div className="space-y-4">
                {blocks.map((block, blockIndex) => (
                    <motion.div
                        key={block.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] overflow-hidden"
                    >
                        {/* Block Header */}
                        <div
                            onClick={() => toggleBlock(block.id)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                        {blockIndex + 1}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                        {block.title || `كتلة ${blockIndex + 1}`}
                                        <span className="text-sm font-normal text-gray-500 mr-2">
                                            - {blockTypeLabels[block.type]}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {block.questions.length} سؤال
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeBlock(block.id);
                                    }}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                {expandedBlocks[block.id] ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </div>
                        </div>

                        {/* Block Content */}
                        <AnimatePresence>
                            {expandedBlocks[block.id] && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-4 space-y-4"
                                >
                                    {/* Block Title */}
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">عنوان الكتلة</label>
                                        <input
                                            type="text"
                                            value={block.title || ""}
                                            onChange={(e) =>
                                                updateBlock(block.id, (b) => ({ ...b, title: e.target.value }))
                                            }
                                            placeholder="عنوان الكتلة..."
                                            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                        />
                                    </div>

                                    {/* Reading Passage */}
                                    {block.type === "reading_passage" && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">نوع النص</label>
                                                <select
                                                    value={(block as ReadingBlock).genre}
                                                    onChange={(e) =>
                                                        updateBlock(block.id, (b) => ({
                                                            ...b,
                                                            genre: e.target.value as "Scientific" | "Literary",
                                                        }))
                                                    }
                                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                                >
                                                    <option value="Scientific">علمي</option>
                                                    <option value="Literary">أدبي</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">نص القراءة</label>
                                                <textarea
                                                    rows={6}
                                                    value={(block as ReadingBlock).bodyText}
                                                    onChange={(e) =>
                                                        updateBlock(block.id, (b) => ({ ...b, bodyText: e.target.value }))
                                                    }
                                                    placeholder="أدخل نص القراءة هنا..."
                                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Poetry */}
                                    {block.type === "poetry_text" && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">عنوان القصيدة</label>
                                                    <input
                                                        type="text"
                                                        value={(block as PoetryBlock).poemTitle || ""}
                                                        onChange={(e) =>
                                                            updateBlock(block.id, (b) => ({ ...b, poemTitle: e.target.value }))
                                                        }
                                                        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">الشاعر</label>
                                                    <input
                                                        type="text"
                                                        value={(block as PoetryBlock).poet || ""}
                                                        onChange={(e) =>
                                                            updateBlock(block.id, (b) => ({ ...b, poet: e.target.value }))
                                                        }
                                                        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">الأبيات</label>
                                                {(block as PoetryBlock).verses.map((verse, vIdx) => (
                                                    <div key={vIdx} className="grid grid-cols-2 gap-2 mt-2">
                                                        <input
                                                            type="text"
                                                            value={verse.shatrA}
                                                            onChange={(e) => {
                                                                const newVerses = [...(block as PoetryBlock).verses];
                                                                newVerses[vIdx] = { ...newVerses[vIdx], shatrA: e.target.value };
                                                                updateBlock(block.id, (b) => ({ ...b, verses: newVerses }));
                                                            }}
                                                            placeholder="الشطر الأول"
                                                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={verse.shatrB}
                                                            onChange={(e) => {
                                                                const newVerses = [...(block as PoetryBlock).verses];
                                                                newVerses[vIdx] = { ...newVerses[vIdx], shatrB: e.target.value };
                                                                updateBlock(block.id, (b) => ({ ...b, verses: newVerses }));
                                                            }}
                                                            placeholder="الشطر الثاني"
                                                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                                        />
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        const newVerses = [...(block as PoetryBlock).verses, { shatrA: "", shatrB: "" }];
                                                        updateBlock(block.id, (b) => ({ ...b, verses: newVerses }));
                                                    }}
                                                    className="mt-2 text-sm text-primary-600 hover:underline"
                                                >
                                                    + إضافة بيت
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grammar */}
                                    {block.type === "grammar_block" && (
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">النص السياقي</label>
                                            <textarea
                                                rows={4}
                                                value={(block as GrammarBlock).contextText || ""}
                                                onChange={(e) =>
                                                    updateBlock(block.id, (b) => ({ ...b, contextText: e.target.value }))
                                                }
                                                placeholder="النص الذي سيتم الاستخراج منه..."
                                                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] resize-none"
                                            />
                                        </div>
                                    )}

                                    {/* Expression */}
                                    {block.type === "expression_block" && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">نوع التعبير</label>
                                                <select
                                                    value={(block as ExpressionBlock).variant}
                                                    onChange={(e) =>
                                                        updateBlock(block.id, (b) => ({
                                                            ...b,
                                                            variant: e.target.value as "functional" | "creative",
                                                        }))
                                                    }
                                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                                >
                                                    <option value="functional">وظيفي</option>
                                                    <option value="creative">إبداعي</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">المطلوب</label>
                                                <textarea
                                                    rows={3}
                                                    value={(block as ExpressionBlock).prompt}
                                                    onChange={(e) =>
                                                        updateBlock(block.id, (b) => ({ ...b, prompt: e.target.value }))
                                                    }
                                                    placeholder="اكتب المطلوب من الطالب..."
                                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Questions */}
                                    <div className="border-t border-gray-200 dark:border-[#2e2e3a] pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                الأسئلة ({block.questions.length})
                                            </h4>
                                            <div className="flex gap-2">
                                                {(Object.keys(questionTypeLabels) as ArabicQuestionType[]).map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => addQuestion(block.id, type)}
                                                        className="px-2 py-1 text-xs rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                                                    >
                                                        + {questionTypeLabels[type]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {block.questions.map((q, qIdx) => (
                                                <div
                                                    key={q.id}
                                                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {qIdx + 1}. {questionTypeLabels[q.type]}
                                                        </span>
                                                        <button
                                                            onClick={() => removeQuestion(block.id, q.id)}
                                                            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {renderQuestionCard(block, q)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Error */}
            {submitError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-300">{submitError}</span>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    {examId ? "تحديث الامتحان" : "حفظ الامتحان"}
                </button>
            </div>

            {/* Success Notification */}
            <AnimatePresence>
                {successNotification.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-green-500 text-white shadow-lg"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">{successNotification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
