// =============================================
// useTeacherExamPlayer - Hook لتشغيل امتحانات المدرسين
// Uses API routes for Vercel compatibility
// =============================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

interface UseTeacherExamPlayerOptions {
    examId: string;
    language: 'arabic' | 'english';
    /** Path to results page */
    resultsPath: string;
    /** Path to fallback on error */
    fallbackPath: string;
    /** Require login to view exam (default: false for regular exams) */
    requireAuth?: boolean;
    /** Require login only to submit answers (default: true) */
    requireAuthToSubmit?: boolean;
    /** Source table for exams: 'comprehensive' | 'teacher' (default: 'comprehensive') */
    examSource?: 'comprehensive' | 'teacher';
}

interface ExamSubsection {
    id: string;
    title: string;
    type: string;
    questions: any[];
}

interface ExamBlock {
    id: string;
    type?: string;
    contentType?: string;
    order?: number;
    titleAr?: string;
    titleEn?: string;
    title?: string;
    subsections?: ExamSubsection[];
    questions?: any[];
    [key: string]: any;
}

interface TransformedExam {
    id: string;
    examTitle: string;
    examDescription?: string;
    durationMinutes?: number;
    totalMarks?: number;
    blocks: ExamBlock[];
    // Time Limited Exam
    isTimeLimited?: boolean;
    availableFrom?: string | null;
    availableUntil?: string | null;
}

interface TeacherExamPlayerState {
    // Data
    exam: TransformedExam | null;
    isLoading: boolean;
    error: Error | null;

    // Navigation
    currentBlockIndex: number;
    totalBlocks: number;

    // Answers
    answers: Record<string, any>;
    answeredCount: number;
    totalQuestions: number;
    progress: number;

    // Timer
    timeLeft: number | null;
    timeFormatted: string;
    isTimeWarning: boolean;

    // Time Limited Exam
    isTimeLimited: boolean;
    availabilityTimeLeft: number | null;
    availabilityTimeFormatted: string;
    isAvailabilityWarning: boolean;
    examNotAvailable: boolean;
    examNotAvailableReason: 'not_started' | 'ended' | null;
    examAvailabilityMessage: string | null;

    // Submission
    isSubmitting: boolean;
    attemptId: string | null;

    // Practice Mode
    isPracticeMode: boolean;
    previousResult: { score: number; maxScore: number } | null;

    // Actions
    setCurrentBlockIndex: (index: number) => void;
    goToNextBlock: () => void;
    goToPrevBlock: () => void;
    handleAnswerChange: (questionId: string, value: any) => Promise<void>;
    handleSubmit: () => Promise<void>;
    getBlockProgress: (blockIndex: number) => { answered: number; total: number; isComplete: boolean };
}

// دالة للحصول على عنوان نوع السؤال
function getQuestionTypeLabel(type: string): string {
    switch (type) {
        case 'mcq': return 'اختيار من متعدد';
        case 'true_false': return 'صح أو خطأ';
        case 'fill_blank': return 'أكمل الفراغ';
        case 'matching': return 'توصيل';
        case 'ordering': return 'ترتيب';
        case 'essay': return 'مقالي';
        case 'short_answer': return 'إجابة قصيرة';
        default: return 'أسئلة';
    }
}

export function useTeacherExamPlayer(options: UseTeacherExamPlayerOptions): TeacherExamPlayerState {
    const {
        examId,
        language,
        resultsPath,
        fallbackPath,
        requireAuth = false,
        requireAuthToSubmit = true,
    } = options;
    const router = useRouter();

    // State
    const [exam, setExam] = useState<TransformedExam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [previousResult, setPreviousResult] = useState<{ score: number; maxScore: number } | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [attemptsTable, setAttemptsTable] = useState<string>('comprehensive_exam_attempts');

    // Time Limited Exam State
    const [availabilityTimeLeft, setAvailabilityTimeLeft] = useState<number | null>(null);
    const [examNotAvailable, setExamNotAvailable] = useState(false);
    const [examNotAvailableReason, setExamNotAvailableReason] = useState<'not_started' | 'ended' | null>(null);
    const [examAvailabilityMessage, setExamAvailabilityMessage] = useState<string | null>(null);

    // Refs
    const attemptStartedRef = useRef(false);

    // Fetch exam data via API
    useEffect(() => {
        const fetchExam = async () => {
            if (!examId) return;

            try {
                console.log('=== useTeacherExamPlayer Fetching via API ===');
                console.log('examId:', examId);

                // Fetch exam data via API
                const res = await fetch(`/api/exam?examId=${examId}`);
                const result = await res.json();

                if (!result.success) {
                    if (requireAuth && !result.data?.user) {
                        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                        return;
                    }
                    throw new Error(result.error || 'الامتحان غير موجود');
                }

                const { exam: rawExam, attemptsTable: actualAttemptsTable, user, existingAttempt, inProgressAttempt } = result.data;

                setCurrentUser(user);
                setAttemptsTable(actualAttemptsTable);

                // Check auth requirement
                if (requireAuth && !user) {
                    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                    return;
                }

                console.log('rawExam:', rawExam);

                // Transform sections to blocks
                let blocksData: ExamBlock[] = [];
                const sectionsData = rawExam.sections || rawExam.blocks || [];

                if (Array.isArray(sectionsData) && sectionsData.length > 0) {
                    const hasSubsections = sectionsData.some((s: any) =>
                        s.subsections && Array.isArray(s.subsections) && s.subsections.length > 0
                    );

                    if (hasSubsections) {
                        blocksData = sectionsData.map((section: any, sIndex: number) => {
                            const transformedSubsections: ExamSubsection[] = [];
                            let allQuestions: any[] = [];

                            if (section.subsections && Array.isArray(section.subsections)) {
                                section.subsections.forEach((sub: any, subIndex: number) => {
                                    if (sub.questions && Array.isArray(sub.questions)) {
                                        const transformedQuestions = sub.questions.map((q: any) => ({
                                            id: q.id,
                                            type: q.type || 'mcq',
                                            stem: q.textAr || q.text || '',
                                            textAr: q.textAr || q.text || '',
                                            textEn: q.textEn || '',
                                            options: (q.options || []).map((opt: any) =>
                                                typeof opt === 'string' ? opt : (opt?.textAr || opt?.text || '')
                                            ),
                                            correctAnswer: q.options?.findIndex((opt: any) => opt.isCorrect) ?? 0,
                                            explanationAr: q.explanationAr || '',
                                            difficulty: q.difficulty || 'medium',
                                            points: q.points || 1,
                                        }));

                                        transformedSubsections.push({
                                            id: sub.id || `subsection-${sIndex}-${subIndex}`,
                                            title: sub.title || getQuestionTypeLabel(sub.type),
                                            type: sub.type || 'mcq',
                                            questions: transformedQuestions,
                                        });

                                        allQuestions = [...allQuestions, ...transformedQuestions];
                                    }
                                });
                            }

                            return {
                                id: section.id || `section-${sIndex}`,
                                type: section.contentType || 'section',
                                contentType: section.contentType || 'none',
                                order: sIndex,
                                title: section.titleAr || section.title || `القسم ${sIndex + 1}`,
                                titleAr: section.titleAr || section.title || `القسم ${sIndex + 1}`,
                                titleEn: section.titleEn || '',
                                subsections: transformedSubsections,
                                questions: allQuestions,
                                readingTitle: section.readingTitle,
                                readingText: section.readingText,
                                poetryTitle: section.poetryTitle,
                                poetryVerses: section.poetryVerses,
                            };
                        });
                    } else {
                        blocksData = sectionsData as ExamBlock[];
                    }
                }

                const transformedExam: TransformedExam = {
                    id: rawExam.id,
                    examTitle: rawExam.exam_title || 'امتحان',
                    examDescription: rawExam.exam_description,
                    durationMinutes: rawExam.duration_minutes,
                    totalMarks: rawExam.total_marks,
                    blocks: blocksData,
                    isTimeLimited: rawExam.is_time_limited || false,
                    availableFrom: rawExam.available_from,
                    availableUntil: rawExam.available_until,
                };

                // Check time availability
                if (rawExam.is_time_limited && rawExam.available_from && rawExam.available_until) {
                    const now = new Date();
                    const availableFrom = new Date(rawExam.available_from);
                    const availableUntil = new Date(rawExam.available_until);

                    if (now < availableFrom) {
                        setExamNotAvailable(true);
                        setExamNotAvailableReason('not_started');
                        setExamAvailabilityMessage(`الامتحان سيكون متاحاً في ${availableFrom.toLocaleString('ar-EG')}`);
                        setExam(transformedExam);
                        setIsLoading(false);
                        return;
                    } else if (now > availableUntil) {
                        setExamNotAvailable(true);
                        setExamNotAvailableReason('ended');
                        setExamAvailabilityMessage(`انتهى وقت الامتحان في ${availableUntil.toLocaleString('ar-EG')}`);
                        setExam(transformedExam);
                        setIsLoading(false);
                        return;
                    } else {
                        const remainingMs = availableUntil.getTime() - now.getTime();
                        setAvailabilityTimeLeft(Math.floor(remainingMs / 1000));
                    }
                }

                setExam(transformedExam);

                // Handle existing attempts
                if (existingAttempt) {
                    router.push(`${resultsPath}?attemptId=${existingAttempt.id}`);
                    return;
                }

                if (inProgressAttempt) {
                    setAttemptId(inProgressAttempt.id);
                    if (inProgressAttempt.answers && typeof inProgressAttempt.answers === 'object') {
                        setAnswers(inProgressAttempt.answers as Record<string, any>);
                    }
                } else if (user && !attemptStartedRef.current) {
                    attemptStartedRef.current = true;
                    // Create new attempt via API
                    const createRes = await fetch('/api/exam', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'create',
                            examId: rawExam.id,
                            attemptsTable: actualAttemptsTable,
                        }),
                    });
                    const createResult = await createRes.json();
                    if (createResult.success && createResult.attemptId) {
                        setAttemptId(createResult.attemptId);
                    }
                }

                // Set timer
                if (rawExam.duration_minutes) {
                    setTimeLeft(rawExam.duration_minutes * 60);
                }

            } catch (err: any) {
                logger.error('Error fetching teacher exam', { context: 'useTeacherExamPlayer', data: err });
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExam();
    }, [examId, requireAuth, router, resultsPath]);

    // Get blocks
    const blocks = exam?.blocks || [];
    const totalBlocks = blocks.length;

    // Calculate totals
    const totalQuestions = blocks.reduce((sum, block) => sum + (block.questions?.length || 0), 0);
    const answeredCount = Object.keys(answers).length;
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    // Timer formatting
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const timeFormatted = timeLeft !== null ? formatTime(timeLeft) : '';
    const isTimeWarning = timeLeft !== null && timeLeft < 300;

    const availabilityTimeFormatted = availabilityTimeLeft !== null ? formatTime(availabilityTimeLeft) : '';
    const isAvailabilityWarning = availabilityTimeLeft !== null && availabilityTimeLeft < 600;

    // Timer tick
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || isPracticeMode) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isPracticeMode]);

    // Availability timer
    useEffect(() => {
        if (availabilityTimeLeft === null || availabilityTimeLeft <= 0 || examNotAvailable) return;

        const timer = setInterval(() => {
            setAvailabilityTimeLeft(prev => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [availabilityTimeLeft, examNotAvailable]);

    // Navigation
    const goToNextBlock = useCallback(() => {
        setCurrentBlockIndex(prev => Math.min(totalBlocks - 1, prev + 1));
    }, [totalBlocks]);

    const goToPrevBlock = useCallback(() => {
        setCurrentBlockIndex(prev => Math.max(0, prev - 1));
    }, []);

    // Answer handling with auto-save via API
    const handleAnswerChange = useCallback(async (questionId: string, value: any) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        if (attemptId) {
            try {
                await fetch('/api/exam', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'save',
                        examId: exam?.id,
                        attemptsTable,
                        attemptId,
                        answers: newAnswers,
                    }),
                });
            } catch (err) {
                console.error('Error auto-saving answers:', err);
            }
        }
    }, [answers, attemptId, exam?.id, attemptsTable]);

    // Get block progress
    const getBlockProgress = useCallback((blockIndex: number) => {
        const block = blocks[blockIndex];
        if (!block) return { answered: 0, total: 0, isComplete: false };

        const blockQuestions = block.questions || [];
        const answered = blockQuestions.filter((q: any) => answers[q.id] !== undefined).length;
        const total = blockQuestions.length;

        return {
            answered,
            total,
            isComplete: answered === total && total > 0,
        };
    }, [blocks, answers]);

    // Submit via API
    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;

        if (requireAuthToSubmit && !currentUser) {
            const confirmLogin = confirm('يجب تسجيل الدخول لحفظ إجاباتك. هل تريد التسجيل الآن؟');
            if (confirmLogin) {
                router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            }
            return;
        }

        setIsSubmitting(true);

        try {
            if (attemptId && exam) {
                // Calculate score
                let totalScore = 0;
                let maxScore = 0;

                blocks.forEach(block => {
                    (block.questions || []).forEach((q: any) => {
                        maxScore += q.points || 1;
                        const userAnswer = answers[q.id];
                        if (q.type === 'mcq' && userAnswer === q.correctAnswer) {
                            totalScore += q.points || 1;
                        }
                    });
                });

                const submitRes = await fetch('/api/exam', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'submit',
                        examId: exam.id,
                        attemptsTable,
                        attemptId,
                        answers,
                        score: totalScore,
                        maxScore,
                    }),
                });

                const submitResult = await submitRes.json();
                if (!submitResult.success) {
                    throw new Error(submitResult.error);
                }

                router.push(`${resultsPath}?attemptId=${attemptId}`);
                return;
            }

            router.push(fallbackPath);
        } catch (err) {
            logger.error('Error submitting exam', { context: 'useTeacherExamPlayer', data: err });
            setIsSubmitting(false);
        }
    }, [isSubmitting, requireAuthToSubmit, currentUser, attemptId, exam, blocks, answers, router, resultsPath, fallbackPath, attemptsTable]);

    // Auto-submit on timer end
    useEffect(() => {
        if (timeLeft === 0 && !isPracticeMode) {
            handleSubmit();
        }
    }, [timeLeft, isPracticeMode, handleSubmit]);

    // Auto-submit when availability ends
    useEffect(() => {
        if (availabilityTimeLeft === 0 && exam?.isTimeLimited && !examNotAvailable && attemptId) {
            alert('انتهى وقت توفر الامتحان. سيتم تسليم إجاباتك تلقائياً.');
            handleSubmit();
        }
    }, [availabilityTimeLeft, exam?.isTimeLimited, examNotAvailable, attemptId, handleSubmit]);

    return {
        exam,
        isLoading,
        error,
        currentBlockIndex,
        totalBlocks,
        answers,
        answeredCount,
        totalQuestions,
        progress,
        timeLeft,
        timeFormatted,
        isTimeWarning,
        isTimeLimited: exam?.isTimeLimited || false,
        availabilityTimeLeft,
        availabilityTimeFormatted,
        isAvailabilityWarning,
        examNotAvailable,
        examNotAvailableReason,
        examAvailabilityMessage,
        isSubmitting,
        attemptId,
        isPracticeMode,
        previousResult,
        setCurrentBlockIndex,
        goToNextBlock,
        goToPrevBlock,
        handleAnswerChange,
        handleSubmit,
        getBlockProgress,
    };
}
