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
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface QuestionGroup {
    groupId: string;
    sectionTitle: string;
    mediaType: 'reading' | 'poetry' | null;
    mediaTitle?: string;
    mediaText?: string;
    mediaVerses?: { first: string; second: string }[];
    questions: Question[];
}

interface Lesson {
    id: string;
    title: string;
    description: string;
}

interface GroupState {
    currentQuestion: number;
    selectedAnswer: number | null;
    showResult: boolean;
    score: number;
    answeredQuestions: Set<number>;
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
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LessonPageComponent({ lessonId, subject }: LessonPageProps) {
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
    const [groupStates, setGroupStates] = useState<Map<string, GroupState>>(new Map());
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
                // 1. Fetch Lesson Details
                const { data: lessonData, error: lessonError } = await supabase
                    .from('lessons')
                    .select('id, title, description')
                    .eq('id', lessonId)
                    .single();

                if (lessonError) throw lessonError;
                if (!lessonData) throw new Error(t.lessonNotFound);

                setLesson({
                    id: lessonData.id,
                    title: typeof lessonData.title === 'object' && lessonData.title !== null
                        ? ((lessonData.title as unknown as Record<string, string>)?.[langKey] || (lessonData.title as unknown as Record<string, string>)?.ar || '')
                        : (lessonData.title as string) || '',
                    description: typeof lessonData.description === 'object' && lessonData.description !== null
                        ? ((lessonData.description as unknown as Record<string, string>)?.[langKey] || (lessonData.description as unknown as Record<string, string>)?.ar || '')
                        : (lessonData.description as string) || '',
                });

                // 2. Fetch Questions from Question Bank
                const { data: questionsData, error: questionsError } = await supabase
                    .from('lesson_questions')
                    .select('*')
                    .eq('lesson_id', lessonId)
                    .eq('is_active', true)
                    .order('order_index', { ascending: true });

                if (questionsError) throw questionsError;

                if (!questionsData || questionsData.length === 0) {
                    setQuestionGroups([]);
                    return;
                }

                // 3. Group questions by group_id
                const groupMap = new Map<string, any[]>();
                questionsData.forEach((q: any) => {
                    const groupKey = q.group_id ||
                        `${(q.section_title?.[langKey] || q.section_title?.ar || 'General')}_${q.created_at?.split('T')[0] || 'unknown'}`;

                    if (!groupMap.has(groupKey)) {
                        groupMap.set(groupKey, []);
                    }
                    groupMap.get(groupKey)!.push(q);
                });

                // 4. Build QuestionGroup array
                const groups: QuestionGroup[] = [];
                const initialStates = new Map<string, GroupState>();

                groupMap.forEach((rawQuestions, groupKey) => {
                    const firstQ = rawQuestions[0];

                    // Section title
                    const sectionTitle = typeof firstQ.section_title === 'object'
                        ? firstQ.section_title[langKey] || firstQ.section_title.ar || (isArabic ? 'أسئلة' : 'Questions')
                        : firstQ.section_title || (isArabic ? 'أسئلة' : 'Questions');

                    // Media content
                    let mediaType: 'reading' | 'poetry' | null = null;
                    let mediaTitle = '';
                    let mediaText = '';
                    let mediaVerses: { first: string; second: string }[] = [];

                    if (firstQ.media?.content) {
                        const media = firstQ.media.content;
                        if (media.type === 'reading') {
                            mediaType = 'reading';
                            mediaTitle = media.title || '';
                            mediaText = media.text || '';
                        } else if (media.type === 'poetry') {
                            mediaType = 'poetry';
                            mediaTitle = media.title || '';
                            mediaVerses = media.verses || [];
                        }
                    }

                    // Transform questions
                    const questions: Question[] = rawQuestions.map((q: any) => {
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

                        return { id: q.id, question: questionText, options, correctAnswer: correctAnswerIndex, explanation };
                    });

                    groups.push({
                        groupId: groupKey,
                        sectionTitle,
                        mediaType,
                        mediaTitle,
                        mediaText,
                        mediaVerses,
                        questions,
                    });

                    // Initialize group state
                    initialStates.set(groupKey, {
                        currentQuestion: 0,
                        selectedAnswer: null,
                        showResult: false,
                        score: 0,
                        answeredQuestions: new Set(),
                        isComplete: false,
                        isExpanded: groups.length === 1,
                    });
                });

                setQuestionGroups(groups);
                setGroupStates(initialStates);

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
    // GROUP STATE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const updateGroupState = useCallback((groupId: string, updates: Partial<GroupState>) => {
        setGroupStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(groupId);
            if (current) {
                newMap.set(groupId, { ...current, ...updates });
            }
            return newMap;
        });
    }, []);

    const toggleGroup = useCallback((groupId: string) => {
        setGroupStates(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(groupId);
            if (current) {
                newMap.set(groupId, { ...current, isExpanded: !current.isExpanded });
            }
            return newMap;
        });
    }, []);

    const handleAnswerSelect = useCallback((groupId: string, answerIdx: number) => {
        setGroupStates(prev => {
            const newMap = new Map(prev);
            const state = newMap.get(groupId);
            if (state && !state.showResult) {
                newMap.set(groupId, { ...state, selectedAnswer: answerIdx });
            }
            return newMap;
        });
    }, []);

    const handleSubmit = useCallback((groupId: string, group: QuestionGroup) => {
        setGroupStates(prev => {
            const newMap = new Map(prev);
            const state = newMap.get(groupId);
            if (!state || state.selectedAnswer === null) return prev;

            const currentQ = group.questions[state.currentQuestion];
            const isCorrect = state.selectedAnswer === currentQ.correctAnswer;
            const newAnswered = new Set(state.answeredQuestions).add(state.currentQuestion);

            newMap.set(groupId, {
                ...state,
                showResult: true,
                score: isCorrect && !state.answeredQuestions.has(state.currentQuestion)
                    ? state.score + 1
                    : state.score,
                answeredQuestions: newAnswered,
            });
            return newMap;
        });
    }, []);

    const handleNext = useCallback((groupId: string, group: QuestionGroup) => {
        setGroupStates(prev => {
            const newMap = new Map(prev);
            const state = newMap.get(groupId);
            if (!state) return prev;

            if (state.currentQuestion < group.questions.length - 1) {
                newMap.set(groupId, {
                    ...state,
                    currentQuestion: state.currentQuestion + 1,
                    selectedAnswer: null,
                    showResult: false,
                });
            } else {
                newMap.set(groupId, { ...state, isComplete: true });
            }
            return newMap;
        });
    }, []);

    const handleRestart = useCallback((groupId: string) => {
        updateGroupState(groupId, {
            currentQuestion: 0,
            selectedAnswer: null,
            showResult: false,
            score: 0,
            answeredQuestions: new Set(),
            isComplete: false,
        });
    }, [updateGroupState]);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    const totalQuestions = questionGroups.reduce((acc, g) => acc + g.questions.length, 0);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex items-center justify-center" dir={direction}>
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir={direction}>
                <Navbar />
                <main className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error || t.lessonNotFound}</h1>
                    <Link href={`/${subject}`} className="text-primary-600 hover:underline">{t.backToLessons}</Link>
                </main>
                <Footer />
            </div>
        );
    }

    if (questionGroups.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir={direction}>
                <Navbar />
                <main className="container mx-auto px-4 py-20 text-center max-w-2xl">
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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir={direction}>
            <Navbar />
            <main className="relative z-10">
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
                            <span>{questionGroups.length} {t.group}</span>
                        </div>
                    </motion.div>

                    {/* Question Groups */}
                    <div className="space-y-4">
                        {questionGroups.map((group, groupIdx) => {
                            const state = groupStates.get(group.groupId);
                            if (!state) return null;

                            const currentQ = group.questions[state.currentQuestion];
                            const pct = group.questions.length > 0 ? Math.round((state.score / group.questions.length) * 100) : 0;

                            return (
                                <motion.div
                                    key={group.groupId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: groupIdx * 0.1 }}
                                    className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm overflow-hidden"
                                >
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(group.groupId)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                {groupIdx + 1}
                                            </div>
                                            <div className={isArabic ? "text-right" : "text-left"}>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{group.sectionTitle}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{group.questions.length} {t.question}</span>
                                                    {group.mediaType === 'reading' && <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">📖 {t.readingText}</span>}
                                                    {group.mediaType === 'poetry' && <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">🎭 {t.poetry}</span>}
                                                    {state.isComplete && <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">✓ {pct}%</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {state.isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                    </button>

                                    {/* Group Content */}
                                    <AnimatePresence>
                                        {state.isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="p-4 sm:p-6 space-y-4">
                                                    {/* Reading Content */}
                                                    {group.mediaType === 'reading' && group.mediaText && (
                                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                                <h4 className="font-bold text-emerald-800 dark:text-emerald-200">{group.mediaTitle || t.readingText}</h4>
                                                            </div>
                                                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{group.mediaText}</p>
                                                        </div>
                                                    )}

                                                    {/* Poetry Content */}
                                                    {group.mediaType === 'poetry' && group.mediaVerses && group.mediaVerses.length > 0 && (
                                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="text-xl">🎭</span>
                                                                <h4 className="font-bold text-amber-800 dark:text-amber-200">{group.mediaTitle || t.poetry}</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {group.mediaVerses.map((verse, idx) => (
                                                                    <div key={idx} className="flex items-center justify-center gap-4 py-1 text-gray-800 dark:text-gray-200">
                                                                        <span className="flex-1 text-left">{verse.first}</span>
                                                                        <span className="text-amber-500 font-bold">⋯</span>
                                                                        <span className="flex-1 text-right">{verse.second}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Quiz */}
                                                    {!state.isComplete ? (
                                                        <>
                                                            {/* Progress & Question Navigation */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <button
                                                                    onClick={() => updateGroupState(group.groupId, {
                                                                        currentQuestion: state.currentQuestion - 1,
                                                                        selectedAnswer: null,
                                                                        showResult: false,
                                                                    })}
                                                                    disabled={state.currentQuestion === 0}
                                                                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                                    title={t.previousQuestion}
                                                                >
                                                                    <BackArrow className="h-5 w-5" />
                                                                </button>

                                                                <div className="flex-1 text-center">
                                                                    <span className="text-sm text-gray-500">
                                                                        {t.questionOf.replace('{current}', String(state.currentQuestion + 1)).replace('{total}', String(group.questions.length))}
                                                                    </span>
                                                                    <div className="text-xs font-semibold text-primary-600">{t.score}: {state.score}/{state.answeredQuestions.size}</div>
                                                                </div>

                                                                <button
                                                                    onClick={() => updateGroupState(group.groupId, {
                                                                        currentQuestion: state.currentQuestion + 1,
                                                                        selectedAnswer: null,
                                                                        showResult: false,
                                                                    })}
                                                                    disabled={state.currentQuestion >= group.questions.length - 1}
                                                                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                                    title={t.nextQuestion}
                                                                >
                                                                    <ForwardArrow className="h-5 w-5" />
                                                                </button>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                                                                    animate={{ width: `${((state.currentQuestion + 1) / group.questions.length) * 100}%` }}
                                                                />
                                                            </div>

                                                            {/* Question Dots Navigation */}
                                                            <div className="flex items-center justify-center gap-1 flex-wrap">
                                                                {group.questions.map((_, qIdx) => (
                                                                    <button
                                                                        key={qIdx}
                                                                        onClick={() => updateGroupState(group.groupId, {
                                                                            currentQuestion: qIdx,
                                                                            selectedAnswer: null,
                                                                            showResult: false,
                                                                        })}
                                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${qIdx === state.currentQuestion
                                                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                                                            : state.answeredQuestions.has(qIdx)
                                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                                            }`}
                                                                    >
                                                                        {qIdx + 1}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Question */}
                                                            {currentQ && (
                                                                <>
                                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentQ.question}</h2>

                                                                    {/* Options */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                                                                                    onClick={() => handleAnswerSelect(group.groupId, i)}
                                                                                    disabled={state.showResult}
                                                                                    className={`w-full ${isArabic ? 'text-right' : 'text-left'} p-3 rounded-xl border-2 transition-all ${cls}`}
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold shrink-0">
                                                                                            {String.fromCharCode(65 + i)}
                                                                                        </span>
                                                                                        <span className="flex-1 text-gray-900 dark:text-white text-sm line-clamp-2">{opt}</span>
                                                                                        {state.showResult && i === currentQ.correctAnswer && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                                                                                        {state.showResult && i === state.selectedAnswer && i !== currentQ.correctAnswer && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
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
                                                                                className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                                                            >
                                                                                <p className="text-sm text-blue-800 dark:text-blue-200"><b>{t.explanation}:</b> {currentQ.explanation}</p>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>

                                                                    {/* Actions */}
                                                                    <div className="flex gap-3">
                                                                        {!state.showResult ? (
                                                                            <button
                                                                                onClick={() => handleSubmit(group.groupId, group)}
                                                                                disabled={state.selectedAnswer === null}
                                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold disabled:opacity-50 text-sm"
                                                                            >
                                                                                {t.confirm}
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleNext(group.groupId, group)}
                                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm"
                                                                            >
                                                                                {state.currentQuestion < group.questions.length - 1 ? (
                                                                                    <>{t.next}<ChevronLeft className={`h-4 w-4 ${!isArabic && 'rotate-180'}`} /></>
                                                                                ) : (
                                                                                    <><Trophy className="h-4 w-4" />{t.result}</>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                        /* Group Complete */
                                                        <div className="text-center py-4">
                                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                                                <Trophy className="h-8 w-8 text-white" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t.wellDone}</h3>
                                                            <div className="text-3xl font-extrabold text-primary-600 mb-1">{pct}%</div>
                                                            <p className="text-gray-500 mb-4">{t.correctOf.replace('{score}', String(state.score)).replace('{total}', String(group.questions.length))}</p>
                                                            <button
                                                                onClick={() => handleRestart(group.groupId)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm"
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
