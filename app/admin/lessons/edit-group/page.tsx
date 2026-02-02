"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    Layers,
    ChevronDown,
    ChevronUp,
    Copy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface QuestionOption {
    text: string;
    isCorrect: boolean;
}

interface QuestionItem {
    id: string;
    text: string;
    options: QuestionOption[];
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    hint: string;
    explanation: string;
    order_index: number;
    isNew?: boolean;
    isDeleted?: boolean;
}

const difficultyOptions = [
    { value: 'easy', label: 'سهل', color: 'bg-green-100 text-green-700 border-green-500' },
    { value: 'medium', label: 'متوسط', color: 'bg-yellow-100 text-yellow-700 border-yellow-500' },
    { value: 'hard', label: 'صعب', color: 'bg-red-100 text-red-700 border-red-500' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function EditGroupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupId = searchParams.get('groupId') || '';
    const lessonId = searchParams.get('lesson') || '';

    // ─── State ───
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    // ─── Form State ───
    const [sectionTitle, setSectionTitle] = useState('');
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const [originalGroupId, setOriginalGroupId] = useState('');

    // ─── Media Content State (Reading/Poetry) ───
    const [contentType, setContentType] = useState<'none' | 'reading' | 'poetry'>('none');
    const [readingTitle, setReadingTitle] = useState('');
    const [readingText, setReadingText] = useState('');
    const [poetryTitle, setPoetryTitle] = useState('');
    const [poetryVerses, setPoetryVerses] = useState<{ first: string; second: string }[]>([]);

    // ═══════════════════════════════════════════════════════════════════════
    // FETCH QUESTIONS
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => {
        if (!groupId) return;
        fetchQuestions();
    }, [groupId, lessonId]);

    const fetchQuestions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('lesson_questions')
                .select('*')
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (lessonId) {
                query = query.eq('lesson_id', lessonId);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Filter by group_id or fallback to section_title + created_at
            const filtered = (data || []).filter((q: any) => {
                const qGroupKey = q.group_id || `${q.section_title?.ar || 'بدون عنوان'}_${q.created_at?.split('T')[0] || 'unknown'}`;
                return qGroupKey === groupId;
            });

            if (filtered.length > 0) {
                const firstQ = filtered[0] as any;
                setSectionTitle(firstQ.section_title?.ar || '');
                setOriginalGroupId(firstQ.group_id || groupId);

                // Load media content (reading/poetry)
                const media = firstQ.media?.content;
                if (media) {
                    if (media.type === 'reading') {
                        setContentType('reading');
                        setReadingTitle(media.title || '');
                        setReadingText(media.text || '');
                    } else if (media.type === 'poetry') {
                        setContentType('poetry');
                        setPoetryTitle(media.title || '');
                        setPoetryVerses(media.verses || []);
                    }
                }
            }

            const items: QuestionItem[] = filtered.map((q: any) => ({
                id: q.id,
                text: q.text?.ar || '',
                options: q.options || [],
                difficulty: q.difficulty || 'medium',
                points: q.points || 1,
                hint: q.hint?.ar || '',
                explanation: q.explanation?.ar || '',
                order_index: q.order_index || 0,
            }));

            setQuestions(items);
        } catch (err: any) {
            logger.error('Error fetching questions', { context: 'EditGroup', data: err });
            setError(err?.message || 'حدث خطأ أثناء تحميل الأسئلة');
        } finally {
            setIsLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addQuestion = () => {
        const newQ: QuestionItem = {
            id: `new-${Date.now()}`,
            text: '',
            options: [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
            ],
            difficulty: 'medium',
            points: 1,
            hint: '',
            explanation: '',
            order_index: questions.length,
            isNew: true,
        };
        setQuestions([...questions, newQ]);
        setExpandedQuestionId(newQ.id);
    };

    const duplicateQuestion = (id: string) => {
        const qToDuplicate = questions.find(q => q.id === id);
        if (!qToDuplicate) return;
        const newQ: QuestionItem = {
            ...qToDuplicate,
            id: `new-${Date.now()}`,
            order_index: questions.length,
            isNew: true,
        };
        const index = questions.findIndex(q => q.id === id);
        const updated = [...questions];
        updated.splice(index + 1, 0, newQ);
        setQuestions(updated);
    };

    const removeQuestion = (id: string) => {
        if (id.startsWith('new-')) {
            setQuestions(questions.filter(q => q.id !== id));
        } else {
            setQuestions(questions.map(q =>
                q.id === id ? { ...q, isDeleted: true } : q
            ));
        }
    };

    const updateQuestion = (id: string, field: keyof QuestionItem, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const updateOption = (questionId: string, optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
        setQuestions(questions.map(q => {
            if (q.id !== questionId) return q;
            const updatedOptions = [...q.options];
            if (field === 'isCorrect' && value === true) {
                updatedOptions.forEach((o, i) => { o.isCorrect = i === optionIndex; });
            } else {
                updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
            }
            return { ...q, options: updatedOptions };
        }));
    };

    const addOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== questionId || q.options.length >= 8) return q;
            return { ...q, options: [...q.options, { text: '', isCorrect: false }] };
        }));
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id !== questionId || q.options.length <= 2) return q;
            return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
        }));
    };

    const handleSave = async () => {
        // Validation
        if (!sectionTitle.trim()) {
            setError('الرجاء كتابة عنوان القسم');
            return;
        }

        const activeQuestions = questions.filter(q => !q.isDeleted);
        for (let i = 0; i < activeQuestions.length; i++) {
            const q = activeQuestions[i];
            if (!q.text.trim()) {
                setError(`السؤال ${i + 1}: الرجاء كتابة نص السؤال`);
                setExpandedQuestionId(q.id);
                return;
            }
            if (q.options.some(o => !o.text.trim())) {
                setError(`السؤال ${i + 1}: الرجاء ملء جميع الخيارات`);
                setExpandedQuestionId(q.id);
                return;
            }
            if (!q.options.some(o => o.isCorrect)) {
                setError(`السؤال ${i + 1}: الرجاء تحديد الإجابة الصحيحة`);
                setExpandedQuestionId(q.id);
                return;
            }
        }

        setIsSaving(true);
        setError(null);

        try {
            // Prepare media content
            let mediaContent = null;
            if (contentType === 'reading' && (readingTitle.trim() || readingText.trim())) {
                mediaContent = { content: { type: 'reading', title: readingTitle.trim(), text: readingText.trim() } };
            } else if (contentType === 'poetry' && (poetryTitle.trim() || poetryVerses.length > 0)) {
                mediaContent = {
                    content: {
                        type: 'poetry',
                        title: poetryTitle.trim(),
                        verses: poetryVerses.filter(v => v.first.trim() || v.second.trim())
                    }
                };
            }

            // 1. Delete removed questions
            const deletedIds = questions.filter(q => q.isDeleted && !q.isNew).map(q => q.id);
            if (deletedIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('lesson_questions')
                    .delete()
                    .in('id', deletedIds);
                if (deleteError) throw deleteError;
            }

            // 2. Update existing questions
            const existingQuestions = activeQuestions.filter(q => !q.isNew);
            for (const q of existingQuestions) {
                const correctIndex = q.options.findIndex(o => o.isCorrect);
                const { error: updateError } = await supabase
                    .from('lesson_questions')
                    .update({
                        text: { ar: q.text.trim(), en: '' },
                        options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
                        correct_option_id: String(correctIndex),
                        correct_answer: { value: correctIndex },
                        difficulty: q.difficulty,
                        points: q.points,
                        order_index: q.order_index,
                        hint: q.hint.trim() ? { ar: q.hint.trim(), en: '' } : { ar: '', en: '' },
                        explanation: q.explanation.trim() ? { ar: q.explanation.trim(), en: '' } : { ar: '', en: '' },
                        section_title: { ar: sectionTitle.trim(), en: '' },
                        media: mediaContent,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', q.id);
                if (updateError) throw updateError;
            }

            // 3. Insert new questions
            const newQuestions = activeQuestions.filter(q => q.isNew);
            if (newQuestions.length > 0) {
                const payloads = newQuestions.map((q, i) => {
                    const correctIndex = q.options.findIndex(o => o.isCorrect);
                    return {
                        lesson_id: lessonId,
                        group_id: originalGroupId || groupId,
                        text: { ar: q.text.trim(), en: '' },
                        type: 'mcq',
                        options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
                        correct_option_id: String(correctIndex),
                        correct_answer: { value: correctIndex },
                        difficulty: q.difficulty,
                        points: q.points,
                        order_index: existingQuestions.length + i,
                        hint: q.hint.trim() ? { ar: q.hint.trim(), en: '' } : { ar: '', en: '' },
                        explanation: q.explanation.trim() ? { ar: q.explanation.trim(), en: '' } : { ar: '', en: '' },
                        section_title: { ar: sectionTitle.trim(), en: '' },
                        media: mediaContent,
                        is_active: true,
                    };
                });

                const { error: insertError } = await supabase
                    .from('lesson_questions')
                    .insert(payloads);
                if (insertError) throw insertError;
            }

            setSuccessMessage('تم حفظ التعديلات بنجاح!');
            setTimeout(() => {
                router.push('/admin/lessons');
            }, 1500);
        } catch (err: any) {
            logger.error('Error saving group', { context: 'EditGroup', data: err });
            setError(err?.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    const activeQuestions = questions.filter(q => !q.isDeleted);

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

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20" dir="rtl">
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
                        <ArrowRight className="h-5 w-5" />
                    </button>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                        <Layers className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">تعديل مجموعة الأسئلة</h1>
                        <p className="text-sm text-gray-500">{activeQuestions.length} سؤال</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push('/admin/lessons')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                        <X className="h-4 w-4" />
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transition-all disabled:opacity-70 text-sm font-semibold"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        حفظ التعديلات
                    </button>
                </div>
            </motion.div>

            {/* Notifications */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-600"
                >
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">{error}</span>
                </motion.div>
            )}

            {successMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3 text-green-600"
                >
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">{successMessage}</span>
                </motion.div>
            )}

            {/* Section Title */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">عنوان القسم</h2>
                <input
                    type="text"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    placeholder="مثال: اختر الإجابة الصحيحة..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                />
            </div>

            {/* Reading/Poetry Content */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    📖 محتوى إضافي (اختياري)
                </h2>

                {/* Content Type Selector */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setContentType('none')}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${contentType === 'none'
                                ? 'bg-gray-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                    >
                        بدون محتوى
                    </button>
                    <button
                        onClick={() => setContentType('reading')}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${contentType === 'reading'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                    >
                        📖 نص قراءة
                    </button>
                    <button
                        onClick={() => setContentType('poetry')}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${contentType === 'poetry'
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                            }`}
                    >
                        🎭 شعر
                    </button>
                </div>

                {/* Reading Content */}
                {contentType === 'reading' && (
                    <div className="space-y-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div>
                            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">عنوان النص (اختياري)</label>
                            <input
                                type="text"
                                value={readingTitle}
                                onChange={(e) => setReadingTitle(e.target.value)}
                                placeholder="مثال: قصة الأسد والفأر..."
                                className="w-full px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">نص القراءة</label>
                            <textarea
                                value={readingText}
                                onChange={(e) => setReadingText(e.target.value)}
                                placeholder="اكتب نص القراءة هنا..."
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                            />
                        </div>
                    </div>
                )}

                {/* Poetry Content */}
                {contentType === 'poetry' && (
                    <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div>
                            <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">عنوان القصيدة (اختياري)</label>
                            <input
                                type="text"
                                value={poetryTitle}
                                onChange={(e) => setPoetryTitle(e.target.value)}
                                placeholder="مثال: قصيدة في حب الوطن..."
                                className="w-full px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-amber-700 dark:text-amber-400">أبيات الشعر</label>
                                <button
                                    onClick={() => setPoetryVerses([...poetryVerses, { first: '', second: '' }])}
                                    className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    <Plus className="h-4 w-4" /> إضافة بيت
                                </button>
                            </div>
                            <div className="space-y-2">
                                {poetryVerses.map((verse, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="text-amber-500 text-sm font-bold w-6">{index + 1}</span>
                                        <input
                                            type="text"
                                            value={verse.first}
                                            onChange={(e) => {
                                                const updated = [...poetryVerses];
                                                updated[index] = { ...updated[index], first: e.target.value };
                                                setPoetryVerses(updated);
                                            }}
                                            placeholder="الشطر الأول..."
                                            className="flex-1 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-center"
                                        />
                                        <span className="text-amber-400">⋯</span>
                                        <input
                                            type="text"
                                            value={verse.second}
                                            onChange={(e) => {
                                                const updated = [...poetryVerses];
                                                updated[index] = { ...updated[index], second: e.target.value };
                                                setPoetryVerses(updated);
                                            }}
                                            placeholder="الشطر الثاني..."
                                            className="flex-1 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-center"
                                        />
                                        {poetryVerses.length > 1 && (
                                            <button
                                                onClick={() => setPoetryVerses(poetryVerses.filter((_, i) => i !== index))}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {poetryVerses.length === 0 && (
                                    <button
                                        onClick={() => setPoetryVerses([{ first: '', second: '' }])}
                                        className="w-full py-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                    >
                                        <Plus className="h-4 w-4 inline ml-2" /> أضف أول بيت
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Questions List */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-indigo-500" />
                        الأسئلة ({activeQuestions.length})
                    </h2>
                    <button
                        onClick={addQuestion}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        إضافة سؤال
                    </button>
                </div>

                <div className="space-y-4">
                    {activeQuestions.map((question, index) => (
                        <motion.div
                            key={question.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                        >
                            {/* Question Header */}
                            <div
                                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${expandedQuestionId === question.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                onClick={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                                        {index + 1}
                                    </span>
                                    <p className="text-gray-900 dark:text-white font-medium line-clamp-1">
                                        {question.text || 'سؤال جديد...'}
                                    </p>
                                    {question.isNew && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">جديد</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); duplicateQuestion(question.id); }}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                                        title="نسخ"
                                    >
                                        <Copy className="h-4 w-4 text-gray-500" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeQuestion(question.id); }}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                        title="حذف"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </button>
                                    {expandedQuestionId === question.id ? (
                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Question Content */}
                            <AnimatePresence>
                                {expandedQuestionId === question.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="p-4 space-y-4">
                                            {/* Question Text */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    نص السؤال
                                                </label>
                                                <textarea
                                                    value={question.text}
                                                    onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                                    placeholder="اكتب نص السؤال هنا..."
                                                    rows={2}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 resize-none"
                                                />
                                            </div>

                                            {/* Options */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الخيارات</label>
                                                    <button
                                                        onClick={() => addOption(question.id)}
                                                        disabled={question.options.length >= 8}
                                                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        إضافة خيار
                                                    </button>
                                                </div>

                                                {question.options.map((option, optIndex) => (
                                                    <div key={optIndex} className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            checked={option.isCorrect}
                                                            onChange={() => updateOption(question.id, optIndex, 'isCorrect', true)}
                                                            className="h-5 w-5 text-indigo-600"
                                                            name={`correct-${question.id}`}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={option.text}
                                                            onChange={(e) => updateOption(question.id, optIndex, 'text', e.target.value)}
                                                            placeholder={`خيار ${optIndex + 1}`}
                                                            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${option.isCorrect
                                                                ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                                                                }`}
                                                        />
                                                        {question.options.length > 2 && (
                                                            <button
                                                                onClick={() => removeOption(question.id, optIndex)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Settings Row */}
                                            <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                            الصعوبة
                                                        </label>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => updateQuestion(question.id, 'difficulty', 'easy')}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${question.difficulty === 'easy'
                                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                                                    }`}
                                                            >
                                                                سهل
                                                            </button>
                                                            <button
                                                                onClick={() => updateQuestion(question.id, 'difficulty', 'medium')}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${question.difficulty === 'medium'
                                                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                                                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                                                                    }`}
                                                            >
                                                                متوسط
                                                            </button>
                                                            <button
                                                                onClick={() => updateQuestion(question.id, 'difficulty', 'hard')}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${question.difficulty === 'hard'
                                                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                                                    }`}
                                                            >
                                                                صعب
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                            النقاط
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={100}
                                                                value={question.points}
                                                                onChange={(e) => updateQuestion(question.id, 'points', Number(e.target.value))}
                                                                className="w-full px-4 py-2 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-center focus:ring-2 focus:ring-blue-400"
                                                            />
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-xs font-medium">pts</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hint & Explanation */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                            <Lightbulb className="h-3 w-3 text-yellow-500" />
                                                            التلميح
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={question.hint}
                                                            onChange={(e) => updateQuestion(question.id, 'hint', e.target.value)}
                                                            placeholder="أضف تلميحاً..."
                                                            className="w-full px-4 py-2 rounded-lg border-2 border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 placeholder:text-yellow-300 focus:ring-2 focus:ring-yellow-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                                                            الشرح
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={question.explanation}
                                                            onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                                                            placeholder="اشرح الإجابة..."
                                                            className="w-full px-4 py-2 rounded-lg border-2 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 placeholder:text-violet-300 focus:ring-2 focus:ring-violet-400"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Add Question Button */}
                <button
                    onClick={addQuestion}
                    className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                >
                    <Plus className="h-5 w-5" />
                    إضافة سؤال جديد
                </button>
            </div>
        </div>
    );
}
