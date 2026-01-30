'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║           TEACHER EXAM SECTION PLAYER - مشغل امتحان المدرس بالأقسام        ║
 * ║                                                                          ║
 * ║  يعرض كل قسم من الامتحان مع جميع أسئلته، مع إمكانية التنقل بين الأقسام      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Send,
    BookOpen,
    Loader2,
    FileText,
    Target,
    Award,
    Layers,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExamSubsection {
    id?: string;
    title?: string;
    type?: string;
    questions?: ExamQuestion[];
}

export interface ExamBlock {
    id?: string;
    titleAr?: string;
    titleEn?: string;
    type?: string;
    questions?: ExamQuestion[];
    subsections?: ExamSubsection[];
    bodyText?: string;
    readingText?: string;
    readingTitle?: string;
    title?: string;
    genre?: string;
    contentType?: 'none' | 'reading' | 'poetry';
    verses?: string[];
    poetryVerses?: { firstHalf: string; secondHalf: string }[];
    poet?: string;
    poemTitle?: string;
    poetryTitle?: string;
}

export interface TeacherExamOption {
    textAr?: string;
    textEn?: string;
    isCorrect?: boolean;
    id?: string;
    text?: string;
}

export interface ExamQuestion {
    id: string;
    type: string;
    text?: string;
    textAr?: string;
    textEn?: string;
    options?: string[] | { id: string; text: string }[] | TeacherExamOption[];
    correctAnswer?: string | number;
    correctOptionId?: string;
    points?: number;
    difficulty?: string;
    underlinedWord?: string;
    blankTextAr?: string;
    blankTextEn?: string;
    correctAnswerAr?: string;
    correctAnswerEn?: string;
    extractionTarget?: string;
    explanationAr?: string;
    explanationEn?: string;
}

export interface TeacherExamSectionPlayerProps {
    examId: string;
    language: 'arabic' | 'english';
    onComplete?: (results: ExamResults) => void;
}

export interface ExamResults {
    totalScore: number;
    maxScore: number;
    percentage: number;
    answers: Record<string, unknown>;
    timeSpent: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TeacherExamSectionPlayer({
    examId,
    language,
    onComplete,
}: TeacherExamSectionPlayerProps) {
    const router = useRouter();
    const isRTL = language === 'arabic';

    // State
    const [exam, setExam] = useState<{
        id: string;
        title: string;
        description?: string;
        duration?: number;
        totalMarks?: number;
        blocks: ExamBlock[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startTime] = useState(Date.now());

    const blocks: ExamBlock[] = exam?.blocks || [];
    const currentSection = blocks[currentSectionIndex];
    const totalSections = blocks.length;

    // Get all questions from a block (handles both direct questions and subsections)
    const getBlockQuestions = useCallback((block: ExamBlock): ExamQuestion[] => {
        if (!block) return [];
        if (block.questions && block.questions.length > 0) {
            return block.questions;
        }
        if (block.subsections && block.subsections.length > 0) {
            return block.subsections.flatMap(sub => sub.questions || []);
        }
        return [];
    }, []);

    const currentSectionQuestions = getBlockQuestions(currentSection);
    const totalQuestions = blocks.reduce((sum, b) => sum + getBlockQuestions(b).length, 0);
    const answeredCount = Object.keys(answers).length;

    // Labels
    const labels = {
        loading: isRTL ? 'جاري تحميل الامتحان...' : 'Loading exam...',
        error: isRTL ? 'حدث خطأ في تحميل الامتحان' : 'Error loading exam',
        nextSection: isRTL ? 'القسم التالي' : 'Next Section',
        previousSection: isRTL ? 'القسم السابق' : 'Previous Section',
        submit: isRTL ? 'إرسال الامتحان' : 'Submit Exam',
        submitting: isRTL ? 'جاري الإرسال...' : 'Submitting...',
        section: isRTL ? 'القسم' : 'Section',
        of: isRTL ? 'من' : 'of',
        question: isRTL ? 'سؤال' : 'Question',
        questions: isRTL ? 'أسئلة' : 'questions',
        answered: isRTL ? 'تمت الإجابة' : 'Answered',
        remaining: isRTL ? 'متبقي' : 'Remaining',
        readingPassage: isRTL ? 'نص القراءة' : 'Reading Passage',
        poetry: isRTL ? 'نص شعري' : 'Poetry',
        points: isRTL ? 'درجة' : 'pts',
    };

    // Question type labels
    const questionTypeLabels: Record<string, { ar: string; en: string }> = {
        mcq: { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
        multiple_choice: { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
        true_false: { ar: 'صح أم خطأ', en: 'True or False' },
        essay: { ar: 'سؤال مقالي', en: 'Essay Question' },
        parsing: { ar: 'أعرب ما تحته خط', en: 'Parsing' },
        fill_blank: { ar: 'أكمل الفراغ', en: 'Fill in the Blank' },
        extraction: { ar: 'استخراج', en: 'Extraction' },
    };

    // Fetch exam data
    useEffect(() => {
        const fetchExam = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const { data, error: fetchError } = await supabase
                    .from('teacher_exams')
                    .select('*')
                    .eq('id', examId)
                    .single();

                if (fetchError) throw fetchError;

                const examData = data as {
                    id: string;
                    title?: string;
                    exam_title?: string;
                    description?: string;
                    exam_description?: string;
                    duration_minutes?: number;
                    total_marks?: number;
                    blocks?: ExamBlock[];
                    sections?: ExamBlock[];
                };

                setExam({
                    id: examData.id,
                    title: examData.title || examData.exam_title || '',
                    description: examData.description || examData.exam_description,
                    duration: examData.duration_minutes,
                    totalMarks: examData.total_marks,
                    blocks: examData.blocks || examData.sections || [],
                });

                if (examData.duration_minutes) {
                    setTimeRemaining(examData.duration_minutes * 60);
                }
            } catch (err) {
                logger.error('Error fetching exam', { context: 'TeacherExamSectionPlayer', data: err });
                setError(labels.error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExam();
    }, [examId]);

    // Timer
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Format time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle answer
    const handleAnswer = useCallback((questionId: string, answer: unknown) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    }, []);

    // Navigation
    const goToNextSection = () => {
        if (currentSectionIndex < totalSections - 1) {
            setCurrentSectionIndex((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToPreviousSection = () => {
        if (currentSectionIndex > 0) {
            setCurrentSectionIndex((prev) => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const isLastSection = currentSectionIndex === totalSections - 1;
    const isFirstSection = currentSectionIndex === 0;

    // Get correct answer index for MCQ
    const getCorrectAnswerIndex = (q: ExamQuestion): number => {
        if (q.correctAnswer !== undefined) {
            return typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(String(q.correctAnswer), 10);
        }
        if (q.options && Array.isArray(q.options)) {
            const idx = (q.options as TeacherExamOption[]).findIndex(opt =>
                typeof opt === 'object' && opt.isCorrect === true
            );
            if (idx !== -1) return idx;
        }
        return -1;
    };

    // Submit exam
    const handleSubmit = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            let totalScore = 0;
            let maxScore = 0;

            blocks.forEach((block) => {
                const blockQuestions = getBlockQuestions(block);
                blockQuestions.forEach((q) => {
                    const points = q.points || 1;
                    maxScore += points;

                    const userAnswer = answers[q.id];

                    if (q.type === 'mcq' || q.type === 'multiple_choice' || q.type === 'true_false') {
                        const correctIdx = getCorrectAnswerIndex(q);
                        if (userAnswer !== undefined && Number(userAnswer) === correctIdx) {
                            totalScore += points;
                        }
                    } else if (userAnswer !== undefined) {
                        const correctAnswer = isRTL
                            ? (q.correctAnswerAr || q.correctAnswerEn || q.correctAnswer)
                            : (q.correctAnswerEn || q.correctAnswerAr || q.correctAnswer);
                        if (correctAnswer && String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()) {
                            totalScore += points;
                        }
                    }
                });
            });

            const results: ExamResults = {
                totalScore,
                maxScore,
                percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                answers,
                timeSpent: Math.floor((Date.now() - startTime) / 1000),
            };

            if (onComplete) {
                onComplete(results);
            } else {
                router.push(`/${language}/teacher-exam/${examId}/results`);
            }
        } catch (err) {
            logger.error('Error submitting exam', { context: 'TeacherExamSectionPlayer', data: err });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get option text
    const getOptionText = (option: string | TeacherExamOption | { id: string; text: string }): string => {
        if (typeof option === 'string') return option;
        if ('text' in option && option.text) return option.text;
        if ('textAr' in option || 'textEn' in option) {
            return isRTL ? (option.textAr || option.textEn || '') : (option.textEn || option.textAr || '');
        }
        return '';
    };

    // Render single question
    const renderQuestion = (q: ExamQuestion, index: number) => {
        const questionText = q.text || (isRTL ? q.textAr : q.textEn) || (isRTL ? q.textEn : q.textAr) || '';
        const userAnswer = answers[q.id];
        const typeLabel = questionTypeLabels[q.type] || { ar: q.type, en: q.type };

        return (
            <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6 shadow-sm hover:shadow-md transition-shadow"
            >
                {/* Question Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-[#2e2e3a]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-bold">
                            {index + 1}
                        </span>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-[#2e2e3a] text-gray-600 dark:text-gray-400">
                            {isRTL ? typeLabel.ar : typeLabel.en}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {q.difficulty && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                    q.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }`}>
                                {isRTL ? (q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'hard' ? 'صعب' : 'متوسط') : q.difficulty}
                            </span>
                        )}
                        {q.points && (
                            <span className="text-xs text-primary-500 font-medium">
                                {q.points} {labels.points}
                            </span>
                        )}
                        {userAnswer !== undefined && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                    </div>
                </div>

                {/* Special Question Types */}
                {q.type === 'parsing' && q.underlinedWord && (
                    <div className="p-4 mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                            {isRTL ? 'أعرب الكلمة التالية:' : 'Parse the following word:'}
                        </p>
                        <p className="text-xl font-bold text-amber-900 dark:text-amber-100 underline decoration-2">
                            {q.underlinedWord}
                        </p>
                    </div>
                )}

                {q.type === 'fill_blank' && (q.blankTextAr || q.blankTextEn) && (
                    <div className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            {isRTL ? 'أكمل الفراغ في الجملة التالية:' : 'Complete the blank:'}
                        </p>
                        <p className="text-lg text-blue-900 dark:text-blue-100">
                            {isRTL ? (q.blankTextAr || q.blankTextEn) : (q.blankTextEn || q.blankTextAr)}
                        </p>
                    </div>
                )}

                {q.type === 'extraction' && q.extractionTarget && (
                    <div className="p-4 mb-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                            {isRTL ? 'استخرج من النص:' : 'Extract from the text:'}
                        </p>
                        <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                            {q.extractionTarget}
                        </p>
                    </div>
                )}

                {/* Question Text */}
                {questionText && (
                    <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed mb-4">
                        {questionText}
                    </p>
                )}

                {/* MCQ / True-False Options */}
                {(q.type === 'mcq' || q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                    <div className="grid gap-2">
                        {(q.options as (string | TeacherExamOption | { id: string; text: string })[]).map((option, idx) => {
                            const optionText = getOptionText(option);
                            const isSelected = userAnswer === idx;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(q.id, idx)}
                                    className={`w-full p-3 text-start rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                                            : 'border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-[#2e2e3a]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isSelected
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className={isSelected ? 'text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                                            {optionText}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Essay/Text Input */}
                {(q.type === 'essay' || q.type === 'maqali' || q.type === 'text' || q.type === 'parsing' || q.type === 'fill_blank' || q.type === 'extraction') && (
                    <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                            {isRTL ? 'إجابتك:' : 'Your answer:'}
                        </label>
                        <textarea
                            value={(userAnswer as string) || ''}
                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                            placeholder={isRTL ? 'اكتب إجابتك هنا...' : 'Write your answer here...'}
                            className="w-full h-28 p-4 bg-gray-50 dark:bg-[#0f0f12] border border-gray-200 dark:border-[#2e2e3a] rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                    </div>
                )}
            </motion.div>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f0f12] dark:to-[#1c1c24]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">{labels.loading}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f0f12] dark:to-[#1c1c24]">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f0f12] dark:to-[#1c1c24]"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#1c1c24]/90 backdrop-blur-xl border-b border-gray-200 dark:border-[#2e2e3a] shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {exam?.title}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {labels.section} {currentSectionIndex + 1} {labels.of} {totalSections}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Progress Stats */}
                            <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#2e2e3a]">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {answeredCount}/{totalQuestions}
                                    </span>
                                </div>
                            </div>

                            {/* Timer */}
                            {timeRemaining !== null && (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-semibold ${timeRemaining < 300
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                                        : 'bg-gray-100 text-gray-700 dark:bg-[#2e2e3a] dark:text-gray-300'
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(timeRemaining)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Progress Bar */}
                    <div className="mt-4 flex items-center gap-2">
                        {blocks.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setCurrentSectionIndex(idx);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`flex-1 h-2 rounded-full transition-all ${idx === currentSectionIndex
                                        ? 'bg-primary-500'
                                        : idx < currentSectionIndex
                                            ? 'bg-green-500'
                                            : 'bg-gray-200 dark:bg-[#2e2e3a]'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSectionIndex}
                        initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Section Header */}
                        {currentSection && (
                            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {isRTL ? currentSection.titleAr : currentSection.titleEn || currentSection.titleAr || `${labels.section} ${currentSectionIndex + 1}`}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {currentSectionQuestions.length} {labels.questions}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                                        <Target className="w-4 h-4 text-primary-500" />
                                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                            {currentSectionQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} {labels.points}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reading Passage */}
                        {(currentSection?.bodyText || (currentSection?.contentType === 'reading' && currentSection?.readingText)) && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="font-semibold text-blue-800 dark:text-blue-300">
                                        {currentSection?.readingTitle || labels.readingPassage}
                                    </span>
                                </div>
                                <div className="prose prose-blue dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap leading-relaxed text-blue-900 dark:text-blue-100">
                                        {currentSection.bodyText || currentSection.readingText}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Poetry Section */}
                        {currentSection?.contentType === 'poetry' && currentSection?.poetryVerses && currentSection.poetryVerses.length > 0 && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="font-semibold text-purple-800 dark:text-purple-300">
                                        {currentSection?.poetryTitle || labels.poetry}
                                    </span>
                                </div>
                                <div className="space-y-3 text-center">
                                    {currentSection.poetryVerses.map((verse, idx) => (
                                        <div key={idx} className="flex justify-center gap-8 text-lg leading-relaxed text-purple-900 dark:text-purple-100">
                                            <span>{verse.firstHalf}</span>
                                            <span className="text-purple-400">***</span>
                                            <span>{verse.secondHalf}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Questions List */}
                        <div className="space-y-4">
                            {currentSectionQuestions.map((q, idx) => renderQuestion(q, idx))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1c1c24]/90 backdrop-blur-xl border-t border-gray-200 dark:border-[#2e2e3a] shadow-lg">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={goToPreviousSection}
                            disabled={isFirstSection}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#3e3e4a] transition-all"
                        >
                            {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            {labels.previousSection}
                        </button>

                        {/* Center Progress */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/20">
                                <Award className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {labels.answered}: {answeredCount}/{totalQuestions}
                                </span>
                            </div>
                        </div>

                        {isLastSection ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium disabled:opacity-50 transition-all shadow-lg shadow-green-500/25"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {labels.submitting}
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {labels.submit}
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={goToNextSection}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
                            >
                                {labels.nextSection}
                                {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
