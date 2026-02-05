/**
 * useSubjects Hook - Uses unified dataService
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useSubjects as useSubjectsBase } from '@/lib/data/hooks';

export function useSubjects() {
    const { data, isLoading, isError, error, refetch } = useSubjectsBase({ active: true });
    
    const subjects = data || [];

    const getSubjectById = useCallback((id: string) => {
        return subjects.find(s => s.id === id);
    }, [subjects]);

    const getSubjectBySlug = useCallback((slug: string) => {
        return subjects.find(s => s.slug === slug);
    }, [subjects]);

    const status = useMemo(() => {
        if (isLoading) return 'loading' as const;
        if (isError) return 'error' as const;
        return 'success' as const;
    }, [isLoading, isError]);

    return {
        subjects,
        status,
        error: error?.message || null,
        getSubjectById,
        getSubjectBySlug,
        refetch,
    };
}
