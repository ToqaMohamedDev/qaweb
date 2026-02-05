/**
 * ============================================================================
 * LESSONS API - جلب الدروس مع فلترة المرحلة الدراسية
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);

        // الحصول على المرحلة من الـ query params
        let stageId = searchParams.get('stage_id');
        const subjectId = searchParams.get('subject_id');
        const limit = searchParams.get('limit');

        // إذا لم يتم تحديد المرحلة، جلبها من بروفايل المستخدم
        if (!stageId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('educational_stage_id')
                    .eq('id', user.id)
                    .single();
                stageId = profile?.educational_stage_id ?? null;
            }
        }

        // بناء الـ query
        let query = supabase
            .from('lessons')
            .select(`
                id,
                title,
                description,
                order_index,
                is_published,
                stage_id,
                subject_id,
                created_at,
                subject:subjects(id, name, slug),
                stage:educational_stages(id, name, slug)
            `)
            .eq('is_published', true);

        // إضافة فلترة المرحلة إذا وُجدت
        if (stageId) {
            query = query.eq('stage_id', stageId);
        }

        // إضافة فلترة المادة إذا وُجدت
        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        // إضافة الترتيب
        query = query.order('order_index', { ascending: true });

        // إضافة الحد الأقصى إذا وُجد
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data: lessons, error } = await query;

        if (error) {
            console.error('[Lessons API] Error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: lessons,
            stageId: stageId || null,
        });

    } catch (error) {
        console.error('[Lessons API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
