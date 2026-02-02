"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save,
    X,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    Plus,
    BookOpen,
    FileText,
    Feather,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Edit3,
    Type,
    List,
    MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ContentType = 'none' | 'reading' | 'poetry';
type QuestionType = 'mcq' | 'essay' | 'truefalse' | 'parsing' | 'fill_blank' | 'extraction';

interface QuestionOption {
    id: string;
    text: string;
    textAr: string;
    textEn: string;
    isCorrect: boolean;
}

interface QuestionItem {
    id: string;
    type: QuestionType;
    section_title?: { ar: string; en: string };
    text: { ar: string; en: string };
    options: QuestionOption[];
    correct_option_id?: string;
    difficulty: string;
    points: number;
    order_index: number;
    hint?: { ar: string; en: string };
    explanation?: { ar: string; en: string };
    is_active: boolean;
    metadata?: any;
}

interface PoetryVerse {
    first: string;
    second: string;
}

interface QuestionBankData {
    id: string;
    lesson_id: string;
    stage_id: string | null;
    subject_id: string | null;
    title: { ar: string; en: string } | null;
    description: { ar: string; en: string } | null;
    content_type: string | null;
    content_data: any | null;
    questions: QuestionItem[] | null;
    total_questions: number | null;
    total_points: number | null;
    is_active: boolean | null;
    // Relations
    lessons?: { id: string; title: string } | null;
    educational_stages?: { id: string; name: string; slug: string } | null;
    subjects?: { id: string; name: string; slug: string } | null;
}

// Section type for grouping
interface QuestionSection {
    sectionTitle: { ar: string; en: string };
    questions: QuestionItem[];
}

const difficultyConfig = {
    easy: { label: "سهل", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    medium: { label: "متوسط", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    hard: { label: "صعب", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
};

const typeLabels: Record<string, string> = {
    'mcq': 'اختيار من متعدد',
    'truefalse': 'صح/خطأ',
    'essay': 'مقالي',
    'fill_blank': 'ملء فراغات',
    'parsing': 'إعراب',
    'extraction': 'استخراج',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function EditQuestionBankPage() {
    const router = useRouter();
    const params = useParams();
    const bankId = params.id as string;

    // ─── State ───
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [bank, setBank] = useState<QuestionBankData | null>(null);

    // Content State
    const [contentType, setContentType] = useState<ContentType>('none');
    const [readingTitle, setReadingTitle] = useState('');
    const [readingText, setReadingText] = useState('');
    const [poetryTitle, setPoetryTitle] = useState('');
    const [poetryVerses, setPoetryVerses] = useState<PoetryVerse[]>([{ first: '', second: '' }]);

    // Questions State (grouped by sections)
    const [sections, setSections] = useState<QuestionSection[]>([]);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'section' | 'question'; sectionIndex: number; questionIndex?: number } | null>(null);

    // ─── Load Data ───
    useEffect(() => {
        const loadBank = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('question_banks')
                    .select('*, lessons(id, title), educational_stages(id, name, slug), subjects(id, name, slug)')
                    .eq('id', bankId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error('الدرس غير موجود');

                setBank(data as any);

                // Load content
                const ct = (data.content_type as ContentType) || 'none';
                setContentType(ct);
                if (ct === 'reading' && data.content_data) {
                    const cd = data.content_data as any;
                    setReadingTitle(cd.title || '');
                    setReadingText(cd.text || '');
                } else if (ct === 'poetry' && data.content_data) {
                    const cd = data.content_data as any;
                    setPoetryTitle(cd.title || '');
                    setPoetryVerses(cd.verses?.map((v: any) => ({
                        first: v.first || v.firstLine || '',
                        second: v.second || v.secondLine || ''
                    })) || [{ first: '', second: '' }]);
                }

                // Group questions by section_title
                const questions = (data.questions as unknown as QuestionItem[]) || [];
                const sectionMap = new Map<string, QuestionItem[]>();

                questions.forEach(q => {
                    const sectionKey = q.section_title?.ar || 'أسئلة عامة';
                    if (!sectionMap.has(sectionKey)) {
                        sectionMap.set(sectionKey, []);
                    }
                    sectionMap.get(sectionKey)!.push(q);
                });

                const loadedSections: QuestionSection[] = [];
                sectionMap.forEach((qs, title) => {
                    loadedSections.push({
                        sectionTitle: { ar: title, en: qs[0]?.section_title?.en || '' },
                        questions: qs.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    });
                });

                setSections(loadedSections.length > 0 ? loadedSections : []);

            } catch (err: any) {
                logger.error('Error loading question bank', { context: 'EditQuestionBank', data: err });
                setError(err?.message || 'حدث خطأ أثناء تحميل الدرس');
            } finally {
                setIsLoading(false);
            }
        };

        if (bankId) {
            loadBank();
        }
    }, [bankId]);

    // ─── Section Handlers ───
    const toggleSection = (index: number) => {
        const updated = new Set(expandedSections);
        if (updated.has(index)) {
            updated.delete(index);
        } else {
            updated.add(index);
        }
        setExpandedSections(updated);
    };

    const addSection = () => {
        setSections(prev => [...prev, {
            sectionTitle: { ar: 'قسم جديد', en: 'New Section' },
            questions: []
        }]);
        setExpandedSections(prev => new Set([...prev, sections.length]));
    };

    const updateSectionTitle = (index: number, lang: 'ar' | 'en', value: string) => {
        setSections(prev => prev.map((s, i) =>
            i === index ? { ...s, sectionTitle: { ...s.sectionTitle, [lang]: value } } : s
        ));
    };

    const deleteSection = (index: number) => {
        setSections(prev => prev.filter((_, i) => i !== index));
        setDeleteConfirm(null);
    };

    // ─── Question Handlers ───
    const addQuestion = (sectionIndex: number, type: QuestionType = 'mcq') => {
        const newQuestion: QuestionItem = {
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            text: { ar: '', en: '' },
            options: type === 'mcq' ? [
                { id: 'opt-0', text: '', textAr: '', textEn: '', isCorrect: true },
                { id: 'opt-1', text: '', textAr: '', textEn: '', isCorrect: false },
                { id: 'opt-2', text: '', textAr: '', textEn: '', isCorrect: false },
                { id: 'opt-3', text: '', textAr: '', textEn: '', isCorrect: false },
            ] : type === 'truefalse' ? [
                { id: 'true', text: 'صح', textAr: 'صح', textEn: 'True', isCorrect: true },
                { id: 'false', text: 'غلط', textAr: 'غلط', textEn: 'False', isCorrect: false },
            ] : [],
            difficulty: 'easy',
            points: 1,
            order_index: sections[sectionIndex]?.questions.length || 0,
            is_active: true,
        };

        setSections(prev => prev.map((s, i) =>
            i === sectionIndex ? { ...s, questions: [...s.questions, newQuestion] } : s
        ));
    };

    const updateQuestion = (sectionIndex: number, questionIndex: number, field: string, value: any) => {
        setSections(prev => prev.map((s, sIdx) => {
            if (sIdx !== sectionIndex) return s;
            return {
                ...s,
                questions: s.questions.map((q, qIdx) => {
                    if (qIdx !== questionIndex) return q;
                    if (field.includes('.')) {
                        const [parent, child] = field.split('.');
                        return { ...q, [parent]: { ...(q as any)[parent], [child]: value } };
                    }
                    return { ...q, [field]: value };
                })
            };
        }));
    };

    const updateOption = (sectionIndex: number, questionIndex: number, optIndex: number, field: string, value: any) => {
        setSections(prev => prev.map((s, sIdx) => {
            if (sIdx !== sectionIndex) return s;
            return {
                ...s,
                questions: s.questions.map((q, qIdx) => {
                    if (qIdx !== questionIndex) return q;
                    const newOptions = [...q.options];
                    if (field === 'isCorrect' && value === true) {
                        newOptions.forEach((opt, i) => { opt.isCorrect = i === optIndex; });
                    } else {
                        newOptions[optIndex] = { ...newOptions[optIndex], [field]: value };
                    }
                    return { ...q, options: newOptions };
                })
            };
        }));
    };

    const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
        setSections(prev => prev.map((s, sIdx) =>
            sIdx === sectionIndex ? { ...s, questions: s.questions.filter((_, qIdx) => qIdx !== questionIndex) } : s
        ));
        setDeleteConfirm(null);
    };

    // ─── Poetry Handlers ───
    const addVerse = () => setPoetryVerses(prev => [...prev, { first: '', second: '' }]);
    const updateVerse = (index: number, field: 'first' | 'second', value: string) => {
        setPoetryVerses(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
    };
    const removeVerse = (index: number) => setPoetryVerses(prev => prev.filter((_, i) => i !== index));

    // ─── Save Handler ───
    const handleSave = async () => {
        if (!bank) return;

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            // Build content data
            let contentData = null;
            if (contentType === 'reading') {
                contentData = { type: 'reading', title: readingTitle.trim(), text: readingText.trim() };
            } else if (contentType === 'poetry') {
                contentData = {
                    type: 'poetry',
                    title: poetryTitle.trim(),
                    verses: poetryVerses.filter(v => v.first.trim() || v.second.trim())
                };
            }

            // Build questions array
            const allQuestions: QuestionItem[] = [];
            let orderIndex = 0;
            sections.forEach(section => {
                section.questions.forEach(q => {
                    allQuestions.push({
                        ...q,
                        section_title: section.sectionTitle,
                        order_index: orderIndex++,
                    });
                });
            });

            const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

            // Get title from first section or existing
            const bankTitle = sections[0]?.sectionTitle?.ar
                ? { ar: sections[0].sectionTitle.ar, en: sections[0].sectionTitle.en || '' }
                : bank.title;

            const { error: updateError } = await supabase
                .from('question_banks')
                .update({
                    title: bankTitle as any,
                    content_type: contentType,
                    content_data: contentData as any,
                    questions: allQuestions as any,
                    total_questions: allQuestions.length,
                    total_points: totalPoints,
                } as any)
                .eq('id', bankId);

            if (updateError) throw updateError;

            setSuccess('تم حفظ التغييرات بنجاح');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            logger.error('Error saving question bank', { context: 'EditQuestionBank', data: err });
            setError(err?.message || 'حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Render ───
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>جاري تحميل الدرس...</span>
                </div>
            </div>
        );
    }

    if (error && !bank) {
        return (
            <div className="max-w-2xl mx-auto py-10" dir="rtl">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">حدث خطأ</h2>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <Link href="/admin/lessons" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <ArrowLeft className="h-4 w-4" />
                        العودة للقائمة
                    </Link>
                </div>
            </div>
        );
    }

    const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const totalPoints = sections.reduce((sum, s) => sum + s.questions.reduce((qs, q) => qs + (q.points || 0), 0), 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20" dir="rtl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 p-6 text-white"
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <Edit3 className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">تعديل الدرس</h1>
                            <div className="flex flex-wrap items-center gap-2 text-white/70 text-sm mt-1">
                                <span>{totalQuestions} سؤال</span>
                                <span>•</span>
                                <span>{totalPoints} نقطة</span>
                                {bank?.educational_stages?.name && (
                                    <>
                                        <span>•</span>
                                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">🎓 {bank.educational_stages.name}</span>
                                    </>
                                )}
                                {bank?.subjects?.name && (
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">📚 {bank.subjects.name}</span>
                                )}
                                {bank?.lessons?.title && (
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">📖 {bank.lessons.title}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/lessons" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm">
                            <ArrowLeft className="h-4 w-4" />
                            العودة
                        </Link>
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-medium text-sm disabled:opacity-50">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600">
                        <AlertTriangle className="h-5 w-5" />{error}
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600">
                        <CheckCircle2 className="h-5 w-5" />{success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Type Selection */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    نوع المحتوى
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { type: 'none' as ContentType, label: 'بدون نص', icon: Type, color: 'gray' },
                        { type: 'reading' as ContentType, label: 'نص قراءة', icon: BookOpen, color: 'emerald' },
                        { type: 'poetry' as ContentType, label: 'شعر', icon: Feather, color: 'amber' },
                    ].map(({ type, label, icon: Icon, color }) => (
                        <button
                            key={type}
                            onClick={() => setContentType(type)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${contentType === type
                                ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon className={`h-6 w-6 ${contentType === type ? `text-${color}-600` : 'text-gray-400'}`} />
                            <span className={contentType === type ? `text-${color}-700 font-medium` : 'text-gray-600'}>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Reading Content */}
                {contentType === 'reading' && (
                    <div className="space-y-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div>
                            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">عنوان النص</label>
                            <input
                                type="text"
                                value={readingTitle}
                                onChange={(e) => setReadingTitle(e.target.value)}
                                placeholder="أدخل عنوان نص القراءة"
                                className="w-full px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">محتوى النص</label>
                            <textarea
                                value={readingText}
                                onChange={(e) => setReadingText(e.target.value)}
                                placeholder="أدخل نص القراءة هنا..."
                                rows={6}
                                className="w-full px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800"
                            />
                        </div>
                    </div>
                )}

                {/* Poetry Content */}
                {contentType === 'poetry' && (
                    <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div>
                            <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">عنوان القصيدة</label>
                            <input
                                type="text"
                                value={poetryTitle}
                                onChange={(e) => setPoetryTitle(e.target.value)}
                                placeholder="أدخل عنوان القصيدة"
                                className="w-full px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">الأبيات</label>
                            <div className="space-y-2">
                                {poetryVerses.map((verse, vIdx) => (
                                    <div key={vIdx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={verse.first}
                                            onChange={(e) => updateVerse(vIdx, 'first', e.target.value)}
                                            placeholder="الشطر الأول"
                                            className="flex-1 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-center"
                                        />
                                        <span className="text-amber-400">⋯</span>
                                        <input
                                            type="text"
                                            value={verse.second}
                                            onChange={(e) => updateVerse(vIdx, 'second', e.target.value)}
                                            placeholder="الشطر الثاني"
                                            className="flex-1 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-center"
                                        />
                                        {poetryVerses.length > 1 && (
                                            <button onClick={() => removeVerse(vIdx)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg">
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={addVerse} className="mt-2 flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-100 rounded-lg text-sm">
                                <Plus className="h-4 w-4" />
                                إضافة بيت
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sections & Questions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <List className="h-5 w-5" />
                        الأقسام والأسئلة ({sections.length} قسم)
                    </h2>
                    <button onClick={addSection} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                        <Plus className="h-4 w-4" />
                        إضافة قسم
                    </button>
                </div>

                {sections.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <p className="text-gray-500 mb-4">لا توجد أقسام - أضف قسم للبدء</p>
                        <button onClick={addSection} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
                            <Plus className="h-4 w-4 inline ml-2" />
                            إضافة قسم جديد
                        </button>
                    </div>
                ) : (
                    sections.map((section, sIdx) => (
                        <motion.div key={sIdx} layout className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden">
                            {/* Section Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#252530] border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 flex-1">
                                    <button onClick={() => toggleSection(sIdx)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                                        {expandedSections.has(sIdx) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </button>
                                    <input
                                        type="text"
                                        value={section.sectionTitle.ar}
                                        onChange={(e) => updateSectionTitle(sIdx, 'ar', e.target.value)}
                                        placeholder="عنوان القسم"
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-medium"
                                    />
                                    <span className="text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                        {section.questions.length} سؤال
                                    </span>
                                </div>
                                <button
                                    onClick={() => setDeleteConfirm({ type: 'section', sectionIndex: sIdx })}
                                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg mr-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Delete Section Confirm */}
                            {deleteConfirm?.type === 'section' && deleteConfirm.sectionIndex === sIdx && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-red-700">حذف هذا القسم وجميع أسئلته ({section.questions.length} سؤال)؟</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-gray-200 rounded text-sm">إلغاء</button>
                                            <button onClick={() => deleteSection(sIdx)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">حذف</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section Content */}
                            <AnimatePresence>
                                {expandedSections.has(sIdx) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 space-y-4">
                                        {/* Questions */}
                                        {section.questions.map((q, qIdx) => (
                                            <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {qIdx + 1}
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        {/* Question Text */}
                                                        <textarea
                                                            value={q.text?.ar || ''}
                                                            onChange={(e) => updateQuestion(sIdx, qIdx, 'text.ar', e.target.value)}
                                                            placeholder="نص السؤال"
                                                            rows={2}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900"
                                                        />

                                                        {/* Options */}
                                                        {(q.type === 'mcq' || q.type === 'truefalse') && q.options && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {q.options.map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex items-center gap-2">
                                                                        <input
                                                                            type="radio"
                                                                            name={`correct-${q.id}`}
                                                                            checked={opt.isCorrect}
                                                                            onChange={() => updateOption(sIdx, qIdx, optIdx, 'isCorrect', true)}
                                                                            className="h-4 w-4"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={opt.textAr || opt.text || ''}
                                                                            onChange={(e) => {
                                                                                updateOption(sIdx, qIdx, optIdx, 'textAr', e.target.value);
                                                                                updateOption(sIdx, qIdx, optIdx, 'text', e.target.value);
                                                                            }}
                                                                            placeholder={`خيار ${optIdx + 1}`}
                                                                            className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${opt.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900'}`}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Meta Row */}
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <select
                                                                value={q.difficulty}
                                                                onChange={(e) => updateQuestion(sIdx, qIdx, 'difficulty', e.target.value)}
                                                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                                                            >
                                                                <option value="easy">سهل</option>
                                                                <option value="medium">متوسط</option>
                                                                <option value="hard">صعب</option>
                                                            </select>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-500">النقاط:</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={q.points}
                                                                    onChange={(e) => updateQuestion(sIdx, qIdx, 'points', parseInt(e.target.value) || 1)}
                                                                    className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-center"
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                                {typeLabels[q.type] || q.type}
                                                            </span>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ type: 'question', sectionIndex: sIdx, questionIndex: qIdx })}
                                                                className="mr-auto p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        {/* Delete Question Confirm */}
                                                        {deleteConfirm?.type === 'question' && deleteConfirm.sectionIndex === sIdx && deleteConfirm.questionIndex === qIdx && (
                                                            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                                <span className="text-red-700 text-sm">حذف هذا السؤال؟</span>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 rounded text-xs">إلغاء</button>
                                                                    <button onClick={() => deleteQuestion(sIdx, qIdx)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">حذف</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Question Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <button onClick={() => addQuestion(sIdx, 'mcq')} className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                                                <Plus className="h-4 w-4" />
                                                اختيار متعدد
                                            </button>
                                            <button onClick={() => addQuestion(sIdx, 'truefalse')} className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 rounded-lg text-sm hover:bg-purple-200">
                                                <Plus className="h-4 w-4" />
                                                صح/غلط
                                            </button>
                                            <button onClick={() => addQuestion(sIdx, 'essay')} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200">
                                                <Plus className="h-4 w-4" />
                                                مقالي
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Save Button (Bottom) */}
            <div className="sticky bottom-4">
                <button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50 shadow-lg">
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    حفظ جميع التغييرات
                </button>
            </div>
        </div>
    );
}
