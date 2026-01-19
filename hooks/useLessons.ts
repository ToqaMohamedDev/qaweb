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

            // 1. Get Stage
            const { data: stage, error: stageError } = await supabase
                .from('educational_stages')
                .select('id, name')
                .eq('slug', DEFAULT_STAGE_SLUG)
                .single();

            if (stageError) {
                console.error('[useLessons] Stage error:', stageError);
                // Don't throw immediately, try to continue if possible or just log
                if (!stage) {
                    setStatus('error');
                    return;
                }
            }

            if (!stage) {
                console.warn('[useLessons] No stage found');
                setStatus('success');
                return;
            }

            setSelectedStageName(stage.name);

            // 2. Fetch Subjects and Lessons in parallel
            const [arabicSubjectRes, englishSubjectRes] = await Promise.all([
                supabase.from('subjects').select('id').eq('slug', ARABIC_SUBJECT_SLUG).single(),
                supabase.from('subjects').select('id').eq('slug', ENGLISH_SUBJECT_SLUG).single()
            ]);

            const promises = [];

            if (arabicSubjectRes.data) {
                promises.push(
                    supabase
                        .from('lessons')
                        .select('*')
                        .eq('subject_id', arabicSubjectRes.data.id)
                        // Replace educational_stage_id with stage_id
                        .eq('stage_id', stage.id)
                        // Sort by title since 'order' column is missing for now
                        .order('title', { ascending: true })
                        .limit(6)
                        .then(res => ({ type: 'arabic', ...res }))
                );
            }

            if (englishSubjectRes.data) {
                promises.push(
                    supabase
                        .from('lessons')
                        .select('*')
                        .eq('subject_id', englishSubjectRes.data.id)
                        // Replace educational_stage_id with stage_id
                        .eq('stage_id', stage.id)
                        // Sort by title since 'order' column is missing for now
                        .order('title', { ascending: true })
                        .limit(6)
                        .then(res => ({ type: 'english', ...res }))
                );
            }

            const results = await Promise.all(promises);

            results.forEach((res: any) => {
                if (res.type === 'arabic' && res.data) setArabicLessons(res.data);
                if (res.type === 'english' && res.data) setEnglishLessons(res.data);
                if (res.error) {
                    console.error(`[useLessons] Error fetching ${res.type}:`, JSON.stringify(res.error, null, 2));
                    console.error('Full Error Object:', res.error);
                }
            });

            setStatus('success');
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
