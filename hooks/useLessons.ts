/**
 * Home Lessons Hook
 * 
 * Hook for fetching lessons on the home page
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { Lesson } from '@/lib/types';

// Default stage for home page (3rd secondary)
const DEFAULT_STAGE_SLUG = 'grade-3-secondary';
const ARABIC_SUBJECT_SLUG = 'arabic';
const ENGLISH_SUBJECT_SLUG = 'english';

export function useHomeLessons() {
    const [arabicLessons, setArabicLessons] = useState<Lesson[]>([]);
    const [englishLessons, setEnglishLessons] = useState<Lesson[]>([]);
    const [selectedStageName, setSelectedStageName] = useState('الصف الثالث الثانوي');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');

    const fetchLessons = useCallback(async () => {
        const supabase = createClient();
        setStatus('loading');

        try {
            console.log('[useLessons] Starting fetch...');

            // Get 3rd secondary stage directly
            console.log('[useLessons] Querying educational_stages...');

            const { data: stage, error: stageError } = await supabase
                .from('educational_stages')
                .select('id, name')
                .eq('slug', DEFAULT_STAGE_SLUG)
                .single();

            console.log('[useLessons] Stage result:', { stage, error: stageError });

            if (stageError) {
                console.error('[useLessons] Stage error details:', JSON.stringify(stageError, null, 2));
            }

            if (!stage) {
                console.warn('[useLessons] No stage found for slug:', DEFAULT_STAGE_SLUG);
                setStatus('success');
                return;
            }

            setSelectedStageName(stage.name);

            // Get Arabic subject
            const { data: arabicSubject } = await supabase
                .from('subjects')
                .select('id')
                .eq('slug', ARABIC_SUBJECT_SLUG)
                .single();

            // Get English subject
            const { data: englishSubject } = await supabase
                .from('subjects')
                .select('id')
                .eq('slug', ENGLISH_SUBJECT_SLUG)
                .single();

            // Fetch Arabic lessons for this stage
            if (arabicSubject) {
                const { data: arabic, error: arabicError } = await supabase
                    .from('lessons')
                    .select('*')
                    .eq('stage_id', stage.id)
                    .eq('subject_id', arabicSubject.id)
                    .eq('is_published', true)
                    .order('order_index', { ascending: true });

                console.log('Arabic lessons fetched:', arabic?.length, 'Stage:', stage.id, 'Subject:', arabicSubject.id);
                if (arabicError) console.error('Arabic error:', arabicError);
                setArabicLessons((arabic || []) as unknown as Lesson[]);
            }

            // Fetch English lessons for this stage
            if (englishSubject) {
                const { data: english, error: englishError } = await supabase
                    .from('lessons')
                    .select('*')
                    .eq('stage_id', stage.id)
                    .eq('subject_id', englishSubject.id)
                    .eq('is_published', true)
                    .order('order_index', { ascending: true });

                console.log('English lessons fetched:', english?.length, 'Stage:', stage.id, 'Subject:', englishSubject.id);
                if (englishError) console.error('English error:', englishError);
                setEnglishLessons((english || []) as unknown as Lesson[]);
            }

            setStatus('success');
        } catch (error) {
            console.error('Error fetching lessons:', error);
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
        refetch: fetchLessons,
    };
}

// Generic lessons hook with filters
export function useLessons(filters?: {
    subjectId?: string;
    stageId?: string;
    isPublished?: boolean;
}) {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLessons = useCallback(async () => {
        const supabase = createClient();
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('lessons')
                .select('*, educational_stages(*), subjects(*)')
                .order('order_index', { ascending: true });

            if (filters?.stageId) {
                query = query.eq('stage_id', filters.stageId);
            }
            if (filters?.subjectId) {
                query = query.eq('subject_id', filters.subjectId);
            }
            if (filters?.isPublished !== undefined) {
                query = query.eq('is_published', filters.isPublished);
            }

            const { data, error: err } = await query;

            if (err) throw err;
            setLessons((data || []) as unknown as Lesson[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching lessons');
        } finally {
            setLoading(false);
        }
    }, [filters?.subjectId, filters?.stageId, filters?.isPublished]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    return { lessons, loading, error, refetch: fetchLessons };
}
