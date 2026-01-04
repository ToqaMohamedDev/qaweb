// =============================================
// useQuestionBankCreate - Hook لإدارة إنشاء الأسئلة
// =============================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import { questionBankI18n } from '@/lib/i18n';

export type Lang = 'ar' | 'en';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ContentType = 'none' | 'reading' | 'poetry';
export type QuestionType = 'mcq' | 'essay' | 'true_false' | 'parsing' | 'fill_blank' | 'extraction';

export interface Stage { id: string; name: string; }
export interface Subject { id: string; name: string; }
export interface Lesson { id: string; title: string; }

export interface PoetryVerse {
    id: string;
    firstHalf: string;
    secondHalf: string;
}

export interface QuestionOption {
    textAr: string;
    textEn: string;
    isCorrect: boolean;
}

export interface Question {
    id: string;
    type: QuestionType;
    textAr: string;
    textEn: string;
    options: QuestionOption[];
    hintAr: string;
    hintEn: string;
    explanationAr: string;
    explanationEn: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    underlinedWord?: string;
    blankTextAr?: string;
    blankTextEn?: string;
    correctAnswerAr?: string;
    correctAnswerEn?: string;
    extractionTarget?: string;
}

export interface QuestionSection {
    id: string;
    sectionType: QuestionType;
    titleAr: string;
    titleEn: string;
    questions: Question[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const sectionTitles: Record<QuestionType, { ar: string; en: string }> = {
    mcq: { ar: 'أسئلة اختيار متعدد', en: 'Multiple Choice Questions' },
    true_false: { ar: 'أسئلة صح وخطأ', en: 'True/False Questions' },
    essay: { ar: 'أسئلة مقالية', en: 'Essay Questions' },
    parsing: { ar: 'أسئلة الإعراب', en: 'Parsing Questions' },
    fill_blank: { ar: 'أسئلة أكمل الفراغ', en: 'Fill in the Blank Questions' },
    extraction: { ar: 'أسئلة الاستخراج', en: 'Extraction Questions' },
};

export const createEmptyQuestion = (type: QuestionType = 'mcq'): Question => ({
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    textAr: '',
    textEn: '',
    options: type === 'mcq' ? [
        { textAr: '', textEn: '', isCorrect: true },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
    ] : type === 'true_false' ? [
        { textAr: 'صح', textEn: 'True', isCorrect: true },
        { textAr: 'خطأ', textEn: 'False', isCorrect: false },
    ] : [],
    hintAr: '',
    hintEn: '',
    explanationAr: '',
    explanationEn: '',
    difficulty: 'medium',
    points: 1,
    underlinedWord: '',
    blankTextAr: '',
    blankTextEn: '',
    correctAnswerAr: '',
    correctAnswerEn: '',
    extractionTarget: '',
});

export const createEmptySection = (type: QuestionType): QuestionSection => ({
    id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sectionType: type,
    titleAr: sectionTitles[type].ar,
    titleEn: sectionTitles[type].en,
    questions: [createEmptyQuestion(type)],
});

export const createEmptyVerse = (): PoetryVerse => ({
    id: `verse-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    firstHalf: '',
    secondHalf: '',
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useQuestionBankCreate() {
    const router = useRouter();

    // ─── Language State ───
    const [lang, setLang] = useState<Lang>('ar');
    const labels = useMemo(() => questionBankI18n[lang], [lang]);
    const isRTL = lang === 'ar';

    // ─── Context State ───
    const [stages, setStages] = useState<Stage[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedLesson, setSelectedLesson] = useState('');

    // ─── Content State ───
    const [contentType, setContentType] = useState<ContentType>('none');
    const [readingTitle, setReadingTitle] = useState('');
    const [readingText, setReadingText] = useState('');
    const [poetryTitle, setPoetryTitle] = useState('');
    const [poetryVerses, setPoetryVerses] = useState<PoetryVerse[]>([createEmptyVerse(), createEmptyVerse()]);

    // ─── Sections State ───
    const [sections, setSections] = useState<QuestionSection[]>([]);
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    // ─── UI State ───
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // ═══════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════

    const fetchStages = useCallback(async () => {
        const { data } = await supabase.from('educational_stages').select('id, name').order('created_at');
        setStages(data || []);
    }, []);

    const fetchSubjects = useCallback(async () => {
        const { data } = await supabase.from('subjects').select('id, name').eq('is_active', true).order('order_index');
        setSubjects(data || []);
    }, []);

    const fetchLessons = useCallback(async () => {
        const { data } = await supabase.from('lessons').select('id, title')
            .eq('subject_id', selectedSubject).eq('stage_id', selectedStage).order('order_index');
        setLessons(data || []);
    }, [selectedSubject, selectedStage]);

    useEffect(() => { fetchStages(); }, [fetchStages]);

    useEffect(() => {
        if (selectedStage) fetchSubjects();
        else { setSubjects([]); setSelectedSubject(''); }
    }, [selectedStage, fetchSubjects]);

    useEffect(() => {
        if (selectedStage && selectedSubject) fetchLessons();
        else { setLessons([]); setSelectedLesson(''); }
    }, [selectedStage, selectedSubject, fetchLessons]);

    // ═══════════════════════════════════════════════════════════════════════
    // VERSE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addVerse = useCallback(() => {
        setPoetryVerses(prev => [...prev, createEmptyVerse()]);
    }, []);

    const removeVerse = useCallback((id: string) => {
        setPoetryVerses(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(v => v.id !== id);
        });
    }, []);

    const updateVerse = useCallback((id: string, field: 'firstHalf' | 'secondHalf', value: string) => {
        setPoetryVerses(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addSection = useCallback((type: QuestionType) => {
        const newSection = createEmptySection(type);
        setSections(prev => [...prev, newSection]);
        setExpandedSectionId(newSection.id);
    }, []);

    const removeSection = useCallback((id: string) => {
        setSections(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(s => s.id !== id);
        });
    }, []);

    const updateSectionTitle = useCallback((id: string, value: string) => {
        const field = lang === 'ar' ? 'titleAr' : 'titleEn';
        setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    }, [lang]);

    // ═══════════════════════════════════════════════════════════════════════
    // QUESTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addQuestion = useCallback((sectionId: string, type: QuestionType = 'mcq') => {
        const newQ = createEmptyQuestion(type);
        setSections(prev => prev.map(s =>
            s.id === sectionId ? { ...s, questions: [...s.questions, newQ] } : s
        ));
        setExpandedQuestionId(newQ.id);
    }, []);

    const removeQuestion = useCallback((sectionId: string, questionId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId || s.questions.length <= 1) return s;
            return { ...s, questions: s.questions.filter(q => q.id !== questionId) };
        }));
    }, []);

    const duplicateQuestion = useCallback((sectionId: string, questionId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const qIndex = s.questions.findIndex(q => q.id === questionId);
            if (qIndex === -1) return s;
            const newQ = { ...s.questions[qIndex], id: `q-${Date.now()}` };
            const updated = [...s.questions];
            updated.splice(qIndex + 1, 0, newQ);
            return { ...s, questions: updated };
        }));
    }, []);

    const updateQuestionText = useCallback((sectionId: string, questionId: string, value: string) => {
        const field = lang === 'ar' ? 'textAr' : 'textEn';
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
            };
        }));
    }, [lang]);

    const updateQuestionField = useCallback((sectionId: string, questionId: string, field: keyof Question, value: any) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
            };
        }));
    }, []);

    const updateQuestionExplanation = useCallback((sectionId: string, questionId: string, value: string) => {
        const field = lang === 'ar' ? 'explanationAr' : 'explanationEn';
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
            };
        }));
    }, [lang]);

    const updateQuestionOption = useCallback((
        sectionId: string,
        questionId: string,
        optionIndex: number,
        field: 'text' | 'isCorrect',
        value: string | boolean
    ) => {
        const textField = lang === 'ar' ? 'textAr' : 'textEn';
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId) return q;
                    const updatedOptions = [...q.options];
                    if (field === 'isCorrect' && value === true) {
                        updatedOptions.forEach((o, i) => { o.isCorrect = i === optionIndex; });
                    } else if (field === 'text') {
                        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [textField]: value };
                    }
                    return { ...q, options: updatedOptions };
                })
            };
        }));
    }, [lang]);

    const addOptionToQuestion = useCallback((sectionId: string, questionId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId || q.options.length >= 8) return q;
                    return { ...q, options: [...q.options, { textAr: '', textEn: '', isCorrect: false }] };
                })
            };
        }));
    }, []);

    const removeOptionFromQuestion = useCallback((sectionId: string, questionId: string, optionIndex: number) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId || q.options.length <= 2) return q;
                    return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
                })
            };
        }));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // SAVE HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    const handleSave = useCallback(async () => {
        if (!selectedLesson) {
            setError(labels.selectLessonError);
            return;
        }

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (!section.titleAr.trim() && !section.titleEn.trim()) {
                setError(`${labels.writeSectionTitle} ${i + 1}`);
                return;
            }
            for (let j = 0; j < section.questions.length; j++) {
                const q = section.questions[j];
                if (!q.textAr.trim() && !q.textEn.trim()) {
                    setError(`${labels.writeQuestionText} ${i + 1}-${j + 1}`);
                    return;
                }
                if ((q.type === 'mcq' || q.type === 'true_false') && !q.options.some(o => o.isCorrect)) {
                    setError(`${labels.selectCorrectAnswer} ${i + 1}-${j + 1}`);
                    return;
                }
            }
        }

        setIsLoading(true);
        setError('');

        try {
            let contentMeta = null;
            if (contentType === 'reading') {
                contentMeta = { type: 'reading', title: readingTitle.trim(), text: readingText.trim() };
            } else if (contentType === 'poetry') {
                contentMeta = {
                    type: 'poetry',
                    title: poetryTitle.trim(),
                    verses: poetryVerses.filter(v => v.firstHalf.trim() || v.secondHalf.trim()).map(v => ({
                        first: v.firstHalf.trim(),
                        second: v.secondHalf.trim(),
                    })),
                };
            }

            const batchGroupId = `grp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const allQuestions: any[] = [];
            let orderIndex = 0;

            sections.forEach(section => {
                section.questions.forEach(q => {
                    const correctIndex = q.options.findIndex(o => o.isCorrect);
                    const hasOptions = q.type === 'mcq' || q.type === 'true_false';

                    const questionPayload: any = {
                        lesson_id: selectedLesson,
                        group_id: batchGroupId,
                        stage_id: selectedStage || null,
                        subject_id: selectedSubject || null,
                        section_title: { ar: section.titleAr.trim(), en: section.titleEn.trim() },
                        text: { ar: q.textAr.trim(), en: q.textEn.trim() },
                        type: q.type === 'true_false' ? 'truefalse' : q.type,
                        options: hasOptions ? q.options.map(o => ({
                            text: o.textAr || o.textEn,
                            textAr: o.textAr,
                            textEn: o.textEn,
                            isCorrect: o.isCorrect
                        })) : [],
                        correct_option_id: hasOptions ? String(correctIndex) : null,
                        correct_answer: hasOptions
                            ? { value: correctIndex }
                            : (q.type === 'fill_blank' || q.type === 'extraction' || q.type === 'parsing')
                                ? { ar: q.correctAnswerAr?.trim() || '', en: q.correctAnswerEn?.trim() || '' }
                                : null,
                        difficulty: q.difficulty,
                        points: q.points,
                        order_index: orderIndex++,
                        hint: { ar: q.hintAr.trim(), en: q.hintEn.trim() },
                        explanation: { ar: q.explanationAr.trim(), en: q.explanationEn.trim() },
                        media: contentMeta ? { content: contentMeta } : null,
                        is_active: true,
                        metadata: {
                            ...(q.type === 'parsing' && { underlinedWord: q.underlinedWord?.trim() || '' }),
                            ...(q.type === 'fill_blank' && {
                                blankText: { ar: q.blankTextAr?.trim() || '', en: q.blankTextEn?.trim() || '' }
                            }),
                            ...(q.type === 'extraction' && { extractionTarget: q.extractionTarget?.trim() || '' }),
                        },
                    };
                    allQuestions.push(questionPayload);
                });
            });

            const { error: insertError } = await supabase.from('lesson_questions').insert(allQuestions);
            if (insertError) throw insertError;

            setSuccessMessage(labels.successMessage);
            setTimeout(() => router.push('/admin/question-bank'), 2000);
        } catch (err: any) {
            logger.error('Error saving questions', { context: 'CreateQuestions', data: err });
            setError(err?.message || labels.errorSaving);
        } finally {
            setIsLoading(false);
        }
    }, [
        selectedLesson, sections, contentType, readingTitle, readingText,
        poetryTitle, poetryVerses, selectedStage, selectedSubject, labels, router
    ]);

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════

    const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

    const getQuestionText = useCallback((q: Question) =>
        lang === 'ar' ? (q.textAr || q.textEn) : (q.textEn || q.textAr), [lang]);

    const getSectionTitle = useCallback((s: QuestionSection) =>
        lang === 'ar' ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr), [lang]);

    const getOptionText = useCallback((o: QuestionOption) =>
        lang === 'ar' ? (o.textAr || o.textEn) : (o.textEn || o.textAr), [lang]);

    // ═══════════════════════════════════════════════════════════════════════
    // RETURN
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Language
        lang,
        setLang,
        labels,
        isRTL,

        // Context
        stages,
        subjects,
        lessons,
        selectedStage,
        setSelectedStage,
        selectedSubject,
        setSelectedSubject,
        selectedLesson,
        setSelectedLesson,

        // Content
        contentType,
        setContentType,
        readingTitle,
        setReadingTitle,
        readingText,
        setReadingText,
        poetryTitle,
        setPoetryTitle,
        poetryVerses,
        addVerse,
        removeVerse,
        updateVerse,

        // Sections
        sections,
        expandedSectionId,
        setExpandedSectionId,
        expandedQuestionId,
        setExpandedQuestionId,
        addSection,
        removeSection,
        updateSectionTitle,

        // Questions
        addQuestion,
        removeQuestion,
        duplicateQuestion,
        updateQuestionText,
        updateQuestionField,
        updateQuestionExplanation,
        updateQuestionOption,
        addOptionToQuestion,
        removeOptionFromQuestion,

        // UI
        isLoading,
        error,
        setError,
        successMessage,

        // Actions
        handleSave,
        goBack: () => router.push('/admin/question-bank'),

        // Computed
        totalQuestions,
        getQuestionText,
        getSectionTitle,
        getOptionText,
    };
}

export type UseQuestionBankCreateReturn = ReturnType<typeof useQuestionBankCreate>;
