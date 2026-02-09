// ═══════════════════════════════════════════════════════════════════════════
// useApiQuery - Generic Hook لـ API Queries و Mutations
// يقلل التكرار في adminQueries.ts وغيره
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminQuery, adminInsert, adminUpdate, adminDelete } from '@/lib/api/adminClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QueryConfig {
    table: string;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    filterColumn?: string;
    filterValue?: string;
    enabled?: boolean;
}

export interface UseQueryResult<T> {
    data: T[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export interface UseMutationResult<TInput = any, TOutput = any> {
    mutateAsync: (input: TInput) => Promise<TOutput>;
    isPending: boolean;
    error: string | null;
    reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC QUERY HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useApiQuery<T>(config: QueryConfig): UseQueryResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const { table, orderBy, ascending, limit, filterColumn, filterValue, enabled = true } = config;

    const refetch = useCallback(async () => {
        console.log(`[useApiQuery] refetch called for table: ${table}, enabled: ${enabled}`);
        
        if (!enabled) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await adminQuery<T>({
            table,
            orderBy,
            ascending,
            limit,
            filterColumn,
            filterValue,
        });

        console.log(`[useApiQuery] Result for ${table}:`, result.data?.length || 0, 'items, error:', result.error);

        if (isMounted.current) {
            setData(result.data);
            setError(result.error);
            setIsLoading(false);
        }
    }, [table, orderBy, ascending, limit, filterColumn, filterValue, enabled]);

    // Fetch data on mount and when config changes
    useEffect(() => {
        isMounted.current = true;
        console.log(`[useApiQuery] useEffect triggered for table: ${table}, enabled: ${enabled}`);
        
        if (enabled) {
            refetch();
        } else {
            setIsLoading(false);
        }
        
        return () => {
            isMounted.current = false;
        };
    }, [table, enabled, refetch]);

    return { data, isLoading, error, refetch };
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC CREATE MUTATION HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useApiCreate<T>(table: string): UseMutationResult<Partial<T>, T | null> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<T>): Promise<T | null> => {
        setIsPending(true);
        setError(null);

        const result = await adminInsert<T>(table, input);

        setIsPending(false);
        if (result.error) {
            setError(result.error);
            throw new Error(result.error);
        }
        return result.data;
    };

    const reset = () => {
        setError(null);
        setIsPending(false);
    };

    return { mutateAsync, isPending, error, reset };
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC UPDATE MUTATION HOOK (with optional callback for UI refresh)
// ═══════════════════════════════════════════════════════════════════════════

interface UpdateInput<T> {
    id: string;
    updates: Partial<T>;
}

export interface UseMutationResultWithRefetch<TInput = any, TOutput = any> extends UseMutationResult<TInput, TOutput> {
    onSuccess: (callback: () => void) => void;
}

export function useApiUpdate<T>(table: string): UseMutationResultWithRefetch<UpdateInput<T>, T | null> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const successCallbackRef = useRef<(() => void) | null>(null);

    const mutateAsync = async (input: UpdateInput<T>): Promise<T | null> => {
        setIsPending(true);
        setError(null);

        const result = await adminUpdate<T>(table, input.id, input.updates);

        setIsPending(false);
        if (result.error) {
            setError(result.error);
            throw new Error(result.error);
        }
        
        // Call success callback to trigger UI refresh
        if (successCallbackRef.current) {
            successCallbackRef.current();
        }
        
        return result.data;
    };

    const reset = () => {
        setError(null);
        setIsPending(false);
    };

    const onSuccess = (callback: () => void) => {
        successCallbackRef.current = callback;
    };

    return { mutateAsync, isPending, error, reset, onSuccess };
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC DELETE MUTATION HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useApiDelete(table: string): UseMutationResult<string, void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        setIsPending(true);
        setError(null);

        const result = await adminDelete(table, id);

        setIsPending(false);
        if (result.error) {
            setError(result.error);
            throw new Error(result.error);
        }
    };

    const reset = () => {
        setError(null);
        setIsPending(false);
    };

    return { mutateAsync, isPending, error, reset };
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-CONFIGURED HOOKS (لسهولة الاستخدام)
// ═══════════════════════════════════════════════════════════════════════════

// Users
export const useUsers = () => useApiQuery({ table: 'profiles', orderBy: 'created_at', ascending: false, limit: 500 });
export const useCreateUser = () => useApiCreate('profiles');
export const useUpdateUser = () => useApiUpdate('profiles');
export const useDeleteUser = () => useApiDelete('profiles');

// Teachers
export const useTeachers = () => useApiQuery({ table: 'profiles', orderBy: 'created_at', ascending: false, filterColumn: 'role', filterValue: 'teacher', limit: 500 });

// Stages
export const useStages = () => useApiQuery({ table: 'educational_stages', orderBy: 'order_index', ascending: true, limit: 100 });
export const useCreateStage = () => useApiCreate('educational_stages');
export const useUpdateStage = () => useApiUpdate('educational_stages');
export const useDeleteStage = () => useApiDelete('educational_stages');

// Subjects
export const useSubjects = () => useApiQuery({ table: 'subjects', orderBy: 'order_index', ascending: true, limit: 100 });
export const useCreateSubject = () => useApiCreate('subjects');
export const useUpdateSubject = () => useApiUpdate('subjects');
export const useDeleteSubject = () => useApiDelete('subjects');

// Lessons
export const useLessons = () => useApiQuery({ table: 'lessons', orderBy: 'order_index', ascending: true, limit: 500 });
export const useCreateLesson = () => useApiCreate('lessons');
export const useUpdateLesson = () => useApiUpdate('lessons');
export const useDeleteLesson = () => useApiDelete('lessons');

// Exams
export const useExams = () => useApiQuery({ table: 'comprehensive_exams', orderBy: 'created_at', ascending: false, limit: 500 });
export const useCreateExam = () => useApiCreate('comprehensive_exams');
export const useUpdateExam = () => useApiUpdate('comprehensive_exams');
export const useDeleteExam = () => useApiDelete('comprehensive_exams');

// Question Banks
export const useQuestionBanks = () => useApiQuery({ table: 'question_banks', orderBy: 'created_at', ascending: false, limit: 500 });
export const useDeleteQuestionBank = () => useApiDelete('question_banks');
