/**
 * Admin Query Hooks
 * Uses server-side API for data fetching - works with HttpOnly cookies on Vercel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminQuery, adminUpdate, adminDelete } from '@/lib/api/adminClient';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Stage = Database['public']['Tables']['educational_stages']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type Exam = Database['public']['Tables']['comprehensive_exams']['Row'];

interface UseQueryResult<T> {
    data: T[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseMutationResult {
    mutateAsync: (input: any) => Promise<any>;
    isPending: boolean;
    error: string | null;
}

// ==========================================
// Users Hooks (Admin API Version)
// ==========================================

export function useUsersAPI(): UseQueryResult<Profile> {
    const [data, setData] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await adminQuery<Profile>({
            table: 'profiles',
            orderBy: 'created_at',
            ascending: false,
            limit: 500,
        });

        setData(result.data);
        setError(result.error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

export function useUpdateUserAPI(): UseMutationResult {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: { userId: string; updates: any }) => {
        setIsPending(true);
        setError(null);

        const result = await adminUpdate<Profile>('profiles', input.userId, input.updates);

        setIsPending(false);
        if (result.error) {
            setError(result.error);
            throw new Error(result.error);
        }
        return result.data;
    };

    return { mutateAsync, isPending, error };
}

export function useDeleteUserAPI(): UseMutationResult {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (id: string) => {
        setIsPending(true);
        setError(null);

        const result = await adminDelete('profiles', id);

        setIsPending(false);
        if (result.error) {
            setError(result.error);
            throw new Error(result.error);
        }
    };

    return { mutateAsync, isPending, error };
}

// ==========================================
// Teachers Hooks (Admin API Version)
// ==========================================

export function useTeachersAPI(): UseQueryResult<Profile> {
    const [data, setData] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await adminQuery<Profile>({
            table: 'profiles',
            orderBy: 'created_at',
            ascending: false,
            filterColumn: 'role',
            filterValue: 'teacher',
            limit: 500,
        });

        setData(result.data);
        setError(result.error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

// ==========================================
// Stages Hooks (Admin API Version)
// ==========================================

export function useStagesAPI(): UseQueryResult<Stage> {
    const [data, setData] = useState<Stage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await adminQuery<Stage>({
            table: 'educational_stages',
            orderBy: 'order_index',
            ascending: true,
            limit: 100,
        });

        setData(result.data);
        setError(result.error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

// ==========================================
// Subjects Hooks (Admin API Version)
// ==========================================

export function useSubjectsAPI(): UseQueryResult<Subject> {
    const [data, setData] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await adminQuery<Subject>({
            table: 'subjects',
            orderBy: 'order_index',
            ascending: true,
            limit: 100,
        });

        setData(result.data);
        setError(result.error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

// ==========================================
// Lessons Hooks (Admin API Version)
// ==========================================

export function useLessonsAPI(): UseQueryResult<Lesson> {
    const [data, setData] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await adminQuery<Lesson>({
            table: 'lessons',
            orderBy: 'order_index',
            ascending: true,
            limit: 500,
        });

        setData(result.data);
        setError(result.error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

// ==========================================
// Exams Hooks (Admin API Version)
// ==========================================

export function useExamsAPI(): UseQueryResult<Exam> {
    const [data, setData] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await adminQuery<Exam>({
            table: 'comprehensive_exams',
            orderBy: 'created_at',
            ascending: false,
            limit: 500,
        });

        setData(result.data);
        setError(result.error);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}
