/**
 * useSubjects Hook - Simple version
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getActiveSubjects } from '@/lib/services';
import type { Subject } from '@/lib/types';

export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setStatus('loading');
        setError(null);

        try {
            const data = await getActiveSubjects();
            setSubjects(data);
            setStatus('success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getSubjectById = useCallback((id: string) => {
        return subjects.find(s => s.id === id);
    }, [subjects]);

    const getSubjectBySlug = useCallback((slug: string) => {
        return subjects.find(s => s.slug === slug);
    }, [subjects]);

    return {
        subjects,
        status,
        error,
        getSubjectById,
        getSubjectBySlug,
        refetch: fetchData,
    };
}
