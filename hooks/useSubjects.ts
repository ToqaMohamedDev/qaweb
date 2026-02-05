/**
 * useSubjects Hook - Uses API route for consistency with teachers
 * 
 * This hook fetches subjects via the /api/subjects endpoint
 * to ensure unified data fetching strategy across the app
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface Subject {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const isMounted = useRef(true);
    const hasFetched = useRef(false);

    const fetchSubjects = useCallback(async () => {
        // Safety timeout - ensure we don't hang forever
        const timeoutId = setTimeout(() => {
            if (isMounted.current && isLoading) {
                console.warn('[useSubjects] Safety timeout triggered after 10s');
                setIsLoading(false);
                setIsError(true);
                setError(new Error('Request timeout'));
            }
        }, 10000);

        try {
            setIsLoading(true);
            setIsError(false);
            setError(null);

            const response = await fetch('/api/subjects');
            const result = await response.json();

            if (isMounted.current) {
                if (result.success) {
                    setSubjects(result.data || []);
                } else {
                    console.warn('[useSubjects] API returned error:', result.error);
                    setSubjects([]);
                }
                setIsLoading(false);
            }
        } catch (err) {
            console.error('[useSubjects] Fetch error:', err);
            if (isMounted.current) {
                setIsError(true);
                setError(err instanceof Error ? err : new Error('Failed to fetch subjects'));
                setSubjects([]);
                setIsLoading(false);
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchSubjects();
        }
        
        return () => {
            isMounted.current = false;
        };
    }, [fetchSubjects]);

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
        refetch: fetchSubjects,
    };
}
