'use server';

import { createClient } from '@/lib/supabase-server';

const DEFAULT_STAGE_SLUG = 'grade-3-secondary';
const ARABIC_SUBJECT_SLUG = 'arabic';
const ENGLISH_SUBJECT_SLUG = 'english';

export async function fetchHomeLessonsAction() {
    const supabase = await createClient();

    try {
        // 1. Get Stage
        const { data: stage, error: stageError } = await supabase
            .from('educational_stages')
            .select('id, name')
            .eq('slug', DEFAULT_STAGE_SLUG)
            .single();

        if (stageError || !stage) {
            console.error('Fetch lessons error (Stage):', stageError);
            return { error: 'Stage not found', arabicLessons: [], englishLessons: [], selectedStageName: '' };
        }

        // 2. Fetch Subjects
        const [arabicSubjectRes, englishSubjectRes] = await Promise.all([
            supabase.from('subjects').select('id').eq('slug', ARABIC_SUBJECT_SLUG).single(),
            supabase.from('subjects').select('id').eq('slug', ENGLISH_SUBJECT_SLUG).single()
        ]);

        const promises = [];
        let arabicLessons: any[] = [];
        let englishLessons: any[] = [];

        if (arabicSubjectRes.data) {
            promises.push(
                supabase
                    .from('lessons')
                    .select('*')
                    .eq('subject_id', arabicSubjectRes.data.id)
                    .eq('stage_id', stage.id)
                    .order('title', { ascending: true })
                    .limit(6)
                    .then(res => {
                        if (res.data) arabicLessons = res.data;
                        return res;
                    })
            );
        }

        if (englishSubjectRes.data) {
            promises.push(
                supabase
                    .from('lessons')
                    .select('*')
                    .eq('subject_id', englishSubjectRes.data.id)
                    .eq('stage_id', stage.id)
                    .order('title', { ascending: true })
                    .limit(6)
                    .then(res => {
                        if (res.data) englishLessons = res.data;
                        return res;
                    })
            );
        }

        await Promise.all(promises);

        return {
            arabicLessons,
            englishLessons,
            selectedStageName: stage.name,
            success: true
        };

    } catch (error) {
        console.error('Server Action Error:', error);
        return {
            error: 'Failed to fetch lessons',
            arabicLessons: [],
            englishLessons: [],
            selectedStageName: ''
        };
    }
}
