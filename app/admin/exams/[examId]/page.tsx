"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    ArrowRight,
    Pencil,
    Trash2,
    Loader2,
    X,
    Save,
    HelpCircle,
    CheckCircle,
    XCircle,
    GripVertical,
    Copy,
    Globe,
    Image as ImageIcon,
    Lightbulb
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type {
    TemplateQuestion,
    LangText,
    QuestionType,
    AnswerOption,
    QuestionMedia,
    ExamTemplate
} from "@/lib/types/exam-templates";

// Helper function to get text from LangText
const getLangText = (text: LangText | null | undefined, lang: 'ar' | 'en' = 'ar'): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[lang] || text.ar || text.en || '';
};

// Default LangText
const defaultLangText: LangText = { ar: '', en: '' };

const questionTypeLabels: Record<QuestionType, string> = {
    mcq: "اختيار من متعدد",
    truefalse: "صح أم خطأ",
    essay: "مقالي",
    fill_blank: "أكمل الفراغ",
    matching: "توصيل"
};

const questionTypeColors: Record<QuestionType, string> = {
    mcq: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    truefalse: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    essay: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    fill_blank: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    matching: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
};

const difficultyLabels: Record<string, string> = {
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب"
};

const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    hard: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
};

export default function TemplateQuestionsPage() {
    const params = useParams();
    const templateId = params.examId as string;

    const [template, setTemplate] = useState<ExamTemplate | null>(null);
    const [questions, setQuestions] = useState<TemplateQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<TemplateQuestion> | null>(null);
    const [options, setOptions] = useState<AnswerOption[]>([
        { id: "a", text: defaultLangText },
        { id: "b", text: defaultLangText },
        { id: "c", text: defaultLangText },
        { id: "d", text: defaultLangText }
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeInputLang, setActiveInputLang] = useState<'ar' | 'en'>('ar');

    // Fetch Data
    const fetchData = async () => {
        try {
            setIsLoading(true);

            // Fetch Template
            const { data: templateData } = await supabase
                .from("exam_templates")
                .select("*")
                .eq("id", templateId)
                .single();

            setTemplate(templateData as unknown as ExamTemplate);

            // Fetch Questions
            const { data: questionsData, error } = await supabase
                .from("template_questions")
                .select("*")
                .eq("template_id", templateId)
                .order("order_index", { ascending: true });

            if (error) throw error;
            setQuestions((questionsData || []) as unknown as TemplateQuestion[]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (templateId) fetchData();
    }, [templateId]);

    // Handle Save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const textAr = getLangText(currentQuestion?.text, 'ar');
        const textEn = getLangText(currentQuestion?.text, 'en');
        if (!textAr && !textEn) return;

        try {
            setIsSaving(true);

            // Filter valid options
            const validOptions = currentQuestion?.type === 'mcq'
                ? options.filter(o => getLangText(o.text, 'ar') || getLangText(o.text, 'en'))
                : [];

            const questionData = {
                template_id: templateId,
                text: currentQuestion?.text || defaultLangText,
                type: currentQuestion?.type || 'mcq',
                options: validOptions,
                correct_option_id: currentQuestion?.type === 'mcq' || currentQuestion?.type === 'truefalse'
                    ? currentQuestion?.correct_option_id
                    : null,
                correct_answer: currentQuestion?.correct_answer || null,
                points: currentQuestion?.points || 1,
                order_index: currentQuestion?.order_index ?? questions.length,
                media: currentQuestion?.media || {},
                hint: currentQuestion?.hint || defaultLangText,
                explanation: currentQuestion?.explanation || defaultLangText,
                updated_at: new Date().toISOString()
            };

            if (currentQuestion?.id) {
                const { error } = await supabase
                    .from("template_questions")
                    .update(questionData as any)
                    .eq("id", currentQuestion.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("template_questions")
                    .insert([questionData as any]);

                if (error) throw error;
            }

            // Update questions count in template
            await updateQuestionsCount();

            setIsModalOpen(false);
            setCurrentQuestion(null);
            resetOptions();
            fetchData();
        } catch (error) {
            console.error("Error saving question:", error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setIsSaving(false);
        }
    };

    // Update questions count
    const updateQuestionsCount = async () => {
        const { count } = await supabase
            .from("template_questions")
            .select("*", { count: "exact", head: true })
            .eq("template_id", templateId);

        const { data: pointsData } = await supabase
            .from("template_questions")
            .select("points")
            .eq("template_id", templateId);

        const totalPoints = (pointsData || []).reduce((sum, q) => sum + (q.points || 1), 0);

        await supabase
            .from("exam_templates")
            .update({
                questions_count: count || 0,
                total_points: totalPoints,
                updated_at: new Date().toISOString()
            })
            .eq("id", templateId);
    };

    // Handle Delete
    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;

        try {
            const { error } = await supabase
                .from("template_questions")
                .delete()
                .eq("id", id);

            if (error) throw error;
            await updateQuestionsCount();
            fetchData();
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    // Duplicate Question
    const duplicateQuestion = async (question: TemplateQuestion) => {
        try {
            const newText: LangText = {
                ar: question.text?.ar ? `${question.text.ar} (نسخة)` : '',
                en: question.text?.en ? `${question.text.en} (Copy)` : ''
            };

            const { error } = await supabase
                .from("template_questions")
                .insert([{
                    template_id: templateId,
                    text: newText,
                    type: question.type,
                    options: question.options,
                    correct_option_id: question.correct_option_id,
                    correct_answer: question.correct_answer,
                    points: question.points,
                    order_index: questions.length,
                    media: question.media,
                    hint: question.hint,
                    explanation: question.explanation
                } as any]);

            if (error) throw error;
            await updateQuestionsCount();
            fetchData();
        } catch (error) {
            console.error("Error duplicating question:", error);
        }
    };

    // Reset Options
    const resetOptions = () => {
        setOptions([
            { id: "a", text: defaultLangText },
            { id: "b", text: defaultLangText },
            { id: "c", text: defaultLangText },
            { id: "d", text: defaultLangText }
        ]);
    };

    // Open Edit Modal
    const openEditModal = (question: TemplateQuestion) => {
        setCurrentQuestion(question);
        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
            setOptions(question.options as AnswerOption[]);
        } else {
            resetOptions();
        }
        setActiveInputLang(template?.language === 'en' ? 'en' : 'ar');
        setIsModalOpen(true);
    };

    // Open New Modal
    const openNewModal = () => {
        setCurrentQuestion({
            type: 'mcq',
            text: defaultLangText,
            points: 1,
            difficulty: 'medium',
            hint: defaultLangText,
            explanation: defaultLangText,
            media: {}
        });
        resetOptions();
        setActiveInputLang(template?.language === 'en' ? 'en' : 'ar');
        setIsModalOpen(true);
    };

    // Update question text
    const updateQuestionText = (lang: 'ar' | 'en', value: string) => {
        setCurrentQuestion(prev => ({
            ...prev,
            text: {
                ...defaultLangText,
                ...prev?.text,
                [lang]: value
            }
        }));
    };

    // Update option text
    const updateOptionText = (optionId: string, lang: 'ar' | 'en', value: string) => {
        setOptions(prev => prev.map(opt =>
            opt.id === optionId
                ? { ...opt, text: { ...defaultLangText, ...opt.text, [lang]: value } }
                : opt
        ));
    };

    // Update hint
    const updateHint = (lang: 'ar' | 'en', value: string) => {
        setCurrentQuestion(prev => ({
            ...prev,
            hint: {
                ...defaultLangText,
                ...prev?.hint,
                [lang]: value
            }
        }));
    };

    // Update explanation
    const updateExplanation = (lang: 'ar' | 'en', value: string) => {
        setCurrentQuestion(prev => ({
            ...prev,
            explanation: {
                ...defaultLangText,
                ...prev?.explanation,
                [lang]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    const templateTitle = getLangText(template?.title as LangText, 'ar') || getLangText(template?.title as LangText, 'en');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/exams"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            أسئلة القالب
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {templateTitle} • {questions.length} سؤال
                        </p>
                    </div>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors shadow-lg shadow-primary-500/25"
                >
                    <Plus className="h-5 w-5" />
                    <span>إضافة سؤال</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200/60 dark:border-gray-800">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{questions.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الأسئلة</p>
                </div>
                <div className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200/60 dark:border-gray-800">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي النقاط</p>
                </div>
                <div className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200/60 dark:border-gray-800">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {template?.duration_minutes || 0} د
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">مدة الامتحان</p>
                </div>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <HelpCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        لا توجد أسئلة
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                        ابدأ بإضافة أسئلة لهذا القالب
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {questions.map((question, index) => (
                            <motion.div
                                key={question.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="group bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200/60 dark:border-gray-800 p-4 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Drag Handle & Number */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Question Text */}
                                        <div className="mb-2">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {getLangText(question.text, 'ar')}
                                            </p>
                                            {question.text?.en && question.text?.ar && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" dir="ltr">
                                                    {question.text.en}
                                                </p>
                                            )}
                                        </div>

                                        {/* Options Preview (for MCQ) */}
                                        {question.type === 'mcq' && question.options && question.options.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {(question.options as AnswerOption[]).map((opt) => (
                                                    <div
                                                        key={opt.id}
                                                        className={`text-sm px-3 py-1.5 rounded-lg ${opt.id === question.correct_option_id
                                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                            }`}
                                                    >
                                                        <span className="font-medium ml-1">{opt.id.toUpperCase()}.</span>
                                                        {getLangText(opt.text, 'ar') || getLangText(opt.text, 'en')}
                                                        {opt.id === question.correct_option_id && (
                                                            <CheckCircle className="inline h-3.5 w-3.5 mr-1" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* True/False Preview */}
                                        {question.type === 'truefalse' && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                الإجابة: <span className="font-medium">
                                                    {question.correct_option_id === 'true' ? 'صح ✓' : 'خطأ ✗'}
                                                </span>
                                            </p>
                                        )}

                                        {/* Meta */}
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className={`px-2 py-0.5 rounded ${questionTypeColors[question.type]}`}>
                                                {questionTypeLabels[question.type]}
                                            </span>
                                            {question.difficulty && (
                                                <span className={`px-2 py-0.5 rounded ${difficultyColors[question.difficulty]}`}>
                                                    {difficultyLabels[question.difficulty]}
                                                </span>
                                            )}
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {question.points} نقطة
                                            </span>
                                            {question.hint?.ar || question.hint?.en ? (
                                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                    <Lightbulb className="h-3 w-3" />
                                                    تلميح
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(question)}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => duplicateQuestion(question)}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(question.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white dark:bg-[#1c1c24] rounded-2xl shadow-xl overflow-hidden my-8"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                    {currentQuestion?.id ? "تعديل السؤال" : "إضافة سؤال جديد"}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Language Toggle */}
                                {template?.language === 'multi' && (
                                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setActiveInputLang('ar')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeInputLang === 'ar'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            العربية
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveInputLang('en')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeInputLang === 'en'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            English
                                        </button>
                                    </div>
                                )}

                                {/* Question Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        نوع السؤال
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {(['mcq', 'truefalse', 'fill_blank', 'essay'] as QuestionType[]).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setCurrentQuestion(prev => ({ ...prev, type }))}
                                                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${currentQuestion?.type === type
                                                    ? "bg-primary-500 text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    }`}
                                            >
                                                {questionTypeLabels[type]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        نص السؤال {activeInputLang === 'ar' ? '(عربي)' : '(English)'} *
                                    </label>
                                    <textarea
                                        required={activeInputLang === (template?.language === 'en' ? 'en' : 'ar')}
                                        value={getLangText(currentQuestion?.text, activeInputLang)}
                                        onChange={(e) => updateQuestionText(activeInputLang, e.target.value)}
                                        rows={3}
                                        dir={activeInputLang === 'ar' ? 'rtl' : 'ltr'}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                        placeholder={activeInputLang === 'ar' ? "اكتب السؤال هنا..." : "Enter question here..."}
                                    />
                                </div>

                                {/* Options (for MCQ) */}
                                {currentQuestion?.type === 'mcq' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الخيارات
                                        </label>
                                        <div className="space-y-2">
                                            {options.map((option) => (
                                                <div key={option.id} className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentQuestion(prev => ({ ...prev, correct_option_id: option.id }))}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${currentQuestion?.correct_option_id === option.id
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                            }`}
                                                    >
                                                        {option.id.toUpperCase()}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={getLangText(option.text, activeInputLang)}
                                                        onChange={(e) => updateOptionText(option.id, activeInputLang, e.target.value)}
                                                        dir={activeInputLang === 'ar' ? 'rtl' : 'ltr'}
                                                        className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                        placeholder={activeInputLang === 'ar' ? `الخيار ${option.id.toUpperCase()}` : `Option ${option.id.toUpperCase()}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            اضغط على الحرف لتحديد الإجابة الصحيحة
                                        </p>
                                    </div>
                                )}

                                {/* True/False Answer */}
                                {currentQuestion?.type === 'truefalse' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الإجابة الصحيحة
                                        </label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentQuestion(prev => ({ ...prev, correct_option_id: 'true' }))}
                                                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${currentQuestion?.correct_option_id === 'true'
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                                صح
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentQuestion(prev => ({ ...prev, correct_option_id: 'false' }))}
                                                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${currentQuestion?.correct_option_id === 'false'
                                                    ? "bg-red-500 text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            >
                                                <XCircle className="h-5 w-5" />
                                                خطأ
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Fill Blank / Essay Answer */}
                                {(currentQuestion?.type === 'fill_blank' || currentQuestion?.type === 'essay') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            الإجابة الصحيحة {currentQuestion?.type === 'essay' ? '(نموذجية)' : ''} *
                                        </label>
                                        <input
                                            type="text"
                                            value={currentQuestion?.correct_answer || ""}
                                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                            placeholder={currentQuestion?.type === 'essay' ? "الإجابة النموذجية" : "الكلمة أو العبارة الصحيحة"}
                                        />
                                    </div>
                                )}

                                {/* Hint */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        تلميح (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        value={getLangText(currentQuestion?.hint, activeInputLang)}
                                        onChange={(e) => updateHint(activeInputLang, e.target.value)}
                                        dir={activeInputLang === 'ar' ? 'rtl' : 'ltr'}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        placeholder={activeInputLang === 'ar' ? "تلميح للمساعدة..." : "Hint to help..."}
                                    />
                                </div>

                                {/* Explanation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        شرح الإجابة (اختياري)
                                    </label>
                                    <textarea
                                        value={getLangText(currentQuestion?.explanation, activeInputLang)}
                                        onChange={(e) => updateExplanation(activeInputLang, e.target.value)}
                                        rows={2}
                                        dir={activeInputLang === 'ar' ? 'rtl' : 'ltr'}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                        placeholder={activeInputLang === 'ar' ? "شرح الإجابة الصحيحة..." : "Explanation of the correct answer..."}
                                    />
                                </div>

                                {/* Difficulty & Points */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            مستوى الصعوبة
                                        </label>
                                        <div className="flex gap-2">
                                            {Object.entries(difficultyLabels).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setCurrentQuestion(prev => ({ ...prev, difficulty: key as 'easy' | 'medium' | 'hard' }))}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentQuestion?.difficulty === key
                                                        ? difficultyColors[key]
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            النقاط
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={currentQuestion?.points || 1}
                                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        <span>حفظ</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
