// =============================================
// useExamSession - Unified Exam Player Hook
// Refactored from useTeacherExamPlayer
// Uses transformExamData from lib/utils/exam-transformer
// =============================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';
import { transformExamData, type ExamRunnerData, type ExamRunnerBlock } from '@/lib/utils/exam-transformer';
import { formatExamTime, isTimeWarning, checkExamAvailability } from '@/lib/utils/exam-utils';

// =============================================
// Types
// =============================================

export interface UseExamSessionOptions {
    examId: string;
    language: 'arabic' | 'english';
    /** Path to results page */
    resultsPath: string;
    /** Path to fallback on error */
    fallbackPath: string;
    /** Require login to view exam (default: false) */
    requireAuth?: boolean;
    /** Require login only to submit answers (default: true) */
    requireAuthToSubmit?: boolean;
    /** Source table: 'comprehensive' | 'teacher' (default: 'comprehensive') */
    examSource?: 'comprehensive' | 'teacher';
}

export interface ExamSessionState {
    // Data
    exam: ExamRunnerData | null;
    isLoading: boolean;
    error: Error | null;

    // Navigation
    currentBlockIndex: number;
    totalBlocks: number;

    // Answers
    answers: Record<string, unknown>;
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
    handleAnswerChange: (questionId: string, value: unknown) => Promise<void>;
    handleSubmit: () => Promise<void>;
    getBlockProgress: (blockIndex: number) => { answered: number; total: number; isComplete: boolean };
}

// =============================================
// Hook Implementation
// =============================================

export function useExamSession(options: UseExamSessionOptions): ExamSessionState {
    const {
        examId,
        language,
        resultsPath,
        fallbackPath,
        requireAuth = false,
        requireAuthToSubmit = true,
        examSource = 'comprehensive',
    } = options;
    const router = useRouter();

    // State
    const [exam, setExam] = useState<ExamRunnerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [previousResult, setPreviousResult] = useState<{ score: number; maxScore: number } | null>(null);
    const [currentUser, setCurrentUser] = useState<unknown>(null);
    const [attemptsTable, setAttemptsTable] = useState<string>('comprehensive_exam_attempts');

    // Time Limited Exam State
    const [availabilityTimeLeft, setAvailabilityTimeLeft] = useState<number | null>(null);
    const [examNotAvailable, setExamNotAvailable] = useState(false);
    const [examNotAvailableReason, setExamNotAvailableReason] = useState<'not_started' | 'ended' | null>(null);
    const [examAvailabilityMessage, setExamAvailabilityMessage] = useState<string | null>(null);

    // Refs
    const attemptStartedRef = useRef(false);

    // =============================================
    // Fetch exam data via API
    // =============================================
    useEffect(() => {
        const fetchExam = async () => {
            if (!examId) return;

            try {
                logger.info('Fetching exam', { context: 'useExamSession', data: { examId, examSource } });

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

                // =============================================
                // Use centralized transformExamData
                // =============================================
                const transformedExam = transformExamData(rawExam, 'comprehensive');

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
                        setAnswers(inProgressAttempt.answers as Record<string, unknown>);
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

            } catch (err: unknown) {
                logger.error('Error fetching exam', { context: 'useExamSession', data: err });
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchExam();
    }, [examId, requireAuth, router, resultsPath, examSource]);

    // =============================================
    // Computed values
    // =============================================
    const blocks = exam?.blocks || [];
    const totalBlocks = blocks.length;

    const totalQuestions = blocks.reduce((sum, block) => sum + (block.questions?.length || 0), 0);
    const answeredCount = Object.keys(answers).length;
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const timeFormatted = timeLeft !== null ? formatExamTime(timeLeft) : '';
    const timeWarning = isTimeWarning(timeLeft, 300);

    const availabilityTimeFormatted = availabilityTimeLeft !== null ? formatExamTime(availabilityTimeLeft) : '';
    const isAvailabilityWarning = isTimeWarning(availabilityTimeLeft, 600);

    // =============================================
    // Timer effects
    // =============================================
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

    // =============================================
    // Navigation
    // =============================================
    const goToNextBlock = useCallback(() => {
        setCurrentBlockIndex(prev => Math.min(totalBlocks - 1, prev + 1));
    }, [totalBlocks]);

    const goToPrevBlock = useCallback(() => {
        setCurrentBlockIndex(prev => Math.max(0, prev - 1));
    }, []);

    // =============================================
    // Answer handling with auto-save
    // =============================================
    const handleAnswerChange = useCallback(async (questionId: string, value: unknown) => {
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
                logger.error('Error auto-saving answers', { context: 'useExamSession', data: err });
            }
        }
    }, [answers, attemptId, exam?.id, attemptsTable]);

    // =============================================
    // Block progress
    // =============================================
    const getBlockProgress = useCallback((blockIndex: number) => {
        const block = blocks[blockIndex];
        if (!block) return { answered: 0, total: 0, isComplete: false };

        const blockQuestions = block.questions || [];
        const answered = blockQuestions.filter((q) => answers[q.id] !== undefined).length;
        const total = blockQuestions.length;

        return {
            answered,
            total,
            isComplete: answered === total && total > 0,
        };
    }, [blocks, answers]);

    // =============================================
    // Submit
    // =============================================
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
                    (block.questions || []).forEach((q) => {
                        maxScore += q.points || 1;
                        const userAnswer = answers[q.id];
                        if (q.type === 'mcq' && userAnswer === q.correctIndex) {
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
            logger.error('Error submitting exam', { context: 'useExamSession', data: err });
            setIsSubmitting(false);
        }
    }, [isSubmitting, requireAuthToSubmit, currentUser, attemptId, exam, blocks, answers, router, resultsPath, fallbackPath, attemptsTable]);

    // =============================================
    // Auto-submit effects
    // =============================================
    useEffect(() => {
        if (timeLeft === 0 && !isPracticeMode) {
            handleSubmit();
        }
    }, [timeLeft, isPracticeMode, handleSubmit]);

    useEffect(() => {
        if (availabilityTimeLeft === 0 && exam && !examNotAvailable && attemptId) {
            alert('انتهى وقت توفر الامتحان. سيتم تسليم إجاباتك تلقائياً.');
            handleSubmit();
        }
    }, [availabilityTimeLeft, exam, examNotAvailable, attemptId, handleSubmit]);

    // =============================================
    // Return state
    // =============================================
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
        isTimeWarning: timeWarning,
        isTimeLimited: !!exam?.isPublished, // Note: This should come from exam data
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

// =============================================
// Legacy export for backward compatibility
// =============================================
export { useExamSession as useTeacherExamPlayer };
