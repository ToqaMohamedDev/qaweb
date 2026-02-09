/**
 * Unified Data Hooks
 * 
 * React hooks for data fetching with caching and loading states
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataService } from './service';
import type {
    AdminStats,
    DashboardData,
    LessonFilters,
    ExamFilters,
    Profile,
} from './types';

// =============================================
// Generic Query Hook
// =============================================

interface UseQueryOptions {
    enabled?: boolean;
    refetchOnMount?: boolean;
}

interface UseQueryResult<T> {
    data: T | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

// Safety timeout constant - prevent infinite hangs
const QUERY_TIMEOUT_MS = 15000; // 15 seconds

function useQuery<T>(
    queryFn: () => Promise<T>,
    deps: unknown[] = [],
    options: UseQueryOptions = {}
): UseQueryResult<T> {
    const { enabled = true, refetchOnMount = true } = options;
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const isMounted = useRef(true);

    // Store queryFn in a ref to avoid dependency issues
    const queryFnRef = useRef(queryFn);
    queryFnRef.current = queryFn;

    // Track if initial fetch has been done
    const hasFetched = useRef(false);

    const fetch = useCallback(async () => {
        if (!enabled) return;

        setIsLoading(true);
        setIsError(false);
        setError(null);

        // Safety timeout - ensure we don't hang forever
        let timeoutTriggered = false;
        const timeoutId = setTimeout(() => {
            timeoutTriggered = true;
            if (isMounted.current) {
                console.warn('[useQuery] Safety timeout triggered after', QUERY_TIMEOUT_MS, 'ms');
                setIsLoading(false);
                setIsError(true);
                setError(new Error('Request timeout'));
            }
        }, QUERY_TIMEOUT_MS);

        try {
            const result = await queryFnRef.current();
            if (isMounted.current && !timeoutTriggered) {
                setData(result);
                setIsLoading(false);
            }
        } catch (err) {
            if (isMounted.current && !timeoutTriggered) {
                setIsError(true);
                setError(err instanceof Error ? err : new Error('Unknown error'));
                setIsLoading(false);
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }, [enabled]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        isMounted.current = true;

        // Only fetch if enabled and (refetchOnMount or first time)
        if (enabled && (refetchOnMount || !hasFetched.current)) {
            hasFetched.current = true;
            fetch();
        }

        return () => {
            isMounted.current = false;
        };
    }, [...deps, enabled, refetchOnMount]);

    return { data, isLoading, isError, error, refetch: fetch };
}

// =============================================
// Stages Hook
// =============================================

export function useStages(options?: { active?: boolean }) {
    return useQuery(
        () => dataService.getStages(options),
        [options?.active]
    );
}

// =============================================
// Subjects Hook
// =============================================

export function useSubjects(options?: { stageId?: string; active?: boolean }) {
    return useQuery(
        () => dataService.getSubjects(options),
        [options?.stageId, options?.active]
    );
}

export function useSubjectsWithLessons(stageId: string | null, semester?: 'first' | 'second' | 'full_year') {
    return useQuery(
        () => stageId ? dataService.getSubjectsWithLessonsCount(stageId, semester) : Promise.resolve([]),
        [stageId, semester],
        { enabled: !!stageId }
    );
}

// =============================================
// Lessons Hook
// =============================================

export function useLessons(filters: LessonFilters) {
    return useQuery(
        () => dataService.getLessons(filters),
        [filters.stageId, filters.subjectId, filters.semester, filters.isPublished]
    );
}

// =============================================
// Exams Hook
// =============================================

export function useExams(filters: ExamFilters) {
    return useQuery(
        () => dataService.getExams(filters),
        [filters.stageId, filters.subjectId, filters.isPublished, filters.createdBy, filters.type]
    );
}

// =============================================
// Stats Hooks
// =============================================

export function usePlatformStats(stageId?: string) {
    return useQuery(
        () => dataService.getPlatformStats(stageId),
        [stageId]
    );
}

export function useAdminStats() {
    return useQuery(
        () => dataService.getAdminStats(),
        []
    );
}

// =============================================
// Dashboard Hook (Unified)
// =============================================

interface UseDashboardOptions {
    userId?: string;
}

interface UseDashboardReturn extends DashboardData {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useDashboard(options?: UseDashboardOptions): UseDashboardReturn {
    const [state, setState] = useState<DashboardData>({
        subjects: [],
        stageName: '',
        stageId: null,
        currentSemester: 'full_year',
        stats: { totalUsers: 0, totalLessons: 0, averageRating: 4.8, successRate: 85 },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        try {
            const data = await dataService.getDashboardData(options?.userId);
            setState(data);
        } catch (err) {
            setIsError(true);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    }, [options?.userId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return {
        ...state,
        isLoading,
        isError,
        error,
        refetch: fetch,
    };
}

// =============================================
// Admin Dashboard Hook
// =============================================

interface UseAdminDashboardReturn {
    stats: AdminStats;
    recentUsers: Profile[];
    recentExams: Array<{ id: string; examTitle: string; is_published: boolean; type: string; language: string; created_at: string }>;
    activities: Array<{ id: string; type: string; action: string; description: string; time: string }>;
    chartData: { users: number[]; exams: number[]; lessons: number[] };
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalExams: 0,
        publishedExams: 0,
        totalLessons: 0,
        totalStages: 0,
        totalSubjects: 0,
        totalQuestions: 0,
        averageRating: 0,
        successRate: 0,
    });
    const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
    const [recentExams, setRecentExams] = useState<Array<{ id: string; examTitle: string; is_published: boolean; type: string; language: string; created_at: string }>>([]);
    const [activities] = useState<Array<{ id: string; type: string; action: string; description: string; time: string }>>([]);
    const [chartData] = useState({ users: [], exams: [], lessons: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        try {
            // Fetch stats from service
            const adminStats = await dataService.getAdminStats();
            setStats(adminStats);

            // Fetch recent data directly (not cached)
            const response = await window.fetch('/api/admin/dashboard', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setRecentUsers(data.recentUsers || []);
                setRecentExams(data.recentExams || []);
            }
        } catch (err) {
            setIsError(true);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return {
        stats,
        recentUsers,
        recentExams,
        activities,
        chartData,
        isLoading,
        isError,
        error,
        refetch: fetch,
    };
}

// =============================================
// Re-exports for backward compatibility
// =============================================

export { useQuery };
export type { UseQueryOptions, UseQueryResult };
