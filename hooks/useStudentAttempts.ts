/**
 * Student Answers System - React Hooks
 * Version: 3.0
 * Date: 2026-01-27
 * 
 * Note: Uses type assertion for RPC calls as these are custom functions
 * not included in the auto-generated Supabase types.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type {
  QuestionBankProgress,
  TeacherExamResult,
  UpsertAnswerResponse,
  SubmitAttemptResponse,
  GetOrCreateAttemptResponse,
  StudentExamAttemptsResponse,
  AnswersJsonb,
} from '@/lib/types/attempts.types';

// Cast supabase to any to allow custom RPC function calls
// These RPC functions are defined in the database but not in the generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ============================================================================
// Question Bank Hooks
// ============================================================================

/**
 * Hook for managing question bank attempts
 */
export function useQuestionBankAttempt(questionBankId: string) {
  const [attempt, setAttempt] = useState<GetOrCreateAttemptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get or create attempt for the current user
   */
  const getOrCreateAttempt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await db.rpc('get_or_create_question_bank_attempt', {
        p_question_bank_id: questionBankId,
      });

      if (rpcError) throw rpcError;
      setAttempt(data as GetOrCreateAttemptResponse);
      return data as GetOrCreateAttemptResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get attempt';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [questionBankId]);

  /**
   * Save answer for a single question (server-side grading)
   */
  const saveAnswer = useCallback(
    async (
      questionId: string,
      answer: unknown,
      timeSpentSeconds?: number,
      flagged?: boolean
    ): Promise<UpsertAnswerResponse> => {
      setError(null);
      try {
        const { data, error: rpcError } = await db.rpc('upsert_question_bank_answer', {
          p_question_bank_id: questionBankId,
          p_question_id: questionId,
          p_answer: answer,
          p_time_spent_seconds: timeSpentSeconds ?? null,
          p_flagged: flagged ?? false,
        });

        if (rpcError) throw rpcError;

        // Update local state
        if (attempt) {
          setAttempt((prev) =>
            prev
              ? {
                  ...prev,
                  answered_count: prev.answered_count + (prev.answers[questionId] ? 0 : 1),
                  answers: {
                    ...prev.answers,
                    [questionId]: {
                      answer,
                      answered_at: new Date().toISOString(),
                      time_spent_seconds: timeSpentSeconds ?? null,
                      flagged: flagged ?? false,
                      auto: data.is_correct !== null
                        ? {
                            is_correct: data.is_correct,
                            points_earned: data.points_earned,
                            max_points: data.max_points,
                          }
                        : null,
                      manual: null,
                    },
                  },
                }
              : null
          );
        }

        return data as UpsertAnswerResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save answer';
        setError(message);
        throw err;
      }
    },
    [questionBankId, attempt]
  );

  /**
   * Submit the attempt (mark as completed)
   */
  const submitAttempt = useCallback(async (): Promise<SubmitAttemptResponse> => {
    if (!attempt) throw new Error('No attempt to submit');

    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await db.rpc('submit_question_bank_attempt', {
        p_attempt_id: attempt.attempt_id,
      });

      if (rpcError) throw rpcError;

      // Update local state
      setAttempt((prev) => (prev ? { ...prev, status: 'completed' } : null));

      return data as SubmitAttemptResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit attempt';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [attempt]);

  return {
    attempt,
    loading,
    error,
    getOrCreateAttempt,
    saveAnswer,
    submitAttempt,
  };
}

/**
 * Hook for getting student's question bank progress
 */
export function useQuestionBankProgress(studentId?: string) {
  const [progress, setProgress] = useState<QuestionBankProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await db.rpc('get_student_question_bank_progress', {
        p_student_id: studentId ?? null,
      });

      if (rpcError) throw rpcError;
      setProgress(data as QuestionBankProgress[]);
      return data as QuestionBankProgress[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
  };
}

// ============================================================================
// Teacher Exam Hooks
// ============================================================================

/**
 * Hook for managing teacher exam attempts
 */
export function useTeacherExamAttempt(examId: string) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersJsonb>({});
  const [status, setStatus] = useState<string>('in_progress');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save answer for a single question
   */
  const saveAnswer = useCallback(
    async (
      questionId: string,
      answer: unknown,
      timeSpentSeconds?: number,
      flagged?: boolean
    ): Promise<UpsertAnswerResponse> => {
      setError(null);
      try {
        const { data, error: rpcError } = await db.rpc('upsert_teacher_exam_answer', {
          p_exam_id: examId,
          p_question_id: questionId,
          p_answer: answer,
          p_time_spent_seconds: timeSpentSeconds ?? null,
          p_flagged: flagged ?? false,
        });

        if (rpcError) throw rpcError;

        // Update local state
        if (!attemptId && data.attempt_id) {
          setAttemptId(data.attempt_id);
        }

        setAnswers((prev) => ({
          ...prev,
          [questionId]: {
            answer,
            answered_at: new Date().toISOString(),
            time_spent_seconds: timeSpentSeconds ?? null,
            flagged: flagged ?? false,
            auto: data.is_correct !== null
              ? {
                  is_correct: data.is_correct,
                  points_earned: data.points_earned,
                  max_points: data.max_points,
                }
              : null,
            manual: null,
          },
        }));

        return data as UpsertAnswerResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save answer';
        setError(message);
        throw err;
      }
    },
    [examId, attemptId]
  );

  /**
   * Submit the exam
   */
  const submitExam = useCallback(async (): Promise<SubmitAttemptResponse> => {
    if (!attemptId) throw new Error('No attempt to submit');

    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await db.rpc('submit_teacher_exam_attempt', {
        p_attempt_id: attemptId,
      });

      if (rpcError) throw rpcError;
      setStatus('submitted');
      return data as SubmitAttemptResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit exam';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  return {
    attemptId,
    answers,
    status,
    loading,
    error,
    saveAnswer,
    submitExam,
  };
}

/**
 * Hook for teachers to view exam results
 */
export function useTeacherExamResults(examId: string) {
  const [results, setResults] = useState<TeacherExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await db.rpc('get_teacher_exam_results', {
        p_exam_id: examId,
      });

      if (rpcError) throw rpcError;
      setResults(data as TeacherExamResult[]);
      return data as TeacherExamResult[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch results';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [examId]);

  /**
   * Grade an essay question
   */
  const gradeEssay = useCallback(
    async (attemptId: string, questionId: string, pointsEarned: number, comment?: string) => {
      setError(null);
      try {
        const { data, error: rpcError } = await db.rpc('grade_essay_answer', {
          p_attempt_id: attemptId,
          p_question_id: questionId,
          p_points_earned: pointsEarned,
          p_comment: comment ?? null,
        });

        if (rpcError) throw rpcError;

        // Refresh results
        await fetchResults();

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to grade essay';
        setError(message);
        throw err;
      }
    },
    [fetchResults]
  );

  return {
    results,
    loading,
    error,
    fetchResults,
    gradeEssay,
  };
}

// ============================================================================
// Comprehensive Exam Hooks
// ============================================================================

/**
 * Hook for managing comprehensive exam attempts
 */
export function useComprehensiveExamAttempt(examId: string) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersJsonb>({});
  const [status, setStatus] = useState<string>('in_progress');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save answer for a single question
   */
  const saveAnswer = useCallback(
    async (
      questionId: string,
      answer: unknown,
      timeSpentSeconds?: number,
      flagged?: boolean
    ): Promise<UpsertAnswerResponse> => {
      setError(null);
      try {
        const { data, error: rpcError } = await db.rpc('upsert_comprehensive_exam_answer', {
          p_exam_id: examId,
          p_question_id: questionId,
          p_answer: answer,
          p_time_spent_seconds: timeSpentSeconds ?? null,
          p_flagged: flagged ?? false,
        });

        if (rpcError) throw rpcError;

        if (!attemptId && data.attempt_id) {
          setAttemptId(data.attempt_id);
        }

        setAnswers((prev) => ({
          ...prev,
          [questionId]: {
            answer,
            answered_at: new Date().toISOString(),
            time_spent_seconds: timeSpentSeconds ?? null,
            flagged: flagged ?? false,
            auto: data.is_correct !== null
              ? {
                  is_correct: data.is_correct,
                  points_earned: data.points_earned,
                  max_points: data.max_points,
                }
              : null,
            manual: null,
          },
        }));

        return data as UpsertAnswerResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save answer';
        setError(message);
        throw err;
      }
    },
    [examId, attemptId]
  );

  /**
   * Submit the exam
   */
  const submitExam = useCallback(async (): Promise<SubmitAttemptResponse> => {
    if (!attemptId) throw new Error('No attempt to submit');

    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await db.rpc('submit_comprehensive_exam_attempt', {
        p_attempt_id: attemptId,
      });

      if (rpcError) throw rpcError;
      setStatus('submitted');
      return data as SubmitAttemptResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit exam';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  return {
    attemptId,
    answers,
    status,
    loading,
    error,
    saveAnswer,
    submitExam,
  };
}

// ============================================================================
// Student Profile Hook
// ============================================================================

/**
 * Hook for getting all student exam attempts (for profile page)
 */
export function useStudentExamAttempts(studentId?: string) {
  const [data, setData] = useState<StudentExamAttemptsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rpcData, error: rpcError } = await db.rpc('get_student_exam_attempts', {
        p_student_id: studentId ?? null,
      });

      if (rpcError) throw rpcError;
      setData(rpcData as StudentExamAttemptsResponse);
      return rpcData as StudentExamAttemptsResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attempts';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  return {
    data,
    loading,
    error,
    fetchAttempts,
  };
}
