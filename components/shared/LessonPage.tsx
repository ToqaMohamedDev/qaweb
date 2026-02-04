"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    FileText, ArrowRight, ArrowLeft, CheckCircle2, XCircle, RotateCcw,
    Trophy, Target, ChevronLeft, ChevronDown, ChevronUp, Loader2, BookOpen
} from "lucide-react";
import { logger } from "@/lib/utils/logger";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    type: string;
}

interface QuestionSection {
    type: string;
    typeLabel: string;
    questions: Question[];
}

interface QuestionBank {
    bankId: string;
    bankTitle: string;
    mediaType: 'reading' | 'poetry' | null;
    mediaTitle: string;
    mediaText: string;
    mediaVerses: { first: string; second: string }[];
    sections: QuestionSection[];
}

interface Lesson {
    id: string;
    title: string;
    description: string;
}

interface BankState {
    activeSectionIndex: number;
    currentQuestion: number;
    selectedAnswer: number | null;
    showResult: boolean;
    scores: Map<string, number>;
    answeredQuestions: Map<string, Set<number>>;
    isComplete: boolean;
    isExpanded: boolean;
}

interface LessonPageProps {
    lessonId: string;
    subject: 'arabic' | 'english';
}

interface Translations {
    lessonNotFound: string;
    backToLessons: string;
    noQuestionsAdded: string;
    question: string;
    group: string;
    readingText: string;
    poetry: string;
    questionOf: string;
    score: string;
    confirm: string;
    next: string;
    result: string;
    wellDone: string;
    correctOf: string;
    retry: string;
    backToLessonsList: string;
    previousQuestion: string;
    nextQuestion: string;
    explanation: string;
    nextSection: string;
    totalScore: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const translations: Record<'arabic' | 'english', Translations> = {
    arabic: {
        lessonNotFound: 'الدرس غير موجود',
        backToLessons: 'العودة للدروس',
        noQuestionsAdded: 'لم تتم إضافة أسئلة لهذا الدرس بعد.',
        question: 'سؤال',
        group: 'مجموعة',
        readingText: 'نص قراءة',
        poetry: 'شعر',
        questionOf: 'السؤال {current} من {total}',
        score: 'النتيجة',
        confirm: 'تأكيد',
        next: 'التالي',
        result: 'النتيجة',
        wellDone: 'أحسنت!',
        correctOf: '{score} من {total} صحيحة',
        retry: 'إعادة المحاولة',
        backToLessonsList: 'العودة لقائمة الدروس',
        previousQuestion: 'السؤال السابق',
        nextQuestion: 'السؤال التالي',
        explanation: 'التوضيح',
        nextSection: 'القسم التالي',
        totalScore: 'النتيجة الإجمالية',
    },
    english: {
        lessonNotFound: 'Lesson not found',
        backToLessons: 'Back to Lessons',
        noQuestionsAdded: 'No questions have been added to this lesson yet.',
        question: 'question',
        group: 'group',
        readingText: 'Reading Text',
        poetry: 'Poetry',
        questionOf: 'Question {current} of {total}',
        score: 'Score',
        confirm: 'Confirm',
        next: 'Next',
        result: 'Result',
        wellDone: 'Well Done!',
        correctOf: '{score} of {total} correct',
        retry: 'Retry',
        backToLessonsList: 'Back to Lessons List',
        previousQuestion: 'Previous Question',
        nextQuestion: 'Next Question',
        explanation: 'Explanation',
        nextSection: 'Next Section',
        totalScore: 'Total Score',
    },
};

// Question type labels
const typeLabels: Record<string, { ar: string; en: string }> = {
    'mcq': { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
    'truefalse': { ar: 'صح أو خطأ', en: 'True or False' },
    'true_false': { ar: 'صح أو خطأ', en: 'True or False' },
    'fill_blank': { ar: 'أكمل الفراغات', en: 'Fill in the Blanks' },
    'essay': { ar: 'مقالي', en: 'Essay' },
    'parsing': { ar: 'إعراب', en: 'Parsing' },
    'extraction': { ar: 'استخراج', en: 'Extraction' },
};

const typeOrder = ['mcq', 'truefalse', 'true_false', 'fill_blank', 'parsing', 'extraction', 'essay'];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LessonPageComponent({ lessonId, subject }: LessonPageProps) {
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [bankStates, setBankStates] = useState<Map<string, BankState>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const t = translations[subject];
    const isArabic = subject === 'arabic';
    const direction = isArabic ? 'rtl' : 'ltr';
    const BackArrow = isArabic ? ArrowRight : ArrowLeft;
    const ForwardArrow = isArabic ? ArrowLeft : ArrowRight;
    const langKey = isArabic ? 'ar' : 'en';

    // ═══════════════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => {
        const fetchLessonData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Lesson Details via API
                const lessonRes = await fetch(`/api/public/data?entity=lesson&id=${lessonId}`);
                const lessonResult = await lessonRes.json();

                if (!lessonResult.success || !lessonResult.data?.[0]) {
                    throw new Error(t.lessonNotFound);
                }

                const lessonData = lessonResult.data[0];
                setLesson({
                    id: lessonData.id,
                    title: typeof lessonData.title === 'object' && lessonData.title !== null
                        ? ((lessonData.title as unknown as Record<string, string>)?.[langKey] || (lessonData.title as unknown as Record<string, string>)?.ar || '')
                        : (lessonData.title as string) || '',
                    description: typeof lessonData.description === 'object' && lessonData.description !== null
                        ? ((lessonData.description as unknown as Record<string, string>)?.[langKey] || (lessonData.description as unknown as Record<string, string>)?.ar || '')
                        : (lessonData.description as string) || '',
                });

                // 2. Fetch Question Banks via API
                const banksRes = await fetch(`/api/public/data?entity=question_banks&lessonId=${lessonId}`);
                const banksResult = await banksRes.json();
                const banksData = banksResult.data || [];

                if (banksData.length === 0) {
                    setBanks([]);
                    return;
                }

                // 3. Build QuestionBank array
                const loadedBanks: QuestionBank[] = [];
                const initialStates = new Map<string, BankState>();

                banksData.forEach((bank: any, bankIdx: number) => {
                    const bankQuestions = bank.questions || [];
                    if (bankQuestions.length === 0) return;

                    // Get bank title
                    let bankTitle = '';
                    if (bank.title) {
                        bankTitle = typeof bank.title === 'object'
                            ? bank.title[langKey] || bank.title.ar || ''
                            : bank.title || '';
                    }
                    if (!bankTitle && bank.content_data?.title) {
                        bankTitle = bank.content_data.title;
                    }
                    if (!bankTitle) {
                        bankTitle = isArabic ? 'بنك أسئلة' : 'Question Bank';
                    }

                    // Media content
                    let mediaType: 'reading' | 'poetry' | null = null;
                    let mediaTitle = '';
                    let mediaText = '';
                    let mediaVerses: { first: string; second: string }[] = [];

                    if (bank.content_data) {
                        const content = bank.content_data;
                        if (content.type === 'reading' || bank.content_type === 'reading') {
                            mediaType = 'reading';
                            mediaTitle = content.title || '';
                            mediaText = content.text || '';
                        } else if (content.type === 'poetry' || bank.content_type === 'poetry') {
                            mediaType = 'poetry';
                            mediaTitle = content.title || '';
                            mediaVerses = (content.verses || []).map((v: any) => ({
                                first: v.first || v.firstLine || '',
                                second: v.second || v.secondLine || ''
                            }));
                        }
                    }

                    // Group questions by type
                    const questionsByType = new Map<string, any[]>();
                    bankQuestions.forEach((q: any) => {
                        const qType = q.type || 'mcq';
                        if (!questionsByType.has(qType)) {
                            questionsByType.set(qType, []);
                        }
                        questionsByType.get(qType)!.push(q);
                    });

                    // Sort types
                    const sortedTypes = [...questionsByType.keys()].sort((a, b) => {
                        const idxA = typeOrder.indexOf(a);
                        const idxB = typeOrder.indexOf(b);
                        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                    });

                    // Build sections
                    const sections: QuestionSection[] = [];
                    const scores = new Map<string, number>();
                    const answeredQuestions = new Map<string, Set<number>>();

                    sortedTypes.forEach((qType) => {
                        const typeQuestions = questionsByType.get(qType) || [];
                        if (typeQuestions.length === 0) return;

                        typeQuestions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

                        const questions: Question[] = typeQuestions.map((q: any) => {
                            const questionText = typeof q.text === 'object'
                                ? q.text[langKey] || q.text.ar || ''
                                : q.text || '';

                            let options: string[] = [];
                            let correctAnswerIndex = 0;

                            if (q.options && Array.isArray(q.options)) {
                                options = q.options.map((opt: any, idx: number) => {
                                    if (typeof opt === 'object') {
                                        if (opt.isCorrect) correctAnswerIndex = idx;
                                        return opt[isArabic ? 'textAr' : 'textEn'] || opt.text || opt.textAr || '';
                                    }
                                    return String(opt);
                                });
                            }

                            if (q.correct_option_id) {
                                const parsedId = parseInt(q.correct_option_id);
                                if (!isNaN(parsedId)) correctAnswerIndex = parsedId;
                            } else if (q.correct_answer) {
                                if (typeof q.correct_answer === 'number') {
                                    correctAnswerIndex = q.correct_answer;
                                } else if (typeof q.correct_answer === 'object') {
                                    correctAnswerIndex = q.correct_answer.value ?? q.correct_answer.index ?? 0;
                                }
                            }

                            const explanation = typeof q.explanation === 'object' && q.explanation !== null
                                ? q.explanation[langKey] || q.explanation.ar || ''
                                : q.explanation || '';

                            return { id: q.id, question: questionText, options, correctAnswer: correctAnswerIndex, explanation, type: qType };
                        });

                        const typeLabelObj = typeLabels[qType] || { ar: qType, en: qType };
                        sections.push({
                            type: qType,
                            typeLabel: isArabic ? typeLabelObj.ar : typeLabelObj.en,
                            questions,
                        });

                        scores.set(qType, 0);
                        answeredQuestions.set(qType, new Set());
                    });

                    loadedBanks.push({
                        bankId: bank.id,
                        bankTitle,
                        mediaType,
                        mediaTitle,
                        mediaText,
                        mediaVerses,
                        sections,
                    });

                    // Initialize state
                    initialStates.set(bank.id, {
                        activeSectionIndex: 0,
                        currentQuestion: 0,
                        selectedAnswer: null,
                        showResult: false,
                        scores,
                        answeredQuestions,
                        isComplete: false,
                        isExpanded: bankIdx === 0,
                    });
                });

                setBanks(loadedBanks);
                setBankStates(initialStates);

            } catch (err: any) {
                logger.error("Error fetching lesson", { context: `${subject}LessonPage`, data: err });
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (lessonId) {
            fetchLessonData();
        }
    }, [lessonId, subject, t.lessonNotFound, isArabic, langKey]);

    // ═══════════════════════════════════════════════════════════════════════
    // STATE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const updateBankState = useCallback((bankId: string, updates: Partial<BankState>) => {
        setBankStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(bankId);
            if (current) {
                newMap.set(bankId, { ...current, ...updates });
            }
            return newMap;
        });
    }, []);

    const toggleBank = useCallback((bankId: string) => {
        setBankStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(bankId);
            if (current) {
                newMap.set(bankId, { ...current, isExpanded: !current.isExpanded });
            }
            return newMap;
        });
    }, []);

    const switchSection = useCallback((bankId: string, sectionIndex: number) => {
        setBankStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(bankId);
            if (current) {
                newMap.set(bankId, {
                    ...current,
                    activeSectionIndex: sectionIndex,
                    currentQuestion: 0,
                    selectedAnswer: null,
                    showResult: false,
                });
            }
            return newMap;
        });
    }, []);

    const handleAnswerSelect = useCallback((bankId: string, answerIdx: number) => {
        setBankStates(prev => {
            const newMap = new Map(prev);
            const state = newMap.get(bankId);
            if (state && !state.showResult) {
                newMap.set(bankId, { ...state, selectedAnswer: answerIdx });
            }
            return newMap;
        });
    }, []);

    const handleSubmit = useCallback((bankId: string, bank: QuestionBank) => {
        setBankStates(prev => {
            const newMap = new Map(prev);
            const state = newMap.get(bankId);
            if (!state || state.selectedAnswer === null) return prev;

            const section = bank.sections[state.activeSectionIndex];
            const currentQ = section.questions[state.currentQuestion];
            const isCorrect = state.selectedAnswer === currentQ.correctAnswer;

            const newScores = new Map(state.scores);
            const newAnswered = new Map(state.answeredQuestions);
            const sectionAnswered = new Set(newAnswered.get(section.type) || []);

            if (isCorrect && !sectionAnswered.has(state.currentQuestion)) {
                newScores.set(section.type, (newScores.get(section.type) || 0) + 1);
            }
            sectionAnswered.add(state.currentQuestion);
            newAnswered.set(section.type, sectionAnswered);

            newMap.set(bankId, {
                ...state,
                showResult: true,
                scores: newScores,
                answeredQuestions: newAnswered,
            });
            return newMap;
        });
    }, []);

    const handleNext = useCallback((bankId: string, bank: QuestionBank) => {
        setBankStates(prev => {
            const newMap = new Map(prev);
            const state = newMap.get(bankId);
            if (!state) return prev;

            const section = bank.sections[state.activeSectionIndex];

            if (state.currentQuestion < section.questions.length - 1) {
                // Next question in same section
                newMap.set(bankId, {
                    ...state,
                    currentQuestion: state.currentQuestion + 1,
                    selectedAnswer: null,
                    showResult: false,
                });
            } else if (state.activeSectionIndex < bank.sections.length - 1) {
                // Move to next section
                newMap.set(bankId, {
                    ...state,
                    activeSectionIndex: state.activeSectionIndex + 1,
                    currentQuestion: 0,
                    selectedAnswer: null,
                    showResult: false,
                });
            } else {
                // All sections complete - save to database
                newMap.set(bankId, { ...state, isComplete: true });

                // Save attempt to database asynchronously
                (async () => {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        // Calculate totals
                        let totalCorrect = 0;
                        let totalQuestions = 0;
                        const answersRecord: Record<string, { answer: number; correct: boolean }> = {};

                        bank.sections.forEach(section => {
                            const sectionScore = state.scores.get(section.type) || 0;
                            totalCorrect += sectionScore;
                            totalQuestions += section.questions.length;

                            section.questions.forEach((q, idx) => {
                                const answered = state.answeredQuestions.get(section.type);
                                if (answered?.has(idx)) {
                                    answersRecord[q.id] = {
                                        answer: state.selectedAnswer ?? -1,
                                        correct: sectionScore > 0
                                    };
                                }
                            });
                        });

                        // Upsert attempt using RPC function
                        const { error: rpcError } = await (supabase as any).rpc('save_question_bank_attempt', {
                            p_question_bank_id: bankId,
                            p_answers: answersRecord,
                            p_correct_count: totalCorrect,
                            p_total_count: totalQuestions,
                        });

                        if (rpcError) {
                            // Fallback: Try direct insert if RPC doesn't exist
                            const { error: insertError } = await (supabase as any)
                                .from('question_bank_attempts')
                                .upsert({
                                    question_bank_id: bankId,
                                    student_id: user.id,
                                    answers: answersRecord,
                                    correct_count: totalCorrect,
                                    total_count: totalQuestions,
                                    status: 'completed',
                                    completed_at: new Date().toISOString(),
                                }, {
                                    onConflict: 'question_bank_id,student_id'
                                });

                            if (insertError) {
                                logger.error("Direct insert also failed", { data: { error: insertError } });
                                throw insertError;
                            }
                        }

                        logger.info("Question bank attempt saved", { context: "LessonPage", data: { bankId, totalCorrect, totalQuestions } });
                    } catch (err) {
                        logger.error("Failed to save question bank attempt", { data: { error: err } });
                    }
                })();
            }
            return newMap;
        });
    }, []);

    const handleRestart = useCallback((bankId: string, bank: QuestionBank) => {
        const scores = new Map<string, number>();
        const answeredQuestions = new Map<string, Set<number>>();
        bank.sections.forEach(s => {
            scores.set(s.type, 0);
            answeredQuestions.set(s.type, new Set());
        });

        updateBankState(bankId, {
            activeSectionIndex: 0,
            currentQuestion: 0,
            selectedAnswer: null,
            showResult: false,
            scores,
            answeredQuestions,
            isComplete: false,
        });
    }, [updateBankState]);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    const totalQuestions = banks.reduce((acc, b) => acc + b.sections.reduce((a, s) => a + s.questions.length, 0), 0);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex items-center justify-center" dir={direction}>
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0f]" dir={direction}>
                <Navbar />
                <main className="container mx-auto px-4 py-20 text-center flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error || t.lessonNotFound}</h1>
                    <Link href={`/${subject}`} className="text-primary-600 hover:underline">{t.backToLessons}</Link>
                </main>
                <Footer />
            </div>
        );
    }

    if (banks.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir={direction}>
                <Navbar />
                <main className="container mx-auto px-4 py-20 text-center max-w-2xl flex-1">
                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-8 border border-gray-200/60 dark:border-[#2e2e3a]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Target className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h2>
                        <p className="text-gray-500 mb-6">{t.noQuestionsAdded}</p>
                        <Link href={`/${subject}`} className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary-600 text-white font-medium">
                            <BackArrow className="h-4 w-4" />{t.backToLessons}
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir={direction}>
            <Navbar />
            <main className="relative z-10 flex-1">
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-4xl">
                    {/* Back Link */}
                    <motion.div initial={{ opacity: 0, x: isArabic ? 10 : -10 }} animate={{ opacity: 1, x: 0 }}>
                        <Link href={`/${subject}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm mb-6">
                            <BackArrow className="h-4 w-4" />{t.backToLessons}
                        </Link>
                    </motion.div>

                    {/* Lesson Header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                                {isArabic ? <FileText className="h-6 w-6 text-white" /> : <BookOpen className="h-6 w-6 text-white" />}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{lesson.title}</h1>
                                {lesson.description && <p className="text-gray-600 dark:text-gray-400 text-sm">{lesson.description}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Target className="h-4 w-4" />{totalQuestions} {t.question}</span>
                            <span>•</span>
                            <span>{banks.length} {t.group}</span>
                        </div>
                    </motion.div>

                    {/* Question Banks */}
                    <div className="space-y-6">
                        {banks.map((bank, bankIdx) => {
                            const state = bankStates.get(bank.bankId);
                            if (!state) return null;

                            const activeSection = bank.sections[state.activeSectionIndex];
                            const currentQ = activeSection?.questions[state.currentQuestion];

                            // Calculate total score
                            let totalScore = 0;
                            let totalAnswered = 0;
                            state.scores.forEach(v => { totalScore += v; });
                            state.answeredQuestions.forEach(s => { totalAnswered += s.size; });
                            const totalQ = bank.sections.reduce((a, s) => a + s.questions.length, 0);
                            const pct = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;

                            return (
                                <motion.div
                                    key={bank.bankId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: bankIdx * 0.1 }}
                                    className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-[#2e2e3a] shadow-lg overflow-hidden"
                                >
                                    {/* Bank Header */}
                                    <button
                                        onClick={() => toggleBank(bank.bankId)}
                                        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                                                {bankIdx + 1}
                                            </div>
                                            <div className={isArabic ? "text-right" : "text-left"}>
                                                <h3 className="font-bold text-lg">{bank.bankTitle}</h3>
                                                <div className="flex items-center gap-2 text-xs text-white/80">
                                                    <span>{totalQ} {t.question}</span>
                                                    <span>•</span>
                                                    <span>{bank.sections.length} أقسام</span>
                                                    {bank.mediaType === 'reading' && <span className="px-2 py-0.5 rounded bg-white/20">📖 {t.readingText}</span>}
                                                    {bank.mediaType === 'poetry' && <span className="px-2 py-0.5 rounded bg-white/20">🎭 {t.poetry}</span>}
                                                    {state.isComplete && <span className="px-2 py-0.5 rounded bg-green-400/30">✓ {pct}%</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {state.isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                                    </button>

                                    {/* Bank Content */}
                                    <AnimatePresence>
                                        {state.isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <div className="p-5 space-y-5">
                                                    {/* Reading Content */}
                                                    {bank.mediaType === 'reading' && bank.mediaText && (
                                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                                <h4 className="font-bold text-emerald-800 dark:text-emerald-200">{bank.mediaTitle || t.readingText}</h4>
                                                            </div>
                                                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{bank.mediaText}</p>
                                                        </div>
                                                    )}

                                                    {/* Poetry Content */}
                                                    {bank.mediaType === 'poetry' && bank.mediaVerses.length > 0 && (
                                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="text-xl">🎭</span>
                                                                <h4 className="font-bold text-amber-800 dark:text-amber-200">{bank.mediaTitle || t.poetry}</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {bank.mediaVerses.map((verse, idx) => (
                                                                    <div key={idx} className="flex items-center justify-center gap-4 py-1 text-gray-800 dark:text-gray-200">
                                                                        <span className="flex-1 text-left">{verse.first}</span>
                                                                        <span className="text-amber-500 font-bold">⋯</span>
                                                                        <span className="flex-1 text-right">{verse.second}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Quiz Content */}
                                                    {!state.isComplete ? (
                                                        <>
                                                            {/* Section Tabs */}
                                                            <div className="flex gap-2 flex-wrap">
                                                                {bank.sections.map((section, idx) => {
                                                                    const sectionAnswered = state.answeredQuestions.get(section.type)?.size || 0;
                                                                    const isActive = idx === state.activeSectionIndex;
                                                                    const isDone = sectionAnswered === section.questions.length;

                                                                    return (
                                                                        <button
                                                                            key={section.type}
                                                                            onClick={() => switchSection(bank.bankId, idx)}
                                                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                                                                ? 'bg-indigo-500 text-white shadow-lg'
                                                                                : isDone
                                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                                                }`}
                                                                        >
                                                                            {isDone && <CheckCircle2 className="h-4 w-4" />}
                                                                            {section.typeLabel}
                                                                            <span className="text-xs opacity-70">({section.questions.length})</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Current Section Content */}
                                                            {activeSection && currentQ && (
                                                                <div className="space-y-4 pt-2">
                                                                    {/* Progress */}
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <button
                                                                            onClick={() => updateBankState(bank.bankId, {
                                                                                currentQuestion: state.currentQuestion - 1,
                                                                                selectedAnswer: null,
                                                                                showResult: false,
                                                                            })}
                                                                            disabled={state.currentQuestion === 0}
                                                                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                                        >
                                                                            <BackArrow className="h-5 w-5" />
                                                                        </button>

                                                                        <div className="flex-1 text-center">
                                                                            <span className="text-sm text-gray-500">
                                                                                {t.questionOf.replace('{current}', String(state.currentQuestion + 1)).replace('{total}', String(activeSection.questions.length))}
                                                                            </span>
                                                                            <div className="text-xs font-semibold text-primary-600">
                                                                                {t.score}: {state.scores.get(activeSection.type) || 0}/{state.answeredQuestions.get(activeSection.type)?.size || 0}
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => updateBankState(bank.bankId, {
                                                                                currentQuestion: state.currentQuestion + 1,
                                                                                selectedAnswer: null,
                                                                                showResult: false,
                                                                            })}
                                                                            disabled={state.currentQuestion >= activeSection.questions.length - 1}
                                                                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                                        >
                                                                            <ForwardArrow className="h-5 w-5" />
                                                                        </button>
                                                                    </div>

                                                                    {/* Progress Bar */}
                                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                                                                            animate={{ width: `${((state.currentQuestion + 1) / activeSection.questions.length) * 100}%` }}
                                                                        />
                                                                    </div>

                                                                    {/* Question */}
                                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentQ.question}</h2>

                                                                    {/* Options */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        {currentQ.options.map((opt, i) => {
                                                                            let cls = "border-gray-200 dark:border-gray-700 hover:border-primary-400";
                                                                            if (state.showResult) {
                                                                                if (i === currentQ.correctAnswer) cls = "border-green-500 bg-green-50 dark:bg-green-900/20";
                                                                                else if (i === state.selectedAnswer) cls = "border-red-500 bg-red-50 dark:bg-red-900/20";
                                                                            } else if (state.selectedAnswer === i) {
                                                                                cls = "border-primary-500 bg-primary-50 dark:bg-primary-900/20";
                                                                            }

                                                                            return (
                                                                                <button
                                                                                    key={i}
                                                                                    onClick={() => handleAnswerSelect(bank.bankId, i)}
                                                                                    disabled={state.showResult}
                                                                                    className={`w-full ${isArabic ? 'text-right' : 'text-left'} p-4 rounded-xl border-2 transition-all ${cls}`}
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold shrink-0">
                                                                                            {String.fromCharCode(65 + i)}
                                                                                        </span>
                                                                                        <span className="flex-1 text-gray-900 dark:text-white">{opt}</span>
                                                                                        {state.showResult && i === currentQ.correctAnswer && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                                                                        {state.showResult && i === state.selectedAnswer && i !== currentQ.correctAnswer && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {/* Explanation */}
                                                                    <AnimatePresence>
                                                                        {state.showResult && currentQ.explanation && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, height: 0 }}
                                                                                animate={{ opacity: 1, height: "auto" }}
                                                                                exit={{ opacity: 0, height: 0 }}
                                                                                className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                                                            >
                                                                                <p className="text-sm text-blue-800 dark:text-blue-200"><b>{t.explanation}:</b> {currentQ.explanation}</p>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>

                                                                    {/* Actions */}
                                                                    <div className="flex gap-3">
                                                                        {!state.showResult ? (
                                                                            <button
                                                                                onClick={() => handleSubmit(bank.bankId, bank)}
                                                                                disabled={state.selectedAnswer === null}
                                                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold disabled:opacity-50"
                                                                            >
                                                                                {t.confirm}
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleNext(bank.bankId, bank)}
                                                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold"
                                                                            >
                                                                                {state.currentQuestion < activeSection.questions.length - 1 ? (
                                                                                    <>{t.next}<ChevronLeft className={`h-4 w-4 ${!isArabic && 'rotate-180'}`} /></>
                                                                                ) : state.activeSectionIndex < bank.sections.length - 1 ? (
                                                                                    <>{t.nextSection}<ChevronLeft className={`h-4 w-4 ${!isArabic && 'rotate-180'}`} /></>
                                                                                ) : (
                                                                                    <><Trophy className="h-4 w-4" />{t.result}</>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        /* Bank Complete - Final Score */
                                                        <div className="text-center py-6">
                                                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                                                                <Trophy className="h-10 w-10 text-white" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.wellDone}</h3>
                                                            <div className="text-4xl font-extrabold text-primary-600 mb-2">{pct}%</div>
                                                            <p className="text-gray-500 mb-4">{t.correctOf.replace('{score}', String(totalScore)).replace('{total}', String(totalQ))}</p>

                                                            {/* Section breakdown */}
                                                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                                                {bank.sections.map((section) => {
                                                                    const sectionScore = state.scores.get(section.type) || 0;
                                                                    return (
                                                                        <span key={section.type} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
                                                                            {section.typeLabel}: {sectionScore}/{section.questions.length}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>

                                                            <button
                                                                onClick={() => handleRestart(bank.bankId, bank)}
                                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />{t.retry}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Back to lessons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center"
                    >
                        <Link href={`/${subject}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <BackArrow className="h-4 w-4" />
                            {t.backToLessonsList}
                        </Link>
                    </motion.div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
