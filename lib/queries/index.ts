/**
 * Queries Module - Unified Version
 * 
 * This module provides a clean, unified API for data fetching.
 * It re-exports from adminQueries.ts and hooks/useApiQuery.ts to eliminate duplication.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { useUpdateUserAPI, useDeleteUserAPI } from './adminQueries';

// ==========================================
// Re-export all admin API hooks
// ==========================================

export {
    // Base hooks
    useApiQuery,
    useApiCreate,
    useApiUpdate,
    useApiDelete,
    // Users
    useUsersAPI,
    useUpdateUserAPI,
    useDeleteUserAPI,
    // Teachers
    useTeachersAPI,
    // Stages
    useStagesAPI,
    useCreateStageAPI,
    useUpdateStageAPI,
    useDeleteStageAPI,
    // Subjects
    useSubjectsAPI,
    useCreateSubjectAPI,
    useUpdateSubjectAPI,
    useDeleteSubjectAPI,
    // Lessons
    useLessonsAPI,
    useCreateLessonAPI,
    useUpdateLessonAPI,
    useDeleteLessonAPI,
    // Exams
    useExamsAPI,
    useCreateExamAPI,
    useUpdateExamAPI,
    useDeleteExamAPI,
    // Question Banks
    useQuestionBanksAPI,
    useDeleteQuestionBankAPI,
    // Subject Stages
    useSubjectStagesAPI,
    useUpdateSubjectStagesAPI,
} from './adminQueries';

export type { QueryConfig, UseQueryResult, UseMutationResult } from './adminQueries';

// ==========================================
// Types
// ==========================================

type Tables = Database['public']['Tables'];
type Stage = Tables['educational_stages']['Row'];
type Subject = Tables['subjects']['Row'];
type Lesson = Tables['lessons']['Row'];
type Exam = Tables['comprehensive_exams']['Row'];
type Profile = Tables['profiles']['Row'];

// ==========================================
// Legacy Aliases (for backward compatibility)
// ==========================================

// These aliases allow existing code to continue working
// while using the new unified implementation

export { useStagesAPI as useStages } from './adminQueries';
export { useSubjectsAPI as useSubjects } from './adminQueries';
export { useExamsAPI as useExams } from './adminQueries';

// Create/Update/Delete aliases
export { useCreateStageAPI as useCreateStage } from './adminQueries';
export { useUpdateStageAPI as useUpdateStage } from './adminQueries';
export { useDeleteStageAPI as useDeleteStage } from './adminQueries';

export { useCreateSubjectAPI as useCreateSubject } from './adminQueries';
export { useUpdateSubjectAPI as useUpdateSubject } from './adminQueries';
export { useDeleteSubjectAPI as useDeleteSubject } from './adminQueries';

export { useLessonsAPI as useLessons } from './adminQueries';
export { useCreateLessonAPI as useCreateLesson } from './adminQueries';
export { useUpdateLessonAPI as useUpdateLesson } from './adminQueries';
export { useDeleteLessonAPI as useDeleteLesson } from './adminQueries';

export { useCreateExamAPI as useCreateExam } from './adminQueries';
export { useUpdateExamAPI as useUpdateExam } from './adminQueries';
export { useDeleteExamAPI as useDeleteExam } from './adminQueries';

export { useUsersAPI as useUsers } from './adminQueries';
export { useUpdateUserAPI as useUpdateUser } from './adminQueries';
export { useDeleteUserAPI as useDeleteUser } from './adminQueries';

export { useTeachersAPI as useTeachers } from './adminQueries';
export { useQuestionBanksAPI as useQuestionBanks } from './adminQueries';
export { useDeleteQuestionBankAPI as useDeleteQuestionBank } from './adminQueries';

// ==========================================
// Special Hooks (using direct Supabase client)
// ==========================================

/**
 * Hook to fetch a single exam by ID
 * Uses direct Supabase client for single-item queries
 */
export function useExam(id: string): { data: Exam | null; isLoading: boolean; error: string | null } {
    const [data, setData] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(!!id);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const supabase = createClient();
            try {
                const { data: result, error: err } = await supabase
                    .from('comprehensive_exams')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (err) throw err;
                setData(result);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Error fetching exam');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    return { data, isLoading, error };
}

/**
 * Hook to fetch questions with filters
 */
interface UseQuestionsOptions {
    stage_id?: string;
    subject_id?: string;
    lesson_id?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    search?: string;
}

type Question = Tables['quiz_questions']['Row'];

interface UseQuestionsResult {
    data: Question[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useQuestions(options?: UseQuestionsOptions): UseQuestionsResult {
    const [data, setData] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            let query = supabase
                .from('quiz_questions')
                .select('*, lessons!inner(id, title, stage_id, subject_id)')
                .order('created_at', { ascending: false })
                .order('order_index', { ascending: true });

            if (options?.lesson_id) {
                query = query.eq('lesson_id', options.lesson_id);
            } else {
                if (options?.stage_id) {
                    query = query.eq('lessons.stage_id', options.stage_id);
                }
                if (options?.subject_id) {
                    query = query.eq('lessons.subject_id', options.subject_id);
                }
            }

            if (options?.difficulty) {
                query = query.eq('difficulty', options.difficulty);
            }

            if (options?.search) {
                query = query.or(`text->ar.ilike.%${options.search}%,text->en.ilike.%${options.search}%`);
            }

            const { data: result, error: err } = await query;

            if (err) throw err;
            setData(result || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching questions');
        } finally {
            setIsLoading(false);
        }
    }, [options?.stage_id, options?.subject_id, options?.lesson_id, options?.difficulty, options?.search]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useDeleteQuestion() {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('quiz_questions')
                .delete()
                .eq('id', id);

            if (err) throw err;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error deleting question';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useDeleteQuestions() {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (ids: string[]): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('quiz_questions')
                .delete()
                .in('id', ids);

            if (err) throw err;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error deleting questions';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useUpdateTeacher() {
    return useUpdateUserAPI();
}

export function useDeleteTeacher() {
    return useDeleteUserAPI();
}


// Re-export useUpdateQuestionBank from adminQueries or implement here if needed
export function useUpdateQuestionBank() {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: { id: string; questions: Record<string, unknown>[] }) => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { id, questions } = input;
            let totalPoints = 0;
            for (const q of questions) {
                if (typeof q.points === 'number') {
                    totalPoints += q.points;
                }
            }

            const { data, error: err } = await supabase
                .from('question_banks')
                .update({
                    questions: questions as any,
                    total_questions: questions.length,
                    total_points: totalPoints,
                })
                .eq('id', id)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error updating question bank';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}
