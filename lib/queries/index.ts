/**
 * Queries Module - React Query-style Hooks for Admin Dashboard
 * 
 * This module provides hooks with mutateAsync/isPending API for CRUD operations.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// ==========================================
// Types
// ==========================================

type Tables = Database['public']['Tables'];
type Stage = Tables['educational_stages']['Row'];
type Subject = Tables['subjects']['Row'];
type Lesson = Tables['lessons']['Row'];
type Exam = Tables['comprehensive_exams']['Row'];
type Question = Tables['lesson_questions']['Row'];
type Profile = Tables['profiles']['Row'];

// ==========================================
// Generic Query Hook
// ==========================================

interface UseQueryResult<T> {
    data: T[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseMutationResult<TInput, TOutput = unknown> {
    mutateAsync: (input: TInput) => Promise<TOutput>;
    isPending: boolean;
    error: string | null;
}

// ==========================================
// Stages Hooks
// ==========================================

export function useStages(): UseQueryResult<Stage> {
    const [data, setData] = useState<Stage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            const { data: result, error: err } = await supabase
                .from('educational_stages')
                .select('*')
                .order('order_index', { ascending: true });

            if (err) throw err;
            setData(result || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching stages');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useCreateStage(): UseMutationResult<Partial<Stage>, Stage> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<Stage>): Promise<Stage> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('educational_stages')
                .insert(input as any)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error creating stage';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useUpdateStage(): UseMutationResult<Partial<Stage> & { id: string }, Stage> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<Stage> & { id: string }): Promise<Stage> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { id, ...updates } = input;
            const { data, error: err } = await supabase
                .from('educational_stages')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error updating stage';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useDeleteStage(): UseMutationResult<string, void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('educational_stages')
                .delete()
                .eq('id', id);

            if (err) throw err;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error deleting stage';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

// ==========================================
// Subjects Hooks
// ==========================================

export function useSubjects(): UseQueryResult<Subject> {
    const [data, setData] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            const { data: result, error: err } = await supabase
                .from('subjects')
                .select('*')
                .order('order_index', { ascending: true });

            if (err) throw err;
            setData(result || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching subjects');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useCreateSubject(): UseMutationResult<Partial<Subject>, Subject> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<Subject>): Promise<Subject> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('subjects')
                .insert(input as any)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error creating subject';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useUpdateSubject(): UseMutationResult<Partial<Subject> & { id: string }, Subject> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<Subject> & { id: string }): Promise<Subject> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { id, ...updates } = input;
            const { data, error: err } = await supabase
                .from('subjects')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error updating subject';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useDeleteSubject(): UseMutationResult<string, void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('subjects')
                .delete()
                .eq('id', id);

            if (err) throw err;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error deleting subject';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

// ==========================================
// Lessons Hooks
// ==========================================

interface UseLessonsOptions {
    stage_id?: string;
    subject_id?: string;
}

export function useLessons(options?: UseLessonsOptions): UseQueryResult<Lesson & { educational_stages: Stage | null; subjects: Subject | null }> {
    const [data, setData] = useState<(Lesson & { educational_stages: Stage | null; subjects: Subject | null })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            let query = supabase
                .from('lessons')
                .select('*, educational_stages(*), subjects(*)')
                .order('order_index', { ascending: true });

            if (options?.stage_id) {
                query = query.eq('stage_id', options.stage_id);
            }
            if (options?.subject_id) {
                query = query.eq('subject_id', options.subject_id);
            }

            const { data: result, error: err } = await query;

            if (err) throw err;
            setData(result || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching lessons');
        } finally {
            setIsLoading(false);
        }
    }, [options?.stage_id, options?.subject_id]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useCreateLesson(): UseMutationResult<Partial<Lesson>, Lesson> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<Lesson>): Promise<Lesson> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('lessons')
                .insert(input as any)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error creating lesson';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useUpdateLesson(): UseMutationResult<Partial<Lesson> & { id: string }, Lesson> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<Lesson> & { id: string }): Promise<Lesson> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { id, ...updates } = input;
            const { data, error: err } = await supabase
                .from('lessons')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error updating lesson';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useDeleteLesson(): UseMutationResult<string, void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('lessons')
                .delete()
                .eq('id', id);

            if (err) throw err;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error deleting lesson';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

// ==========================================
// Exams Hooks
// ==========================================

interface UseExamsOptions {
    stage_id?: string;
    subject_id?: string;
}

export function useExams(options?: UseExamsOptions): UseQueryResult<Exam> {
    const [data, setData] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            let query = supabase
                .from('comprehensive_exams')
                .select('*')
                .order('created_at', { ascending: false });

            if (options?.stage_id) {
                query = query.eq('stage_id', options.stage_id);
            }
            if (options?.subject_id) {
                query = query.eq('subject_id', options.subject_id);
            }

            const { data: result, error: err } = await query;

            if (err) throw err;
            setData(result || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching exams');
        } finally {
            setIsLoading(false);
        }
    }, [options?.stage_id, options?.subject_id]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useExam(id: string): { data: Exam | null; isLoading: boolean; error: string | null } {
    const [data, setData] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
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

export function useCreateExam(): UseMutationResult<Partial<Exam>, Exam> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: Partial<Exam>): Promise<Exam> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('comprehensive_exams')
                .insert(input as any)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error creating exam';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

interface UseUpdateExamInput {
    examId?: string;
    id?: string;
    updates?: Partial<Exam>;
    [key: string]: any;
}

export function useUpdateExam(): UseMutationResult<UseUpdateExamInput, Exam> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: UseUpdateExamInput): Promise<Exam> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            // Support both { examId, updates } and { id, ...updates } formats
            const examId = input.examId || input.id;
            const updates = input.updates || (() => {
                const { examId: _, id: __, ...rest } = input;
                return rest;
            })();

            if (!examId) throw new Error('Exam ID is required');

            const { data, error: err } = await supabase
                .from('comprehensive_exams')
                .update(updates as any)
                .eq('id', examId)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error updating exam';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useDeleteExam(): UseMutationResult<string, void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('comprehensive_exams')
                .delete()
                .eq('id', id);

            if (err) throw err;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error deleting exam';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

// ==========================================
// Questions Hooks
// ==========================================

interface UseQuestionsOptions {
    stage_id?: string;
    subject_id?: string;
    lesson_id?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    search?: string;
}

export function useQuestions(options?: UseQuestionsOptions): UseQueryResult<Question> {
    const [data, setData] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            let query = supabase
                .from('lesson_questions')
                .select('*, lessons!inner(id, title, stage_id, subject_id)')
                .order('created_at', { ascending: false })
                .order('order_index', { ascending: true });

            // Apply lesson filter first (most specific)
            if (options?.lesson_id) {
                query = query.eq('lesson_id', options.lesson_id);
            } else {
                // Apply stage filter via lessons join
                if (options?.stage_id) {
                    query = query.eq('lessons.stage_id', options.stage_id);
                }
                // Apply subject filter via lessons join
                if (options?.subject_id) {
                    query = query.eq('lessons.subject_id', options.subject_id);
                }
            }

            // Apply difficulty filter
            if (options?.difficulty) {
                query = query.eq('difficulty', options.difficulty);
            }

            // Apply search filter
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

export function useDeleteQuestion(): UseMutationResult<string, void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('lesson_questions')
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

export function useDeleteQuestions(): UseMutationResult<string[], void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (ids: string[]): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('lesson_questions')
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

// ==========================================
// Users Hooks
// ==========================================

export function useUsers(): UseQueryResult<Profile> {
    const [data, setData] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            const { data: result, error: err } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            setData(result || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching users');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useUpdateUser(): UseMutationResult<any, Profile> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: any): Promise<Profile> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            // Support both formats: { id, ...updates } and { teacherId, updates }
            let id: string;
            let updates: any;

            if (input.teacherId) {
                id = input.teacherId;
                updates = input.updates || {};
            } else if (input.id) {
                const { id: inputId, ...rest } = input;
                id = inputId;
                updates = rest;
            } else {
                throw new Error('Missing id or teacherId');
            }

            const { data, error: err } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (err) throw err;
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error updating user';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

export function useDeleteUser(): UseMutationResult<string, void> {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string): Promise<void> => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);
        try {
            const { error: err } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (err) throw err;
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error deleting user';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}

// ==========================================
// Teachers Hooks
// ==========================================

export function useTeachers(): UseQueryResult<Profile> {
    const [data, setData] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        const supabase = createClient();
        setIsLoading(true);
        try {
            const { data: result, error: err } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'teacher')
                .order('created_at', { ascending: false });

            if (err) throw err;
            setData(result || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching teachers');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useUpdateTeacher(): UseMutationResult<any, Profile> {
    return useUpdateUser();
}

export function useDeleteTeacher(): UseMutationResult<string, void> {
    return useDeleteUser();
}
