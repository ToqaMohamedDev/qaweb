// ═══════════════════════════════════════════════════════════════════════════
// useExamCreate - Hook مشترك لإنشاء وتعديل الامتحانات
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    createId,
    createEmptyQuestion,
    createEmptyVerse,
    updateOptionInQuestion,
    addOptionToQuestion,
    questionTypeLabels,
    type QuestionType,
    type QuestionOption,
    type PoetryVerse,
    type Lang,
    type BaseQuestion,
} from '@/lib/utils/questionUtils';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ContentType = 'none' | 'reading' | 'poetry';

export type Question = BaseQuestion;

export interface QuestionSubsection {
    id: string;
    title: string;
    type: QuestionType;
    questions: Question[];
}

export interface QuestionSection {
    id: string;
    titleAr: string;
    titleEn: string;
    contentType: ContentType;
    readingTitle: string;
    readingText: string;
    poetryTitle: string;
    poetryVerses: PoetryVerse[];
    subsections: QuestionSubsection[];
}

export interface UseExamCreateOptions {
    redirectPath: string;
    isTeacher?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const translations = {
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
        timeLimitedExam: 'توقيت محدد للامتحان',
        timeLimitedDesc: 'تفعيل هذا الخيار يجعل الامتحان متاحاً فقط في التاريخ والوقت المحددين',
        availableFrom: 'متاح من',
        availableUntil: 'متاح حتى',
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
        timeLimitedExam: 'Time Limited Exam',
        timeLimitedDesc: 'Enable this to make the exam available only during specific date and time',
        availableFrom: 'Available From',
        availableUntil: 'Available Until',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const createEmptySubsection = (type: QuestionType): QuestionSubsection => ({
    id: `sub-${createId()}`,
    title: questionTypeLabels[type].ar,
    type,
    questions: [createEmptyQuestion(type)],
});

const createEmptySection = (): QuestionSection => ({
    id: `sec-${createId()}`,
    titleAr: '',
    titleEn: '',
    contentType: 'none',
    readingTitle: '',
    readingText: '',
    poetryTitle: '',
    poetryVerses: [createEmptyVerse(), createEmptyVerse()],
    subsections: [],
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useExamCreate(options: UseExamCreateOptions) {
    const { redirectPath } = options;
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = searchParams?.get('id') || null;

    // ─── Language ───
    const [lang, setLang] = useState<Lang>('ar');
    const labels = useMemo(() => translations[lang], [lang]);
    const isRTL = lang === 'ar';

    // ─── Exam Settings ───
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examTitleAr, setExamTitleAr] = useState('');
    const [examTitleEn, setExamTitleEn] = useState('');
    const [duration, setDuration] = useState(60);
    const [totalScore, setTotalScore] = useState(100);

    // ─── Advanced Settings ───
    const [gradingMode, setGradingMode] = useState<'auto' | 'manual'>('auto');
    const [usageScope, setUsageScope] = useState<'public' | 'private' | 'subscribers'>('public');
    const [branchTags, setBranchTags] = useState<string[]>([]);

    // ─── Time Limited Settings ───
    const [isTimeLimited, setIsTimeLimited] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [fromTime, setFromTime] = useState('');
    const [untilDate, setUntilDate] = useState('');
    const [untilTime, setUntilTime] = useState('');

    // ─── Sections ───
    const [sections, setSections] = useState<QuestionSection[]>([createEmptySection()]);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addSection = useCallback(() => {
        const newSec = createEmptySection();
        setSections(prev => [...prev, newSec]);
        setExpandedSections(prev => new Set([...prev, newSec.id]));
    }, []);

    const removeSection = useCallback((id: string) => {
        setSections(prev => prev.length <= 1 ? prev : prev.filter(s => s.id !== id));
    }, []);

    const toggleSection = useCallback((id: string) => {
        setExpandedSections(prev => {
            const updated = new Set(prev);
            if (updated.has(id)) updated.delete(id);
            else updated.add(id);
            return updated;
        });
    }, []);

    const updateSection = useCallback((id: string, field: keyof QuestionSection, value: QuestionSection[keyof QuestionSection]) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // VERSE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addVerse = useCallback((sectionId: string) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? { ...s, poetryVerses: [...s.poetryVerses, createEmptyVerse()] }
            : s
        ));
    }, []);

    const removeVerse = useCallback((sectionId: string, verseId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId || s.poetryVerses.length <= 1) return s;
            return { ...s, poetryVerses: s.poetryVerses.filter(v => v.id !== verseId) };
        }));
    }, []);

    const updateVerse = useCallback((
        sectionId: string,
        verseId: string,
        field: 'firstHalf' | 'secondHalf',
        value: string
    ) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? { ...s, poetryVerses: s.poetryVerses.map(v => v.id === verseId ? { ...v, [field]: value } : v) }
            : s
        ));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // SUBSECTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addSubsection = useCallback((sectionId: string, type: QuestionType) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? { ...s, subsections: [...s.subsections, createEmptySubsection(type)] }
            : s
        ));
    }, []);

    const removeSubsection = useCallback((sectionId: string, subsectionId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, subsections: s.subsections.filter(sub => sub.id !== subsectionId) };
        }));
    }, []);

    const updateSubsectionTitle = useCallback((sectionId: string, subsectionId: string, title: string) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub =>
                    sub.id === subsectionId ? { ...sub, title } : sub
                )
            }
            : s
        ));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // QUESTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addQuestion = useCallback((sectionId: string, subsectionId: string) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub =>
                    sub.id === subsectionId
                        ? { ...sub, questions: [...sub.questions, createEmptyQuestion(sub.type)] }
                        : sub
                )
            }
            : s
        ));
    }, []);

    const removeQuestion = useCallback((sectionId: string, subsectionId: string, questionId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s, subsections: s.subsections.map(sub => {
                    if (sub.id !== subsectionId || sub.questions.length <= 1) return sub;
                    return { ...sub, questions: sub.questions.filter(q => q.id !== questionId) };
                })
            };
        }));
    }, []);

    const updateQuestion = useCallback((
        sectionId: string,
        subsectionId: string,
        questionId: string,
        field: keyof Question,
        value: Question[keyof Question]
    ) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
                    ? { ...sub, questions: sub.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q) }
                    : sub
                )
            }
            : s
        ));
    }, []);

    const updateQuestionOption = useCallback((
        sectionId: string,
        subsectionId: string,
        questionId: string,
        optIdx: number,
        field: 'text' | 'isCorrect',
        value: string | boolean
    ) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
                    ? {
                        ...sub, questions: sub.questions.map(q => {
                            if (q.id !== questionId) return q;
                            return { ...q, options: updateOptionInQuestion(q.options, optIdx, field, value, lang) };
                        })
                    }
                    : sub
                )
            }
            : s
        ));
    }, [lang]);

    const addOption = useCallback((sectionId: string, subsectionId: string, questionId: string) => {
        setSections(prev => prev.map(s => s.id === sectionId
            ? {
                ...s, subsections: s.subsections.map(sub => sub.id === subsectionId
                    ? {
                        ...sub, questions: sub.questions.map(q => {
                            if (q.id !== questionId) return q;
                            return { ...q, options: addOptionToQuestion(q.options, 6) };
                        })
                    }
                    : sub
                )
            }
            : s
        ));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════

    const totalQuestions = useMemo(() =>
        sections.reduce((sum, s) => sum + s.subsections.reduce((subSum, sub) => subSum + sub.questions.length, 0), 0),
        [sections]
    );

    const getTitle = useCallback((s: QuestionSection) =>
        lang === 'ar' ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr), [lang]);

    const getQText = useCallback((q: Question) =>
        lang === 'ar' ? (q.textAr || q.textEn) : (q.textEn || q.textAr), [lang]);

    const getOptText = useCallback((o: QuestionOption) =>
        lang === 'ar' ? (o.textAr || o.textEn) : (o.textEn || o.textAr), [lang]);

    // ═══════════════════════════════════════════════════════════════════════
    // POPULATE FROM EXISTING EXAM
    // ═══════════════════════════════════════════════════════════════════════

    const populateFromExam = useCallback((exam: Record<string, unknown> | null) => {
        if (!exam) return;

        setExamTitleAr(String(exam.exam_title || ''));
        setDuration(Number(exam.duration_minutes) || 60);
        setTotalScore(Number(exam.total_marks) || 100);

        if (exam.stage_id) setSelectedStage(String(exam.stage_id));
        if (exam.subject_id) setSelectedSubject(String(exam.subject_id));
        if (exam.language === 'english') setLang('en');

        if (exam.is_time_limited) {
            setIsTimeLimited(true);
        }

        const rawSections = (exam.sections || exam.blocks || []) as QuestionSection[];
        if (Array.isArray(rawSections) && rawSections.length > 0) {
            const loadedSections = rawSections.map(section => ({
                ...section,
                contentType: section.contentType || 'none',
            }));
            setSections(loadedSections);
            if (loadedSections[0]?.id) {
                setExpandedSections(new Set([loadedSections[0].id]));
            }
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════

    const goBack = useCallback(() => router.push(redirectPath), [router, redirectPath]);

    // ═══════════════════════════════════════════════════════════════════════
    // RETURN
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // IDs
        examId,

        // Language
        lang,
        setLang,
        labels,
        isRTL,

        // Exam Settings
        selectedStage,
        setSelectedStage,
        selectedSubject,
        setSelectedSubject,
        examTitleAr,
        setExamTitleAr,
        examTitleEn,
        setExamTitleEn,
        duration,
        setDuration,
        totalScore,
        setTotalScore,

        // Advanced Settings
        gradingMode,
        setGradingMode,
        usageScope,
        setUsageScope,
        branchTags,
        setBranchTags,

        // Time Limited Settings
        isTimeLimited,
        setIsTimeLimited,
        fromDate,
        setFromDate,
        fromTime,
        setFromTime,
        untilDate,
        setUntilDate,
        untilTime,
        setUntilTime,

        // Sections State
        sections,
        setSections,
        expandedSections,

        // Section Actions
        addSection,
        removeSection,
        toggleSection,
        updateSection,

        // Verse Actions
        addVerse,
        removeVerse,
        updateVerse,

        // Subsection Actions
        addSubsection,
        removeSubsection,
        updateSubsectionTitle,

        // Question Actions
        addQuestion,
        removeQuestion,
        updateQuestion,
        updateQuestionOption,
        addOption,

        // Computed
        totalQuestions,
        getTitle,
        getQText,
        getOptText,

        // Utils
        populateFromExam,
        goBack,
    };
}

export type UseExamCreateReturn = ReturnType<typeof useExamCreate>;
