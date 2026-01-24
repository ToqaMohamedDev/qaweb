"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save, X, Loader2, Trash2, Plus,
    FileText, Feather, Layers, ChevronDown,
    ChevronUp, List, Clock, Target, Settings,
} from "lucide-react";
import { logger } from "@/lib/utils/logger";
import type { Json } from "@/lib/database.types";
import { useUIStore } from "@/lib/stores";
import { useAuth } from "@/hooks/useAuth";
import { useStagesAPI, useSubjectsAPI, useCreateExamAPI, useUpdateExamAPI } from "@/lib/queries/adminQueries";
import { LoadingSpinner } from "@/components/shared";
import { questionTypeLabels as sharedQuestionTypeLabels } from "@/lib/utils/questionUtils";

// Custom hook to fetch single exam via API
function useExamAPI(examId: string | null) {
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!examId) return;

        setIsLoading(true);
        fetch(`/api/admin/query?table=comprehensive_exams&filterColumn=id&filterValue=${examId}&limit=1`)
            .then(res => res.json())
            .then(result => {
                if (result.data && result.data.length > 0) {
                    setData(result.data[0]);
                }
            })
            .catch(err => console.error('Error fetching exam:', err))
            .finally(() => setIsLoading(false));
    }, [examId]);

    return { data, isLoading };
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ContentType = 'none' | 'reading' | 'poetry';
type QuestionType = 'mcq' | 'essay' | 'true_false' | 'parsing' | 'fill_blank' | 'extraction';
type Lang = 'ar' | 'en';

interface PoetryVerse {
    id: string;
    firstHalf: string;
    secondHalf: string;
}

interface QuestionOption {
    textAr: string;
    textEn: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    type: QuestionType;
    textAr: string;
    textEn: string;
    options: QuestionOption[];
    explanationAr: string;
    explanationEn: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    // For parsing questions - the word to be parsed
    underlinedWord?: string;
    // For fill_blank questions - text with blanks marked as ___
    blankTextAr?: string;
    blankTextEn?: string;
    // For fill_blank and extraction questions - correct answer
    correctAnswerAr?: string;
    correctAnswerEn?: string;
    // For extraction questions - what to extract (e.g., "فعل مضارع")
    extractionTarget?: string;
}

// قسم فرعي لنوع معين من الأسئلة
interface QuestionSubsection {
    id: string;
    title: string; // عنوان قابل للتعديل
    type: QuestionType; // نوع الأسئلة في هذا القسم الفرعي
    questions: Question[];
}

interface QuestionSection {
    id: string;
    titleAr: string;
    titleEn: string;
    contentType: ContentType;
    readingTitle: string;
    readingText: string;
    poetryTitle: string;
    poetryVerses: PoetryVerse[];
    subsections: QuestionSubsection[]; // أقسام فرعية بدلاً من أسئلة مباشرة
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const t = {
    ar: {
        pageTitle: 'إنشاء امتحان',
        editTitle: 'تعديل الامتحان',
        cancel: 'إلغاء',
        save: 'حفظ الامتحان',
        examSettings: 'إعدادات الامتحان',
        examTitle: 'عنوان الامتحان',
        examTitlePlaceholder: 'اكتب عنوان الامتحان...',
        duration: 'المدة (دقيقة)',
        totalScore: 'الدرجة الكلية',
        stage: 'المرحلة',
        subject: 'المادة',
        selectStage: 'اختر المرحلة...',
        selectSubject: 'اختر المادة...',
        sections: 'أقسام الامتحان',
        addSection: 'إضافة قسم',
        sectionTitle: 'عنوان القسم...',
        contentType: 'نوع المحتوى',
        noText: 'بدون نص',
        reading: 'نص قراءة',
        poetry: 'شعر',
        readingText: 'نص القراءة',
        textTitle: 'عنوان النص...',
        writeText: 'اكتب النص هنا...',
        poetrySection: 'الأبيات الشعرية',
        poemTitle: 'عنوان القصيدة...',
        addVerse: 'إضافة بيت',
        verse: 'بيت',
        firstHalf: 'الشطر الأول...',
        secondHalf: 'الشطر الثاني...',
        questions: 'الأسئلة',
        addQuestion: 'إضافة سؤال',
        mcq: 'اختيار متعدد',
        trueFalse: 'صح/خطأ',
        essay: 'مقالي',
        parsing: 'إعراب',
        fillBlank: 'أكمل',
        extraction: 'استخراج',
        parsingNote: 'أعرب ما تحته خط',
        parsingWord: 'الكلمة المراد إعرابها',
        parsingWordPlaceholder: 'اكتب الكلمة أو اختر من النص...',
        fillBlankNote: 'أكمل الفراغ التالي',
        fillBlankText: 'النص مع الفراغ',
        fillBlankPlaceholder: 'اكتب النص واستخدم ___ للفراغ...',
        correctAnswer: 'الإجابة الصحيحة',
        correctAnswerPlaceholder: 'اكتب الإجابة الصحيحة...',
        extractionNote: 'استخرج من النص',
        extractionTarget: 'المطلوب استخراجه',
        extractionTargetPlaceholder: 'مثال: فعل مضارع، اسم فاعل، خبر...',
        questionText: 'نص السؤال...',
        options: 'الخيارات',
        addOption: 'إضافة خيار',
        explanation: 'الشرح',
        explainAnswer: 'شرح الإجابة...',
        difficulty: 'الصعوبة',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        points: 'النقاط',
        successMessage: 'تم حفظ الامتحان بنجاح!',
        errorSaving: 'حدث خطأ أثناء الحفظ',
        writeExamTitle: 'الرجاء كتابة عنوان الامتحان',
        writeSectionTitle: 'الرجاء كتابة عنوان القسم',
    },
    en: {
        pageTitle: 'Create Exam',
        editTitle: 'Edit Exam',
        cancel: 'Cancel',
        save: 'Save Exam',
        examSettings: 'Exam Settings',
        examTitle: 'Exam Title',
        examTitlePlaceholder: 'Write exam title...',
        duration: 'Duration (min)',
        totalScore: 'Total Score',
        stage: 'Stage',
        subject: 'Subject',
        selectStage: 'Select stage...',
        selectSubject: 'Select subject...',
        sections: 'Exam Sections',
        addSection: 'Add Section',
        sectionTitle: 'Section title...',
        contentType: 'Content Type',
        noText: 'No Text',
        reading: 'Reading',
        poetry: 'Poetry',
        readingText: 'Reading Text',
        textTitle: 'Text title...',
        writeText: 'Write text here...',
        poetrySection: 'Poetry Lines',
        poemTitle: 'Poem title...',
        addVerse: 'Add Line',
        verse: 'Line',
        firstHalf: 'First half...',
        secondHalf: 'Second half...',
        questions: 'Questions',
        addQuestion: 'Add Question',
        mcq: 'Multiple Choice',
        trueFalse: 'True/False',
        essay: 'Essay',
        parsing: 'Parsing',
        fillBlank: 'Fill Blank',
        extraction: 'Extraction',
        parsingNote: 'Parse the underlined word',
        parsingWord: 'Word to parse',
        parsingWordPlaceholder: 'Write the word or select from text...',
        fillBlankNote: 'Complete the blank',
        fillBlankText: 'Text with blank',
        fillBlankPlaceholder: 'Write text and use ___ for blank...',
        correctAnswer: 'Correct Answer',
        correctAnswerPlaceholder: 'Write the correct answer...',
        extractionNote: 'Extract from text',
        extractionTarget: 'What to extract',
        extractionTargetPlaceholder: 'Example: present verb, subject noun...',
        questionText: 'Question text...',
        options: 'Options',
        addOption: 'Add Option',
        explanation: 'Explanation',
        explainAnswer: 'Explain the answer...',
        difficulty: 'Difficulty',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        points: 'Points',
        successMessage: 'Exam saved successfully!',
        errorSaving: 'Error saving exam',
        writeExamTitle: 'Please write exam title',
        writeSectionTitle: 'Please write section title',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const createEmptyQuestion = (type: QuestionType = 'mcq'): Question => ({
    id: `q-${createId()}`,
    type,
    textAr: '', textEn: '',
    options: type === 'mcq' ? [
        { textAr: '', textEn: '', isCorrect: true },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
    ] : type === 'true_false' ? [
        { textAr: 'صح', textEn: 'True', isCorrect: true },
        { textAr: 'خطأ', textEn: 'False', isCorrect: false },
    ] : [],
    explanationAr: '', explanationEn: '',
    difficulty: 'medium',
    points: 1,
    // New question type fields
    underlinedWord: '',
    blankTextAr: '', blankTextEn: '',
    correctAnswerAr: '', correctAnswerEn: '',
    extractionTarget: '',
});

const createEmptyVerse = (): PoetryVerse => ({ id: `v-${createId()}`, firstHalf: '', secondHalf: '' });

const subsectionTypeLabels = sharedQuestionTypeLabels;

const createEmptySubsection = (type: QuestionType): QuestionSubsection => ({
    id: `sub-${createId()}`,
    title: subsectionTypeLabels[type].ar, // عنوان افتراضي قابل للتعديل
    type,
    questions: [createEmptyQuestion(type)],
});

const createEmptySection = (): QuestionSection => ({
    id: `sec-${createId()}`,
    titleAr: '', titleEn: '',
    contentType: 'none',
    readingTitle: '', readingText: '',
    poetryTitle: '', poetryVerses: [createEmptyVerse(), createEmptyVerse()],
    subsections: [], // يبدأ بدون أقسام فرعية
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CreateExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = searchParams?.get("id") || null;
    const { addToast } = useUIStore();
    const { user, profile, isLoading: isAuthLoading } = useAuth();

    // Queries (API-based for Vercel compatibility)
    const { data: fetchedExam, isLoading: isExamLoading } = useExamAPI(examId);
    const { data: stages = [] } = useStagesAPI();
    const { data: subjects = [] } = useSubjectsAPI();

    // Mutations
    const createExamMutation = useCreateExamAPI();
    const updateExamMutation = useUpdateExamAPI();
    const isSaving = createExamMutation.isPending || updateExamMutation.isPending;

    // Language
    const [lang, setLang] = useState<Lang>('ar');
    const labels = useMemo(() => t[lang], [lang]);

    // Exam Settings
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examTitleAr, setExamTitleAr] = useState('');
    const [examTitleEn, setExamTitleEn] = useState('');
    const [duration, setDuration] = useState(60);
    const [totalScore, setTotalScore] = useState(100);

    // Advanced Settings
    const [gradingMode, setGradingMode] = useState<'auto' | 'manual'>('auto');
    const [usageScope, setUsageScope] = useState<'public' | 'private' | 'subscribers'>('public');
    const [branchTags, setBranchTags] = useState<string[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<'first' | 'second' | 'full_year'>('full_year');

    // Semester options
    const semesterOptions = [
        { value: 'first', label: 'الترم الأول', labelEn: 'First Semester' },
        { value: 'second', label: 'الترم الثاني', labelEn: 'Second Semester' },
        { value: 'full_year', label: 'سنة كاملة', labelEn: 'Full Year' },
    ];

    // Sections
    const [sections, setSections] = useState<QuestionSection[]>([createEmptySection()]);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const isRTL = lang === 'ar';

    // Populate Data when fetching existing exam
    useEffect(() => {
        if (fetchedExam) {
            setExamTitleAr(String(fetchedExam.exam_title || ''));
            setDuration(Number(fetchedExam.duration_minutes) || 60);
            setTotalScore(Number(fetchedExam.total_marks) || 100);

            if (fetchedExam.stage_id) setSelectedStage(String(fetchedExam.stage_id));
            if (fetchedExam.subject_id) setSelectedSubject(String(fetchedExam.subject_id));
            if (fetchedExam.semester) setSelectedSemester(fetchedExam.semester as 'first' | 'second' | 'full_year');

            // Set language based on exam type
            if (fetchedExam.language === 'english') setLang('en');
            else setLang('ar');

            // Load sections/descriptions
            const loadedSections = (fetchedExam.blocks || fetchedExam.sections || []) as unknown as QuestionSection[];
            if (Array.isArray(loadedSections) && loadedSections.length > 0) {
                setSections(loadedSections);
                if (loadedSections[0]?.id) {
                    setExpandedSections(new Set([loadedSections[0].id]));
                }
            }
        }
    }, [fetchedExam]);

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    const addSection = () => {
        const newSec = createEmptySection();
        setSections([...sections, newSec]);
        setExpandedSections(new Set([...expandedSections, newSec.id]));
    };

    const removeSection = (id: string) => {
        if (sections.length <= 1) return;
        setSections(sections.filter(s => s.id !== id));
    };

    const toggleSection = (id: string) => {
        const updated = new Set(expandedSections);
        if (updated.has(id)) updated.delete(id);
        else updated.add(id);
        setExpandedSections(updated);
    };

    const updateSection = (id: string, field: keyof QuestionSection, value: any) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // VERSE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    const addVerse = (sectionId: string) => {
        setSections(sections.map(s => s.id === sectionId
            ? { ...s, poetryVerses: [...s.poetryVerses, createEmptyVerse()] }
            : s
        ));
    };

    const removeVerse = (sectionId: string, verseId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId || s.poetryVerses.length <= 1) return s;
            return { ...s, poetryVerses: s.poetryVerses.filter(v => v.id !== verseId) };
        }));
    };

    const updateVerse = (sectionId: string, verseId: string, field: 'firstHalf' | 'secondHalf', value: string) => {
        setSections(sections.map(s => s.id === sectionId
            ? { ...s, poetryVerses: s.poetryVerses.map(v => v.id === verseId ? { ...v, [field]: value } : v) }
            : s
        ));
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // QUESTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    const addSubsection = (sectionId: string, type: QuestionType) => {
        setSections(sections.map(s => s.id === sectionId
            ? { ...s, subsections: [...s.subsections, createEmptySubsection(type)] }
            : s
        ));
    };

    const removeSubsection = (sectionId: string, subsectionId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, subsections: s.subsections.filter(sub => sub.id !== subsectionId) };
        }));
    };

    const updateSubsectionTitle = (sectionId: string, subsectionId: string, title: string) => {
        setSections(sections.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub =>
                    sub.id === subsectionId ? { ...sub, title } : sub
                )
            }
            : s
        ));
    };

    const addQuestion = (sectionId: string, subsectionId: string) => {
        setSections(sections.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub =>
                    sub.id === subsectionId
                        ? { ...sub, questions: [...sub.questions, createEmptyQuestion(sub.type)] }
                        : sub
                )
            }
            : s
        ));
    };

    const removeQuestion = (sectionId: string, subsectionId: string, questionId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s, subsections: s.subsections.map(sub => {
                    if (sub.id !== subsectionId || sub.questions.length <= 1) return sub;
                    return { ...sub, questions: sub.questions.filter(q => q.id !== questionId) };
                })
            };
        }));
    };

    const updateQuestion = (sectionId: string, subsectionId: string, questionId: string, field: keyof Question, value: any) => {
        setSections(sections.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
                    ? { ...sub, questions: sub.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q) }
                    : sub
                )
            }
            : s
        ));
    };

    const updateQuestionOption = (sectionId: string, subsectionId: string, questionId: string, optIdx: number, field: 'text' | 'isCorrect', value: any) => {
        const textField = lang === 'ar' ? 'textAr' : 'textEn';
        setSections(sections.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
                    ? {
                        ...sub, questions: sub.questions.map(q => {
                            if (q.id !== questionId) return q;
                            const opts = [...q.options];
                            if (field === 'isCorrect') opts.forEach((o, i) => { o.isCorrect = i === optIdx; });
                            else opts[optIdx] = { ...opts[optIdx], [textField]: value };
                            return { ...q, options: opts };
                        })
                    }
                    : sub
                )
            }
            : s
        ));
    };

    const addOption = (sectionId: string, subsectionId: string, questionId: string) => {
        setSections(sections.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
                    ? {
                        ...sub, questions: sub.questions.map(q => {
                            if (q.id !== questionId || q.options.length >= 6) return q;
                            return { ...q, options: [...q.options, { textAr: '', textEn: '', isCorrect: false }] };
                        })
                    }
                    : sub
                )
            }
            : s
        ));
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE HANDLER
    // ═══════════════════════════════════════════════════════════════════════════

    const handleSave = async () => {
        const title = lang === 'ar' ? examTitleAr : examTitleEn;
        if (!title.trim()) {
            addToast({ type: 'error', message: labels.writeExamTitle });
            return;
        }

        const payload = {
            type: lang === 'ar' ? 'arabic_comprehensive_exam' : 'english_comprehensive_exam',
            language: lang === 'ar' ? 'arabic' : 'english',
            exam_title: examTitleAr || examTitleEn,
            stage_id: selectedStage || undefined,
            subject_id: selectedSubject || undefined,
            semester: selectedSemester,
            duration_minutes: duration,
            total_marks: totalScore,
            usage_scope: usageScope,
            grading_mode: gradingMode,
            branch_tags: branchTags,
            blocks: sections as unknown as Json,
            is_published: false,
        };

        try {
            if (examId) {
                await updateExamMutation.mutateAsync({
                    examId: examId,
                    updates: payload
                });
                addToast({ type: 'success', message: labels.successMessage });
            } else {
                if (!user?.id) {
                    addToast({ type: 'error', message: "يجب تسجيل الدخول أولاً" });
                    return;
                }

                await createExamMutation.mutateAsync({
                    ...payload,
                    created_by: user.id
                });
                addToast({ type: 'success', message: labels.successMessage });
            }

            setTimeout(() => router.push('/admin/exams'), 1500);
        } catch (err: any) {
            logger.error('Error saving exam', { context: 'CreateExam', data: err });
            addToast({ type: 'error', message: err?.message || labels.errorSaving });
        }
    };

    const totalQuestions = sections.reduce((sum, s) => sum + s.subsections.reduce((subSum, sub) => subSum + sub.questions.length, 0), 0);
    const getTitle = (s: QuestionSection) => lang === 'ar' ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr);
    const getQText = (q: Question) => lang === 'ar' ? (q.textAr || q.textEn) : (q.textEn || q.textAr);
    const getOptText = (o: QuestionOption) => lang === 'ar' ? (o.textAr || o.textEn) : (o.textEn || o.textAr);

    if (isExamLoading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" text={isAuthLoading ? "جاري التحقق من الحساب..." : "جاري تحميل الامتحان..."} />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 z-20 bg-gray-50/90 dark:bg-[#13131a]/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                        <Layers className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {examId ? labels.editTitle : labels.pageTitle}
                        </h1>
                        <p className="text-sm text-gray-500">{totalQuestions} سؤال في {sections.length} قسم</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button onClick={() => setLang('ar')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${lang === 'ar' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md' : 'text-gray-500'}`}>
                            العربية
                        </button>
                        <button onClick={() => setLang('en')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md' : 'text-gray-500'}`}>
                            English
                        </button>
                    </div>

                    <button onClick={() => router.push('/admin/exams')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] hover:bg-gray-50 text-sm font-medium">
                        <X className="h-4 w-4" />{labels.cancel}
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg disabled:opacity-70 text-sm font-semibold">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {labels.save}
                    </button>
                </div>
            </div>

            {/* Exam Settings */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-indigo-500" />{labels.examSettings}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {labels.examTitle} {lang === 'ar' ? '(عربي)' : '(English)'}
                        </label>
                        <input type="text"
                            value={lang === 'ar' ? examTitleAr : examTitleEn}
                            onChange={(e) => lang === 'ar' ? setExamTitleAr(e.target.value) : setExamTitleEn(e.target.value)}
                            placeholder={labels.examTitlePlaceholder}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.stage}</label>
                        <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <option value="">{labels.selectStage}</option>
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.subject}</label>
                        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                            disabled={!selectedStage}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 disabled:opacity-50">
                            <option value="">{labels.selectSubject}</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <Clock className="h-4 w-4" />{labels.duration}
                        </label>
                        <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <Target className="h-4 w-4" />{labels.totalScore}
                        </label>
                        <input type="number" value={totalScore} onChange={(e) => setTotalScore(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
                    </div>
                </div>

                {/* Advanced Settings */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            📅 الفصل الدراسي
                        </label>
                        <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value as any)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            {semesterOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {lang === 'ar' ? opt.label : opt.labelEn}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            🎯 نطاق الاستخدام
                        </label>
                        <select value={usageScope} onChange={(e) => setUsageScope(e.target.value as any)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <option value="public">🌍 عام (للجميع)</option>
                            <option value="private">🔒 خاص (لي فقط)</option>
                            <option value="subscribers">👥 للمشتركين فقط</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ✏️ وضع التصحيح
                        </label>
                        <select value={gradingMode} onChange={(e) => setGradingMode(e.target.value as any)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <option value="auto">⚡ تلقائي</option>
                            <option value="manual">✋ يدوي</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            🏷️ الأفرع (علمي/أدبي)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['علمي', 'أدبي', 'تجاري', 'صناعي'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setBranchTags(prev =>
                                        prev.includes(tag)
                                            ? prev.filter(t => t !== tag)
                                            : [...prev, tag]
                                    )}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${branchTags.includes(tag)
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-500" />{labels.sections} ({sections.length})
                    </h2>
                    <button onClick={addSection}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 text-sm font-medium">
                        <Plus className="h-4 w-4" />{labels.addSection}
                    </button>
                </div>

                {sections.map((section, sIdx) => (
                    <motion.div key={section.id} layout
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                        {/* Section Header */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-b border-gray-100 dark:border-gray-800 cursor-pointer"
                            onClick={() => toggleSection(section.id)}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                    {sIdx + 1}
                                </div>
                                <input type="text"
                                    value={lang === 'ar' ? section.titleAr : section.titleEn}
                                    onChange={(e) => updateSection(section.id, lang === 'ar' ? 'titleAr' : 'titleEn', e.target.value)}
                                    placeholder={labels.sectionTitle}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-transparent border-none font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-0 w-64"
                                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                                <span className="text-xs text-gray-500">({section.subsections.reduce((sum, sub) => sum + sub.questions.length, 0)} سؤال)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                {expandedSections.has(section.id) ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                            </div>
                        </div>

                        {/* Section Body */}
                        <AnimatePresence>
                            {expandedSections.has(section.id) && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="p-4 space-y-4">
                                    {/* Content Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.contentType}</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'none', label: labels.noText, icon: List },
                                                { value: 'reading', label: labels.reading, icon: FileText },
                                                { value: 'poetry', label: labels.poetry, icon: Feather },
                                            ].map(ct => (
                                                <button key={ct.value} onClick={() => updateSection(section.id, 'contentType', ct.value as ContentType)}
                                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${section.contentType === ct.value
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                                                    <ct.icon className={`h-4 w-4 ${section.contentType === ct.value ? 'text-indigo-500' : 'text-gray-400'}`} />
                                                    <span className={section.contentType === ct.value ? 'text-indigo-700 font-medium' : 'text-gray-600'}>{ct.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reading Content */}
                                    {section.contentType === 'reading' && (
                                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-3">
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                                                <FileText className="h-5 w-5" />{labels.readingText}
                                            </div>
                                            <input type="text" value={section.readingTitle}
                                                onChange={(e) => updateSection(section.id, 'readingTitle', e.target.value)}
                                                placeholder={labels.textTitle}
                                                className="w-full px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800" />
                                            <textarea value={section.readingText}
                                                onChange={(e) => updateSection(section.id, 'readingText', e.target.value)}
                                                placeholder={labels.writeText} rows={5}
                                                className="w-full px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 resize-none" />
                                        </div>
                                    )}

                                    {/* Poetry Content */}
                                    {section.contentType === 'poetry' && (
                                        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 space-y-3">
                                            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                                                <Feather className="h-5 w-5" />{labels.poetrySection}
                                            </div>
                                            <input type="text" value={section.poetryTitle}
                                                onChange={(e) => updateSection(section.id, 'poetryTitle', e.target.value)}
                                                placeholder={labels.poemTitle}
                                                className="w-full px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800" />
                                            <div className="space-y-2">
                                                {section.poetryVerses.map((verse, vIdx) => (
                                                    <div key={verse.id} className="flex items-center gap-2">
                                                        <span className="text-gray-400 w-6">{vIdx + 1}.</span>
                                                        <input type="text" value={verse.firstHalf}
                                                            onChange={(e) => updateVerse(section.id, verse.id, 'firstHalf', e.target.value)}
                                                            placeholder={labels.firstHalf}
                                                            className="flex-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800" />
                                                        <input type="text" value={verse.secondHalf}
                                                            onChange={(e) => updateVerse(section.id, verse.id, 'secondHalf', e.target.value)}
                                                            placeholder={labels.secondHalf}
                                                            className="flex-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800" />
                                                        <button onClick={() => removeVerse(section.id, verse.id)} className="text-red-400 hover:text-red-500">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addVerse(section.id)}
                                                    className="flex items-center gap-1 text-sm text-purple-600 hover:underline">
                                                    <Plus className="h-3 w-3" />{labels.addVerse}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Subsections */}
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                            {Object.entries(subsectionTypeLabels).map(([type, label]) => (
                                                <button key={type}
                                                    onClick={() => addSubsection(section.id, type as QuestionType)}
                                                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors">
                                                    + {lang === 'ar' ? label.ar : label.en}
                                                </button>
                                            ))}
                                        </div>

                                        {section.subsections.map((subsection) => (
                                            <div key={subsection.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                                <div className="bg-gray-50 dark:bg-gray-800 p-3 flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={subsection.title}
                                                            onChange={(e) => updateSubsectionTitle(section.id, subsection.id, e.target.value)}
                                                            className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 w-full focus:ring-0"
                                                        />
                                                    </div>
                                                    <button onClick={() => removeSubsection(section.id, subsection.id)} className="text-red-400 hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="p-3 space-y-4 bg-white dark:bg-[#1c1c24]">
                                                    {subsection.questions.map((q, qIdx) => (
                                                        <div key={q.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                                                            <div className="flex items-start gap-4">
                                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs font-bold mt-1">
                                                                    {qIdx + 1}
                                                                </span>
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex gap-2">
                                                                        <textarea
                                                                            value={getQText(q)}
                                                                            onChange={(e) => updateQuestion(section.id, subsection.id, q.id, lang === 'ar' ? 'textAr' : 'textEn', e.target.value)}
                                                                            placeholder={labels.questionText}
                                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 resize-none h-20"
                                                                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                                                        />
                                                                        <div className="w-24 space-y-2">
                                                                            <input type="number" value={q.points}
                                                                                onChange={(e) => updateQuestion(section.id, subsection.id, q.id, 'points', Number(e.target.value))}
                                                                                placeholder="النقاط" title="النقاط"
                                                                                className="w-full px-2 py-1 rounded text-sm border bg-white dark:bg-gray-800 text-center" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Conditional Fields based on Question Type */}
                                                                    {q.type === 'parsing' && (
                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            <input type="text"
                                                                                value={q.underlinedWord || ''}
                                                                                onChange={(e) => updateQuestion(section.id, subsection.id, q.id, 'underlinedWord', e.target.value)}
                                                                                placeholder={labels.parsingWordPlaceholder}
                                                                                className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 text-sm bg-indigo-50/50 dark:bg-indigo-900/20"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {q.type === 'fill_blank' && (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                            <input type="text"
                                                                                value={t.ar ? q.blankTextAr : q.blankTextEn} // Simplification for text with blank
                                                                                onChange={(e) => updateQuestion(section.id, subsection.id, q.id, lang === 'ar' ? 'blankTextAr' : 'blankTextEn', e.target.value)}
                                                                                placeholder={labels.fillBlankPlaceholder}
                                                                                className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 text-sm bg-indigo-50/50 dark:bg-indigo-900/20"
                                                                            />
                                                                            <input type="text"
                                                                                value={t.ar ? q.correctAnswerAr : q.correctAnswerEn}
                                                                                onChange={(e) => updateQuestion(section.id, subsection.id, q.id, lang === 'ar' ? 'correctAnswerAr' : 'correctAnswerEn', e.target.value)}
                                                                                placeholder={labels.correctAnswerPlaceholder}
                                                                                className="w-full px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 text-sm bg-green-50/50 dark:bg-green-900/20"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {q.type === 'extraction' && (
                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            <input type="text"
                                                                                value={q.extractionTarget || ''}
                                                                                onChange={(e) => updateQuestion(section.id, subsection.id, q.id, 'extractionTarget', e.target.value)}
                                                                                placeholder={labels.extractionTargetPlaceholder}
                                                                                className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 text-sm bg-indigo-50/50 dark:bg-indigo-900/20"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Options for MCQ */}
                                                                    {q.type === 'mcq' && (
                                                                        <div className="space-y-2">
                                                                            {q.options.map((opt, oIdx) => (
                                                                                <div key={oIdx} className="flex items-center gap-2">
                                                                                    <div className="relative flex items-center justify-center w-6 h-6">
                                                                                        <input type="radio"
                                                                                            name={`correct-${q.id}`}
                                                                                            checked={opt.isCorrect}
                                                                                            onChange={(e) => updateQuestionOption(section.id, subsection.id, q.id, oIdx, 'isCorrect', e.target.checked)}
                                                                                            className="w-4 h-4 text-green-600 focus:ring-green-500" />
                                                                                    </div>
                                                                                    <input type="text"
                                                                                        value={getOptText(opt)}
                                                                                        onChange={(e) => updateQuestionOption(section.id, subsection.id, q.id, oIdx, 'text', e.target.value)}
                                                                                        placeholder={`${labels.options} ${oIdx + 1}`}
                                                                                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${opt.isCorrect
                                                                                            ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                                                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                                                                                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                            {q.options.length < 6 && (
                                                                                <button onClick={() => addOption(section.id, subsection.id, q.id)}
                                                                                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-8">
                                                                                    + {labels.addOption}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* True/False Options (Read-only structure mostly) */}
                                                                    {q.type === 'true_false' && (
                                                                        <div className="flex gap-4">
                                                                            {q.options.map((opt, oIdx) => (
                                                                                <label key={oIdx} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${opt.isCorrect
                                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500'
                                                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}>
                                                                                    <input type="radio"
                                                                                        name={`correct-${q.id}`}
                                                                                        checked={opt.isCorrect}
                                                                                        onChange={(e) => updateQuestionOption(section.id, subsection.id, q.id, oIdx, 'isCorrect', e.target.checked)}
                                                                                        className="w-4 h-4 text-green-600" />
                                                                                    <span className="text-sm font-medium">{getOptText(opt)}</span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button onClick={() => removeQuestion(section.id, subsection.id, q.id)}
                                                                    className="text-gray-400 hover:text-red-500">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addQuestion(section.id, subsection.id)}
                                                        className="w-full py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm font-medium transition-colors">
                                                        + {labels.addQuestion}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
