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
    Copy
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Question = Database["public"]["Tables"]["questions"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];

interface QuestionOption {
    id: string;
    text: string;
}

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

const questionTypeLabels: Record<string, string> = {
    multiple_choice: "اختيار من متعدد",
    true_false: "صح أم خطأ",
    fill_blank: "أكمل الفراغ"
};

export default function LessonQuestionsPage() {
    const params = useParams();
    const lessonId = params.lessonId as string;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [options, setOptions] = useState<QuestionOption[]>([
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        try {
            setIsLoading(true);

            // Fetch Lesson
            const { data: lessonData } = await supabase
                .from("lessons")
                .select("*")
                .eq("id", lessonId)
                .single();
            setLesson(lessonData);

            // Fetch Questions
            const { data: questionsData, error } = await supabase
                .from("questions")
                .select("*")
                .eq("lesson_id", lessonId)
                .order("order_index", { ascending: true });

            if (error) throw error;
            setQuestions(questionsData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (lessonId) fetchData();
    }, [lessonId]);

    // Handle Save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentQuestion?.question_text || !currentQuestion?.correct_answer) return;

        try {
            setIsSaving(true);

            const questionData = {
                lesson_id: lessonId,
                exam_id: null as string | null,
                question_text: currentQuestion.question_text,
                question_type: currentQuestion.question_type || 'multiple_choice',
                options: currentQuestion.question_type === 'multiple_choice' ? options.filter(o => o.text.trim()) : null,
                correct_answer: currentQuestion.correct_answer,
                explanation: currentQuestion.explanation,
                points: currentQuestion.points || 1,
                difficulty: currentQuestion.difficulty || 'medium',
                order_index: currentQuestion.order_index ?? questions.length,
                is_active: currentQuestion.is_active ?? true
            };

            if (currentQuestion.id) {
                const { error } = await supabase
                    .from("questions")
                    .update(questionData as any)
                    .eq("id", currentQuestion.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("questions")
                    .insert([questionData as any]);

                if (error) throw error;
            }

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

    // Handle Delete
    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;

        try {
            const { error } = await supabase
                .from("questions")
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    // Duplicate Question
    const duplicateQuestion = async (question: Question) => {
        try {
            const { error } = await supabase
                .from("questions")
                .insert([{
                    ...question,
                    id: undefined,
                    question_text: `${question.question_text} (نسخة)`,
                    order_index: questions.length
                } as any]);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error("Error duplicating question:", error);
        }
    };

    // Reset Options
    const resetOptions = () => {
        setOptions([
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" }
        ]);
    };

    // Open Edit Modal
    const openEditModal = (question: Question) => {
        setCurrentQuestion(question);
        if (question.options && Array.isArray(question.options)) {
            setOptions(question.options as unknown as QuestionOption[]);
        } else {
            resetOptions();
        }
        setIsModalOpen(true);
    };

    // Open New Modal
    const openNewModal = () => {
        setCurrentQuestion({
            question_type: 'multiple_choice',
            difficulty: 'medium',
            points: 1,
            is_active: true
        });
        resetOptions();
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/lessons"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            أسئلة الدرس
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {lesson?.title} • {questions.length} سؤال
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
                        ابدأ بإضافة أسئلة لهذا الدرس
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
                                    <div className="flex items-center gap-2 pt-1">
                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                                            {question.question_text}
                                        </p>

                                        {question.question_type === 'multiple_choice' && question.options && (
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {(question.options as unknown as QuestionOption[]).map((opt) => (
                                                    <div
                                                        key={opt.id}
                                                        className={`text-sm px-3 py-1.5 rounded-lg ${opt.id === question.correct_answer
                                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                            }`}
                                                    >
                                                        <span className="font-medium ml-1">{opt.id.toUpperCase()}.</span>
                                                        {opt.text}
                                                        {opt.id === question.correct_answer && (
                                                            <CheckCircle className="inline h-3.5 w-3.5 mr-1" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {question.question_type === 'true_false' && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                الإجابة: <span className="font-medium">{question.correct_answer === 'true' ? 'صح ✓' : 'خطأ ✗'}</span>
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs">
                                            <span className={`px-2 py-0.5 rounded ${difficultyColors[question.difficulty]}`}>
                                                {difficultyLabels[question.difficulty]}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {questionTypeLabels[question.question_type]}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {question.points} نقطة
                                            </span>
                                        </div>
                                    </div>

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

            {/* Modal - Same as Exam Questions */}
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
                                {/* Question Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        نوع السؤال
                                    </label>
                                    <div className="flex gap-2">
                                        {Object.entries(questionTypeLabels).map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setCurrentQuestion(prev => ({ ...prev, question_type: key as any }))}
                                                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${currentQuestion?.question_type === key
                                                    ? "bg-primary-500 text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        نص السؤال *
                                    </label>
                                    <textarea
                                        required
                                        value={currentQuestion?.question_text || ""}
                                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                        placeholder="اكتب السؤال هنا..."
                                    />
                                </div>

                                {/* Options (for multiple choice) */}
                                {currentQuestion?.question_type === 'multiple_choice' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الخيارات
                                        </label>
                                        <div className="space-y-2">
                                            {options.map((option, idx) => (
                                                <div key={option.id} className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentQuestion(prev => ({ ...prev, correct_answer: option.id }))}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${currentQuestion?.correct_answer === option.id
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                            }`}
                                                    >
                                                        {option.id.toUpperCase()}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={option.text}
                                                        onChange={(e) => {
                                                            const newOptions = [...options];
                                                            newOptions[idx].text = e.target.value;
                                                            setOptions(newOptions);
                                                        }}
                                                        className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                        placeholder={`الخيار ${option.id.toUpperCase()}`}
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
                                {currentQuestion?.question_type === 'true_false' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الإجابة الصحيحة
                                        </label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentQuestion(prev => ({ ...prev, correct_answer: 'true' }))}
                                                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${currentQuestion?.correct_answer === 'true'
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                                صح
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentQuestion(prev => ({ ...prev, correct_answer: 'false' }))}
                                                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${currentQuestion?.correct_answer === 'false'
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

                                {/* Fill Blank Answer */}
                                {currentQuestion?.question_type === 'fill_blank' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            الإجابة الصحيحة *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={currentQuestion?.correct_answer || ""}
                                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                            placeholder="الكلمة أو العبارة الصحيحة"
                                        />
                                    </div>
                                )}

                                {/* Explanation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        شرح الإجابة (اختياري)
                                    </label>
                                    <textarea
                                        value={currentQuestion?.explanation || ""}
                                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                                        rows={2}
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                        placeholder="شرح الإجابة الصحيحة..."
                                    />
                                </div>

                                {/* Difficulty & Points */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            الصعوبة
                                        </label>
                                        <select
                                            value={currentQuestion?.difficulty || "medium"}
                                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, difficulty: e.target.value as any }))}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        >
                                            {Object.entries(difficultyLabels).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
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
