"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Save,
    X,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    Plus,
    HelpCircle,
    Lightbulb,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface QuestionOption {
    text?: string;
    textAr?: string;
    textEn?: string;
    isCorrect: boolean;
}

interface QuestionData {
    id: string;
    lesson_id: string;
    stage_id?: string;
    subject_id?: string;
    section_title?: { ar?: string; en?: string } | null;
    text: { ar?: string; en?: string };
    type: string;
    options: QuestionOption[];
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    order_index: number;
    hint?: { ar?: string; en?: string };
    explanation?: { ar?: string; en?: string };
}

type Lang = 'ar' | 'en';

const t = {
    ar: {
        pageTitle: 'تعديل السؤال',
        subtitle: 'تعديل بيانات السؤال',
        cancel: 'إلغاء',
        save: 'حفظ التعديلات',
        sectionTitle: 'عنوان القسم',
        sectionPlaceholder: 'مثال: اختر الإجابة الصحيحة...',
        questionText: 'نص السؤال',
        questionPlaceholder: 'اكتب نص السؤال هنا...',
        options: 'الخيارات',
        addOption: 'إضافة خيار',
        option: 'خيار',
        selectCorrect: 'اختر الإجابة الصحيحة بالنقر على الدائرة',
        settings: 'الإعدادات',
        difficulty: 'مستوى الصعوبة',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        points: 'النقاط',
        hintExplanation: 'التلميح والشرح',
        hint: 'التلميح (اختياري)',
        hintPlaceholder: 'أضف تلميحاً للطالب...',
        explanation: 'شرح الإجابة (اختياري)',
        explanationPlaceholder: 'اشرح لماذا هذه الإجابة صحيحة...',
        success: 'تم حفظ التعديلات بنجاح!',
        errorText: 'الرجاء كتابة نص السؤال',
        errorOptions: 'الرجاء ملء جميع الخيارات',
        errorCorrect: 'الرجاء تحديد الإجابة الصحيحة',
        errorLoad: 'حدث خطأ أثناء تحميل السؤال',
        errorNotFound: 'السؤال غير موجود',
        backToBank: 'العودة للدروس',
    },
    en: {
        pageTitle: 'Edit Question',
        subtitle: 'Edit question details',
        cancel: 'Cancel',
        save: 'Save Changes',
        sectionTitle: 'Section Title',
        sectionPlaceholder: 'Example: Choose the correct answer...',
        questionText: 'Question Text',
        questionPlaceholder: 'Write the question text here...',
        options: 'Options',
        addOption: 'Add Option',
        option: 'Option',
        selectCorrect: 'Select the correct answer by clicking the radio button',
        settings: 'Settings',
        difficulty: 'Difficulty Level',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        points: 'Points',
        hintExplanation: 'Hint & Explanation',
        hint: 'Hint (optional)',
        hintPlaceholder: 'Add a hint for the student...',
        explanation: 'Answer Explanation (optional)',
        explanationPlaceholder: 'Explain why this answer is correct...',
        success: 'Changes saved successfully!',
        errorText: 'Please write the question text',
        errorOptions: 'Please fill all options',
        errorCorrect: 'Please select the correct answer',
        errorLoad: 'Error loading question',
        errorNotFound: 'Question not found',
        backToBank: 'Back to Question Bank',
    },
};

const difficultyOptions = (lang: Lang) => [
    { value: 'easy', label: lang === 'ar' ? 'سهل' : 'Easy', color: 'bg-green-100 text-green-700 border-green-500' },
    { value: 'medium', label: lang === 'ar' ? 'متوسط' : 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-500' },
    { value: 'hard', label: lang === 'ar' ? 'صعب' : 'Hard', color: 'bg-red-100 text-red-700 border-red-500' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function EditQuestionPage() {
    const router = useRouter();
    const params = useParams();
    const questionId = params.id as string;

    // ─── Language ───
    const [lang, setLang] = useState<Lang>('ar');
    const labels = useMemo(() => t[lang], [lang]);
    const isRTL = lang === 'ar';

    // ─── State ───
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    // ─── Form State ───
    const [questionTextAr, setQuestionTextAr] = useState('');
    const [questionTextEn, setQuestionTextEn] = useState('');
    const [options, setOptions] = useState<{ textAr: string; textEn: string; isCorrect: boolean }[]>([]);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [points, setPoints] = useState(1);
    const [hintAr, setHintAr] = useState('');
    const [hintEn, setHintEn] = useState('');
    const [explanationAr, setExplanationAr] = useState('');
    const [explanationEn, setExplanationEn] = useState('');
    const [sectionTitleAr, setSectionTitleAr] = useState('');
    const [sectionTitleEn, setSectionTitleEn] = useState('');

    // ═══════════════════════════════════════════════════════════════════════
    // FETCH QUESTION
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!questionId) return;
        fetchQuestion();
    }, [questionId]);

    const fetchQuestion = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('lesson_questions')
                .select('*')
                .eq('id', questionId)
                .single();

            if (error) throw error;
            if (!data) throw new Error(labels.errorNotFound);

            const q = data as any;
            setQuestion(q);
            setQuestionTextAr(q.text?.ar || '');
            setQuestionTextEn(q.text?.en || '');
            setOptions((q.options || []).map((o: any) => ({
                textAr: o.textAr || o.text || '',
                textEn: o.textEn || '',
                isCorrect: o.isCorrect || false,
            })));
            setDifficulty(q.difficulty || 'medium');
            setPoints(q.points || 1);
            setHintAr(q.hint?.ar || '');
            setHintEn(q.hint?.en || '');
            setExplanationAr(q.explanation?.ar || '');
            setExplanationEn(q.explanation?.en || '');
            setSectionTitleAr(q.section_title?.ar || '');
            setSectionTitleEn(q.section_title?.en || '');
        } catch (err: any) {
            logger.error('Error fetching question', { context: 'EditQuestion', data: err });
            setError(err?.message || labels.errorLoad);
        } finally {
            setIsLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const updateOption = (index: number, field: 'textAr' | 'textEn' | 'isCorrect', value: string | boolean) => {
        setOptions(prev => {
            const updated = [...prev];
            if (field === 'isCorrect' && value === true) {
                updated.forEach((o, i) => { o.isCorrect = i === index; });
            } else {
                updated[index] = { ...updated[index], [field]: value };
            }
            return updated;
        });
    };

    const addOption = () => {
        if (options.length >= 8) return;
        setOptions([...options, { textAr: '', textEn: '', isCorrect: false }]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        const textToCheck = lang === 'ar' ? questionTextAr : questionTextEn;
        if (!questionTextAr.trim() && !questionTextEn.trim()) {
            setError(labels.errorText);
            return;
        }
        if (options.some(o => !(o.textAr || o.textEn).trim())) {
            setError(labels.errorOptions);
            return;
        }
        if (!options.some(o => o.isCorrect)) {
            setError(labels.errorCorrect);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const correctIndex = options.findIndex(o => o.isCorrect);
            const { error: updateError } = await supabase
                .from('lesson_questions')
                .update({
                    text: { ar: questionTextAr.trim(), en: questionTextEn.trim() },
                    options: options.map(o => ({
                        text: o.textAr || o.textEn,
                        textAr: o.textAr,
                        textEn: o.textEn,
                        isCorrect: o.isCorrect
                    })),
                    correct_option_id: String(correctIndex),
                    correct_answer: { value: correctIndex },
                    difficulty,
                    points,
                    hint: { ar: hintAr.trim(), en: hintEn.trim() },
                    explanation: { ar: explanationAr.trim(), en: explanationEn.trim() },
                    section_title: (sectionTitleAr.trim() || sectionTitleEn.trim())
                        ? { ar: sectionTitleAr.trim(), en: sectionTitleEn.trim() }
                        : null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', questionId);

            if (updateError) throw updateError;

            setSuccessMessage(labels.success);
            setTimeout(() => {
                router.push('/admin/lessons');
            }, 1500);
        } catch (err: any) {
            logger.error('Error saving question', { context: 'EditQuestion', data: err });
            setError(err?.message || 'Error saving');
        } finally {
            setIsSaving(false);
        }
    };

    const getOptionText = (o: { textAr: string; textEn: string }) => lang === 'ar' ? (o.textAr || o.textEn) : (o.textEn || o.textAr);
    const setOptionText = (index: number, value: string) => updateOption(index, lang === 'ar' ? 'textAr' : 'textEn', value);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error && !question) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-red-500 font-medium mb-4">{error}</p>
                <button
                    onClick={() => router.push('/admin/lessons')}
                    className="text-indigo-600 hover:underline"
                >
                    {labels.backToBank}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between sticky top-0 z-20 bg-gray-50/90 dark:bg-[#13131a]/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-200 dark:border-gray-800"
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/lessons')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{labels.pageTitle}</h1>
                        <p className="text-sm text-gray-500">{labels.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button
                            onClick={() => setLang('ar')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${lang === 'ar' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            العربية
                        </button>
                        <button
                            onClick={() => setLang('en')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            English
                        </button>
                    </div>

                    <button
                        onClick={() => router.push('/admin/lessons')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] hover:bg-gray-50 text-sm font-medium"
                    >
                        <X className="h-4 w-4" />
                        {labels.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-70 text-sm font-semibold"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {labels.save}
                    </button>
                </div>
            </motion.div>

            {/* Notifications */}
            {error && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 flex items-center gap-3 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium flex-1">{error}</span>
                    <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                </motion.div>
            )}

            {successMessage && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 flex items-center gap-3 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">{successMessage}</span>
                </motion.div>
            )}

            {/* Form */}
            <div className="space-y-6">
                {/* Section Title */}
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{labels.sectionTitle}</h2>
                    <input
                        type="text"
                        value={lang === 'ar' ? sectionTitleAr : sectionTitleEn}
                        onChange={(e) => lang === 'ar' ? setSectionTitleAr(e.target.value) : setSectionTitleEn(e.target.value)}
                        placeholder={labels.sectionPlaceholder}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                    />
                </div>

                {/* Question Text */}
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-indigo-500" />
                        {labels.questionText}
                    </h2>
                    <textarea
                        value={lang === 'ar' ? questionTextAr : questionTextEn}
                        onChange={(e) => lang === 'ar' ? setQuestionTextAr(e.target.value) : setQuestionTextEn(e.target.value)}
                        placeholder={labels.questionPlaceholder}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 resize-none text-lg"
                    />
                </div>

                {/* Options */}
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{labels.options}</h2>
                        <button
                            onClick={addOption}
                            disabled={options.length >= 8}
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
                        >
                            <Plus className="h-4 w-4" />
                            {labels.addOption}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    checked={option.isCorrect}
                                    onChange={() => updateOption(index, 'isCorrect', true)}
                                    className="h-5 w-5 text-indigo-600"
                                    name="correct-answer"
                                />
                                <input
                                    type="text"
                                    value={getOptionText(option)}
                                    onChange={(e) => setOptionText(index, e.target.value)}
                                    placeholder={`${labels.option} ${index + 1}`}
                                    className={`flex-1 px-4 py-2.5 rounded-xl border transition-colors ${option.isCorrect
                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                                        }`}
                                />
                                {option.isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                {options.length > 2 && (
                                    <button
                                        onClick={() => removeOption(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{labels.selectCorrect}</p>
                </div>

                {/* Settings */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{labels.settings}</h2>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                {labels.difficulty}
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDifficulty('easy')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${difficulty === 'easy'
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                        }`}
                                >
                                    {labels.easy}
                                </button>
                                <button
                                    onClick={() => setDifficulty('medium')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${difficulty === 'medium'
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                            : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                                        }`}
                                >
                                    {labels.medium}
                                </button>
                                <button
                                    onClick={() => setDifficulty('hard')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${difficulty === 'hard'
                                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                        }`}
                                >
                                    {labels.hard}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                {labels.points}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={points}
                                    onChange={(e) => setPoints(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-center focus:ring-2 focus:ring-blue-400 text-lg"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-medium">pts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hint & Explanation */}
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        {labels.hintExplanation}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {labels.hint}
                            </label>
                            <input
                                type="text"
                                value={lang === 'ar' ? hintAr : hintEn}
                                onChange={(e) => lang === 'ar' ? setHintAr(e.target.value) : setHintEn(e.target.value)}
                                placeholder={labels.hintPlaceholder}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {labels.explanation}
                            </label>
                            <textarea
                                value={lang === 'ar' ? explanationAr : explanationEn}
                                onChange={(e) => lang === 'ar' ? setExplanationAr(e.target.value) : setExplanationEn(e.target.value)}
                                placeholder={labels.explanationPlaceholder}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
