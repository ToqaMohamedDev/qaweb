'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                UNIFIED EXAM PLAYER - مشغل الامتحان الموحد                 ║
 * ║                                                                          ║
 * ║  مكون موحد لعرض الامتحانات يدعم العربية والإنجليزية                       ║
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
    // Teacher exam structure - questions are in subsections
    subsections?: ExamSubsection[];
    // Reading passage
    bodyText?: string;
    readingText?: string;
    readingTitle?: string;
    title?: string;
    genre?: string;
    contentType?: 'none' | 'reading' | 'poetry';
    // Poetry
    verses?: string[];
    poetryVerses?: { firstHalf: string; secondHalf: string }[];
    poet?: string;
    poemTitle?: string;
    poetryTitle?: string;
}

// Option type for teacher exams
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
    // Special question types
    underlinedWord?: string;      // للإعراب
    blankTextAr?: string;         // للفراغات
    blankTextEn?: string;
    correctAnswerAr?: string;     // الإجابة الصحيحة
    correctAnswerEn?: string;
    extractionTarget?: string;    // للاستخراج
    explanationAr?: string;
    explanationEn?: string;
}

export interface UnifiedExamPlayerProps {
    examId: string;
    language: 'arabic' | 'english';
    isTeacherExam?: boolean;
    onComplete?: (results: ExamResults) => void;
}

export interface ExamResults {
    totalScore: number;
    maxScore: number;
    percentage: number;
    answers: Record<string, any>;
    timeSpent: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function UnifiedExamPlayer({
    examId,
    language,
    isTeacherExam = false,
    onComplete,
}: UnifiedExamPlayerProps) {
    const router = useRouter();
    const isRTL = language === 'arabic';

    // State
    const [exam, setExam] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const blocks: ExamBlock[] = exam?.blocks || exam?.sections || [];
    const currentBlock = blocks[currentBlockIndex];
    
    // Handle both structures:
    // 1. Direct questions: blocks[].questions[]
    // 2. Teacher exam with subsections: blocks[].subsections[].questions[]
    const getBlockQuestions = (block: ExamBlock): ExamQuestion[] => {
        if (!block) return [];
        // If block has direct questions, use them
        if (block.questions && block.questions.length > 0) {
            return block.questions;
        }
        // If block has subsections, flatten all questions from subsections
        if (block.subsections && block.subsections.length > 0) {
            return block.subsections.flatMap(sub => sub.questions || []);
        }
        return [];
    };
    
    const questions = getBlockQuestions(currentBlock);
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = blocks.reduce((sum, b) => sum + getBlockQuestions(b).length, 0);

    // Labels
    const labels = {
        loading: isRTL ? 'جاري تحميل الامتحان...' : 'Loading exam...',
        error: isRTL ? 'حدث خطأ في تحميل الامتحان' : 'Error loading exam',
        next: isRTL ? 'التالي' : 'Next',
        previous: isRTL ? 'السابق' : 'Previous',
        submit: isRTL ? 'إرسال الامتحان' : 'Submit Exam',
        submitting: isRTL ? 'جاري الإرسال...' : 'Submitting...',
        question: isRTL ? 'سؤال' : 'Question',
        of: isRTL ? 'من' : 'of',
        minutes: isRTL ? 'دقيقة' : 'min',
        readingPassage: isRTL ? 'نص القراءة' : 'Reading Passage',
        poetry: isRTL ? 'نص شعري' : 'Poetry',
    };

    // Fetch exam data
    useEffect(() => {
        const fetchExam = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const tableName = isTeacherExam ? 'teacher_exams' : 'comprehensive_exams';
                const { data, error: fetchError } = await supabase
                    .from(tableName as any)
                    .select('*')
                    .eq('id', examId)
                    .single();

                if (fetchError) throw fetchError;

                // Type assertion for data
                const examData = data as any;

                setExam({
                    id: examData.id,
                    title: examData.exam_title || examData.title,
                    description: examData.exam_description || examData.description,
                    duration: examData.duration_minutes,
                    totalMarks: examData.total_marks,
                    blocks: examData.blocks || examData.sections || [],
                });

                if (examData.duration_minutes) {
                    setTimeRemaining(examData.duration_minutes * 60);
                }
            } catch (err) {
                logger.error('Error fetching exam', { context: 'UnifiedExamPlayer', data: err });
                setError(labels.error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExam();
    }, [examId, isTeacherExam]);

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
    const handleAnswer = useCallback((questionId: string, answer: string | number) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    }, []);

    // Navigation
    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else if (currentBlockIndex < blocks.length - 1) {
            setCurrentBlockIndex((prev) => prev + 1);
            setCurrentQuestionIndex(0);
        }
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        } else if (currentBlockIndex > 0) {
            setCurrentBlockIndex((prev) => prev - 1);
            const prevBlock = blocks[currentBlockIndex - 1];
            const prevBlockQuestions = getBlockQuestions(prevBlock);
            setCurrentQuestionIndex(Math.max(prevBlockQuestions.length - 1, 0));
        }
    };

    const isLastQuestion = currentBlockIndex === blocks.length - 1 &&
        currentQuestionIndex === questions.length - 1;

    // Helper to find correct answer index from teacher exam options
    const getCorrectAnswerIndex = (q: ExamQuestion): number => {
        if (q.correctAnswer !== undefined) {
            return typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(String(q.correctAnswer), 10);
        }
        // Teacher exam format: find option with isCorrect: true
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

            // Calculate score
            let totalScore = 0;
            let maxScore = 0;

            blocks.forEach((block) => {
                const blockQuestions = getBlockQuestions(block);
                blockQuestions.forEach((q) => {
                    const points = q.points || 1;
                    maxScore += points;

                    const userAnswer = answers[q.id];
                    
                    // For MCQ/true_false: check if selected index matches correct index
                    if (q.type === 'mcq' || q.type === 'multiple_choice' || q.type === 'true_false') {
                        const correctIdx = getCorrectAnswerIndex(q);
                        if (userAnswer !== undefined && Number(userAnswer) === correctIdx) {
                            totalScore += points;
                        }
                    } 
                    // For text-based questions: compare with correctAnswer field
                    else if (userAnswer !== undefined) {
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
                timeSpent: exam?.duration ? (exam.duration * 60) - (timeRemaining || 0) : 0,
            };

            if (onComplete) {
                onComplete(results);
            } else {
                // Navigate to results page
                router.push(`/${language}/${isTeacherExam ? 'teacher-exam' : 'exam'}/${examId}/results`);
            }
        } catch (err) {
            logger.error('Error submitting exam', { context: 'UnifiedExamPlayer', data: err });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to get option text based on language
    const getOptionText = (option: string | TeacherExamOption | { id: string; text: string }): string => {
        if (typeof option === 'string') return option;
        if ('text' in option && option.text) return option.text;
        // Teacher exam format: { textAr, textEn, isCorrect }
        if ('textAr' in option || 'textEn' in option) {
            return isRTL ? (option.textAr || option.textEn || '') : (option.textEn || option.textAr || '');
        }
        return '';
    };

    // Render question
    const renderQuestion = (q: ExamQuestion) => {
        const questionText = q.text || (isRTL ? q.textAr : q.textEn) || (isRTL ? q.textEn : q.textAr) || '';
        const userAnswer = answers[q.id];

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

        const typeLabel = questionTypeLabels[q.type] || { ar: q.type, en: q.type };

        return (
            <div className="space-y-6">
                {/* Question Type Badge */}
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                        {isRTL ? typeLabel.ar : typeLabel.en}
                    </span>
                    {q.difficulty && (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            q.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            q.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                            {isRTL ? (q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'hard' ? 'صعب' : 'متوسط') : q.difficulty}
                        </span>
                    )}
                </div>

                {/* Parsing Question - Show underlined word */}
                {q.type === 'parsing' && q.underlinedWord && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                            {isRTL ? 'أعرب الكلمة التالية:' : 'Parse the following word:'}
                        </p>
                        <p className="text-xl font-bold text-amber-900 dark:text-amber-100 underline decoration-2">
                            {q.underlinedWord}
                        </p>
                    </div>
                )}

                {/* Fill Blank Question - Show text with blank */}
                {q.type === 'fill_blank' && (q.blankTextAr || q.blankTextEn) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            {isRTL ? 'أكمل الفراغ في الجملة التالية:' : 'Complete the blank in the following:'}
                        </p>
                        <p className="text-lg text-blue-900 dark:text-blue-100">
                            {isRTL ? (q.blankTextAr || q.blankTextEn) : (q.blankTextEn || q.blankTextAr)}
                        </p>
                    </div>
                )}

                {/* Extraction Question - Show what to extract */}
                {q.type === 'extraction' && q.extractionTarget && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
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
                    <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                        {questionText}
                    </p>
                )}

                {/* MCQ / True-False Options */}
                {(q.type === 'mcq' || q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                    <div className="space-y-3">
                        {(q.options as (string | TeacherExamOption | { id: string; text: string })[]).map((option, idx) => {
                            const optionText = getOptionText(option);
                            const optionId = typeof option === 'string' ? idx : ((option as TeacherExamOption).id || idx);
                            const isSelected = userAnswer === optionId || userAnswer === idx || userAnswer === optionText;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(q.id, idx)}
                                    className={`w-full p-4 text-start rounded-xl border-2 transition-all ${isSelected
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                                            isSelected 
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
                            value={userAnswer || ''}
                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                            placeholder={isRTL ? 'اكتب إجابتك هنا...' : 'Write your answer here...'}
                            className="w-full h-40 p-4 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                    </div>
                )}
            </div>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-[#0f0f12]"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#2e2e3a]">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {exam?.title}
                    </h1>

                    {/* Timer */}
                    {timeRemaining !== null && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeRemaining < 300
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-[#2e2e3a] dark:text-gray-300'
                            }`}>
                            <Clock className="w-4 h-4" />
                            <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
                        </div>
                    )}
                </div>

                {/* Progress */}
                <div className="h-1 bg-gray-100 dark:bg-[#2e2e3a]">
                    <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${(Object.keys(answers).length / Math.max(totalQuestions, 1)) * 100}%` }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentBlockIndex}-${currentQuestionIndex}`}
                        initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                        className="space-y-8"
                    >
                        {/* Block Title */}
                        {currentBlock && (
                            <div className="text-center">
                                <span className="text-sm text-primary-500 font-medium">
                                    {isRTL ? currentBlock.titleAr : currentBlock.titleEn || currentBlock.titleAr}
                                </span>
                            </div>
                        )}

                        {/* Reading Passage - supports both bodyText and readingText (teacher exams) */}
                        {(currentBlock?.bodyText || (currentBlock?.contentType === 'reading' && currentBlock?.readingText)) && (
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-800 dark:text-blue-300">
                                        {currentBlock?.readingTitle || labels.readingPassage}
                                    </span>
                                </div>
                                <div className="prose prose-blue dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap leading-relaxed">
                                        {currentBlock.bodyText || currentBlock.readingText}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Poetry Section - for teacher exams */}
                        {currentBlock?.contentType === 'poetry' && currentBlock?.poetryVerses && currentBlock.poetryVerses.length > 0 && (
                            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="w-5 h-5 text-purple-600" />
                                    <span className="font-semibold text-purple-800 dark:text-purple-300">
                                        {currentBlock?.poetryTitle || labels.poetry}
                                    </span>
                                </div>
                                <div className="space-y-3 text-center">
                                    {currentBlock.poetryVerses.map((verse, idx) => (
                                        <div key={idx} className="flex justify-center gap-8 text-lg leading-relaxed">
                                            <span>{verse.firstHalf}</span>
                                            <span className="text-purple-400">***</span>
                                            <span>{verse.secondHalf}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Question Card */}
                        {currentQuestion && (
                            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-sm text-gray-500">
                                        {labels.question} {currentQuestionIndex + 1} {labels.of} {questions.length}
                                    </span>
                                    {currentQuestion.points && (
                                        <span className="text-sm text-primary-500 font-medium">
                                            {currentQuestion.points} {isRTL ? 'درجة' : 'pts'}
                                        </span>
                                    )}
                                </div>

                                {renderQuestion(currentQuestion)}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-t border-gray-200 dark:border-[#2e2e3a]">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={goToPrevious}
                        disabled={currentBlockIndex === 0 && currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#3e3e4a] transition-colors"
                    >
                        {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        {labels.previous}
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
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
                            onClick={goToNext}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                        >
                            {labels.next}
                            {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}

export default UnifiedExamPlayer;
