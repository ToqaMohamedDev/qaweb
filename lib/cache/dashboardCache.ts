'use server';

import { unstable_cache } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

// =============================================
// Cached Data Functions
// =============================================

/**
 * جلب إعدادات التطبيق مع caching
 * البيانات نادراً ما تتغير - cache لمدة 10 دقائق
 */
export const getCachedAppSettings = unstable_cache(
    async () => {
        const supabase = await createServerClient();
        const { data } = await supabase
            .from('app_settings')
            .select('show_first_semester, show_second_semester')
            .eq('id', 'global')
            .single();
        
        return {
            showFirst: data?.show_first_semester ?? true,
            showSecond: data?.show_second_semester ?? true
        };
    },
    ['app-settings'],
    {
        revalidate: 600, // 10 دقائق
        tags: ['app-settings']
    }
);

/**
 * جلب المراحل الدراسية مع caching
 * البيانات ثابتة تقريباً - cache لمدة ساعة
 */
export const getCachedEducationalStages = unstable_cache(
    async () => {
        const supabase = await createServerClient();
        const { data } = await supabase
            .from('educational_stages')
            .select('id, name, slug, description, image_url, order_index')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        return data || [];
    },
    ['educational-stages'],
    {
        revalidate: 3600, // ساعة
        tags: ['stages']
    }
);

/**
 * جلب المرحلة الافتراضية مع caching
 */
export const getCachedDefaultStage = unstable_cache(
    async () => {
        const supabase = await createServerClient();
        const { data } = await supabase
            .from('educational_stages')
            .select('id, name')
            .eq('slug', 'grade-3-secondary')
            .single();
        
        return data;
    },
    ['default-stage'],
    {
        revalidate: 3600, // ساعة
        tags: ['stages']
    }
);

/**
 * جلب المواد لمرحلة معينة مع caching
 */
export const getCachedSubjectsForStage = unstable_cache(
    async (stageId: string) => {
        const supabase = await createServerClient();
        const { data } = await supabase
            .from('subject_stages' as any)
            .select(`
                subject_id,
                order_index,
                subjects!subject_stages_subject_id_fkey (
                    id,
                    name,
                    slug,
                    icon,
                    color,
                    description,
                    image_url,
                    is_active
                )
            `)
            .eq('stage_id', stageId)
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        return data || [];
    },
    ['subjects-for-stage'],
    {
        revalidate: 300, // 5 دقائق
        tags: ['subjects']
    }
);

/**
 * جلب عدد الدروس لكل مادة مع caching
 */
export const getCachedLessonsCount = unstable_cache(
    async (stageId: string, showFirst: boolean, showSecond: boolean) => {
        const supabase = await createServerClient();
        
        let query = supabase
            .from('lessons')
            .select('id, subject_id')
            .eq('is_published', true)
            .or(`stage_id.eq.${stageId},stage_id.is.null`);
        
        // فلتر الترم
        if (showFirst && !showSecond) {
            query = query.or('semester.eq.first,semester.eq.full_year');
        } else if (!showFirst && showSecond) {
            query = query.or('semester.eq.second,semester.eq.full_year');
        }
        
        const { data } = await query;
        
        // إنشاء map لعدد الدروس
        const countMap: Record<string, number> = {};
        (data || []).forEach(lesson => {
            countMap[lesson.subject_id] = (countMap[lesson.subject_id] || 0) + 1;
        });
        
        return countMap;
    },
    ['lessons-count'],
    {
        revalidate: 60, // دقيقة واحدة (الدروس تتغير أكثر)
        tags: ['lessons']
    }
);

/**
 * جلب الإحصائيات العامة مع caching
 */
export const getCachedPlatformStats = unstable_cache(
    async (stageId: string) => {
        const supabase = await createServerClient();
        
        const [usersResult, lessonsResult, ratingsResult] = await Promise.all([
            supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student'),
            supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('is_published', true)
                .eq('stage_id', stageId),
            supabase
                .from('teacher_ratings')
                .select('rating')
                .limit(100)
        ]);
        
        let averageRating = 4.8;
        if (ratingsResult.data && ratingsResult.data.length > 0) {
            const sum = ratingsResult.data.reduce((acc, r) => acc + (r.rating || 0), 0);
            averageRating = Math.round((sum / ratingsResult.data.length) * 10) / 10;
        }
        
        return {
            totalUsers: usersResult.count || 0,
            totalLessons: lessonsResult.count || 0,
            averageRating,
            successRate: 85
        };
    },
    ['platform-stats'],
    {
        revalidate: 300, // 5 دقائق
        tags: ['stats']
    }
);

// =============================================
// Cache Invalidation Helpers
// =============================================
// Note: Use revalidateTag('tag-name') in Server Actions when needed
// Available tags: 'app-settings', 'stages', 'subjects', 'lessons', 'stats'
