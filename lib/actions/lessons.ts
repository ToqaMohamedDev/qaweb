'use server';

import { createServerClient } from '@/lib/supabase/server';

const DEFAULT_STAGE_SLUG = 'grade-3-secondary';
const ARABIC_SUBJECT_SLUG = 'arabic';
const ENGLISH_SUBJECT_SLUG = 'english';

export async function fetchHomeLessonsAction() {
    const supabase = await createServerClient();

    try {
        // 1. Try to get user's selected educational stage from their profile
        let stageId: string | null = null;
        let stageName: string = '';

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Get user's profile with their selected educational stage
            const { data: profile } = await supabase
                .from('profiles')
                .select('educational_stage_id')
                .eq('id', user.id)
                .single();

            if (profile?.educational_stage_id) {
                // Get the stage name for the user's selected stage
                const { data: userStage } = await supabase
                    .from('educational_stages')
                    .select('id, name')
                    .eq('id', profile.educational_stage_id)
                    .single();

                if (userStage) {
                    stageId = userStage.id;
                    stageName = userStage.name;
                }
            }
        }

        // 2. If no user stage found, fallback to default stage (grade-3-secondary)
        if (!stageId) {
            const { data: defaultStage, error: stageError } = await supabase
                .from('educational_stages')
                .select('id, name')
                .eq('slug', DEFAULT_STAGE_SLUG)
                .single();

            if (stageError || !defaultStage) {
                console.error('Fetch lessons error (Stage):', stageError);
                return { error: 'Stage not found', arabicLessons: [], englishLessons: [], selectedStageName: '' };
            }

            stageId = defaultStage.id;
            stageName = defaultStage.name;
        }

        // Use the determined stage for fetching lessons
        const stage = { id: stageId, name: stageName };

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
