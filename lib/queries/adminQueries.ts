/**
 * Admin Query Hooks - Unified Version
 * Re-exports from hooks/useApiQuery.ts to eliminate duplication
 * Maintains backward compatibility with existing imports
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    useApiQuery,
    useApiCreate,
    useApiUpdate,
    useApiDelete,
    type QueryConfig,
    type UseQueryResult,
    type UseMutationResult,
} from '@/hooks/useApiQuery';
import type { Database } from '@/lib/database.types';

// Type aliases for database tables
type Profile = Database['public']['Tables']['profiles']['Row'];
type Stage = Database['public']['Tables']['educational_stages']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type Exam = Database['public']['Tables']['comprehensive_exams']['Row'];
type QuestionBank = Database['public']['Tables']['question_banks']['Row'];

// Re-export base hooks for advanced usage
export { useApiQuery, useApiCreate, useApiUpdate, useApiDelete };
export type { QueryConfig, UseQueryResult, UseMutationResult };

// ==========================================
// Users Hooks (Alias for backward compatibility)
// ==========================================

export const useUsersAPI = () => useApiQuery<Profile>({
    table: 'profiles',
    orderBy: 'created_at',
    ascending: false,
    limit: 500,
});

export const useUpdateUserAPI = () => {
    const mutation = useApiUpdate<Profile>('profiles');
    return {
        ...mutation,
        mutateAsync: async (input: { userId: string; updates: Partial<Profile> }) => {
            return mutation.mutateAsync({ id: input.userId, updates: input.updates });
        },
    };
};

export const useDeleteUserAPI = () => useApiDelete('profiles');

// ==========================================
// Teachers Hooks
// ==========================================

export const useTeachersAPI = () => useApiQuery<Profile>({
    table: 'profiles',
    orderBy: 'created_at',
    ascending: false,
    filterColumn: 'role',
    filterValue: 'teacher',
    limit: 500,
});

// ==========================================
// Stages Hooks
// ==========================================

export const useStagesAPI = () => useApiQuery<Stage>({
    table: 'educational_stages',
    orderBy: 'order_index',
    ascending: true,
    limit: 100,
});

export const useCreateStageAPI = () => useApiCreate<Stage>('educational_stages');

export const useUpdateStageAPI = () => {
    const mutation = useApiUpdate<Stage>('educational_stages');
    return {
        ...mutation,
        mutateAsync: async (input: { id: string } & Partial<Stage>) => {
            const { id, ...updates } = input;
            return mutation.mutateAsync({ id, updates });
        },
    };
};

export const useDeleteStageAPI = () => useApiDelete('educational_stages');

// ==========================================
// Subjects Hooks
// ==========================================

export const useSubjectsAPI = () => useApiQuery<Subject>({
    table: 'subjects',
    orderBy: 'order_index',
    ascending: true,
    limit: 100,
});

export const useCreateSubjectAPI = () => useApiCreate<Subject>('subjects');

export const useUpdateSubjectAPI = () => {
    const mutation = useApiUpdate<Subject>('subjects');
    return {
        ...mutation,
        mutateAsync: async (input: { id: string } & Partial<Subject>) => {
            const { id, ...updates } = input;
            return mutation.mutateAsync({ id, updates });
        },
    };
};

export const useDeleteSubjectAPI = () => useApiDelete('subjects');

// ==========================================
// Lessons/Units Hooks
// ==========================================

export const useLessonsAPI = () => useApiQuery<Lesson>({
    table: 'lessons',
    orderBy: 'order_index',
    ascending: true,
    limit: 500,
});

export const useCreateLessonAPI = () => useApiCreate<Lesson>('lessons');

export const useUpdateLessonAPI = () => {
    const mutation = useApiUpdate<Lesson>('lessons');
    return {
        ...mutation,
        mutateAsync: async (input: { id: string } & Partial<Lesson>) => {
            const { id, ...updates } = input;
            return mutation.mutateAsync({ id, updates });
        },
    };
};

export const useDeleteLessonAPI = () => useApiDelete('lessons');

// ==========================================
// Exams Hooks
// ==========================================

export const useExamsAPI = () => useApiQuery<Exam>({
    table: 'comprehensive_exams',
    orderBy: 'created_at',
    ascending: false,
    limit: 500,
});

export const useCreateExamAPI = () => useApiCreate<Exam>('comprehensive_exams');

export const useUpdateExamAPI = () => {
    const mutation = useApiUpdate<Exam>('comprehensive_exams');
    return {
        ...mutation,
        mutateAsync: async (input: { examId?: string; id?: string; updates?: Partial<Exam> } & Partial<Exam>) => {
            const examId = input.examId || input.id;
            const updates = input.updates || (() => {
                const { examId: _, id: __, updates: ___, ...rest } = input;
                return rest;
            })();
            if (!examId) throw new Error('Exam ID is required');
            return mutation.mutateAsync({ id: examId, updates });
        },
    };
};

export const useDeleteExamAPI = () => useApiDelete('comprehensive_exams');

// ==========================================
// Question Banks Hooks
// ==========================================

export const useQuestionBanksAPI = () => useApiQuery<QuestionBank>({
    table: 'question_banks',
    orderBy: 'created_at',
    ascending: false,
    limit: 500,
});

export const useDeleteQuestionBankAPI = () => useApiDelete('question_banks');

// ==========================================
// Subject-Stages Hooks (Special - uses custom API)
// ==========================================

interface SubjectStage {
    id: string;
    subject_id: string;
    stage_id: string;
    is_active: boolean;
    order_index: number;
    created_at: string;
}

interface UseSubjectStagesResult {
    data: SubjectStage[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useSubjectStagesAPI(subjectId?: string): UseSubjectStagesResult {
    const [data, setData] = useState<SubjectStage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/subject-stages${subjectId ? `?subject_id=${subjectId}` : ''}`);
            const result = await response.json();
            
            if (result.error) {
                setError(result.error);
                setData([]);
            } else {
                setData(result.data || []);
            }
        } catch (err) {
            setError('Failed to fetch subject stages');
            setData([]);
        }
        
        setIsLoading(false);
    }, [subjectId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

interface UpdateSubjectStagesResult {
    mutateAsync: (input: { subjectId: string; stageIds: string[] }) => Promise<any>;
    isPending: boolean;
    error: string | null;
}

export function useUpdateSubjectStagesAPI(): UpdateSubjectStagesResult {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: { subjectId: string; stageIds: string[] }) => {
        setIsPending(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/subject-stages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            
            const result = await response.json();
            
            if (result.error) {
                setError(result.error);
                throw new Error(result.error);
            }
            
            setIsPending(false);
            return result.data;
        } catch (err: any) {
            setIsPending(false);
            setError(err.message || 'Failed to update subject stages');
            throw err;
        }
    };

    return { mutateAsync, isPending, error };
}
