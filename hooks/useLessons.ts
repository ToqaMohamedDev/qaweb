/**
 * Home Lessons Hook
 * 
 * Hook for fetching lessons on the home page
 * UPDATED: Uses Server Actions to avoid client-side auth/network issues
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchHomeLessonsAction } from '@/lib/actions/lessons';
import type { Lesson } from '@/lib/types';

export function useHomeLessons() {
    const [arabicLessons, setArabicLessons] = useState<Lesson[]>([]);
    const [englishLessons, setEnglishLessons] = useState<Lesson[]>([]);
    const [selectedStageName, setSelectedStageName] = useState('الصف الثالث الثانوي');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');

    const fetchLessons = useCallback(async () => {
        setStatus('loading');

        try {
            console.log('[useLessons] Starting fetch via Server Action...');

            const result = await fetchHomeLessonsAction();

            if (result.success) {
                setArabicLessons(result.arabicLessons);
                setEnglishLessons(result.englishLessons);
                // Only update stage name if returned
                if (result.selectedStageName) {
                    setSelectedStageName(result.selectedStageName);
                }
                setStatus('success');
            } else {
                console.error('[useLessons] Server Action returned error:', result.error);
                setStatus('error');
            }
        } catch (error) {
            console.error('[useLessons] Global fetch error:', error);
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    return {
        arabicLessons,
        englishLessons,
        selectedStageName,
        status,
        refreshLessons: fetchLessons
    };
}
