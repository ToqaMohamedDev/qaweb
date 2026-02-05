/**
 * ============================================================================
 * EXAMS API - جلب الامتحانات مع فلترة المرحلة الدراسية
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);

        // الحصول على المعاملات
        let stageId = searchParams.get('stage_id');
        const type = searchParams.get('type'); // 'comprehensive' | 'teacher' | 'all'
        const subjectId = searchParams.get('subject_id');
        const limit = searchParams.get('limit');
        const teacherId = searchParams.get('teacher_id');

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

        const results: {
            comprehensive: unknown[];
            teacher: unknown[];
        } = {
            comprehensive: [],
            teacher: [],
        };

        // جلب امتحانات الموقع (Comprehensive)
        if (!type || type === 'comprehensive' || type === 'all') {
            let compQuery = supabase
                .from('comprehensive_exams')
                .select(`
                    id,
                    exam_title,
                    description,
                    type,
                    duration_minutes,
                    is_published,
                    stage_id,
                    subject_id,
                    created_at,
                    subject:subjects(id, name),
                    stage:educational_stages(id, name)
                `)
                .eq('is_published', true);

            if (stageId) {
                compQuery = compQuery.eq('stage_id', stageId);
            }
            if (subjectId) {
                compQuery = compQuery.eq('subject_id', subjectId);
            }

            compQuery = compQuery.order('created_at', { ascending: false });

            if (limit) {
                compQuery = compQuery.limit(parseInt(limit));
            }

            const { data: compExams, error: compError } = await compQuery;

            if (compError) {
                console.error('[Exams API] Comprehensive error:', compError);
            } else {
                results.comprehensive = (compExams || []).map((exam: any) => ({
                    ...exam,
                    source: 'comprehensive',
                }));
            }
        }

        // جلب امتحانات المدرسين (Teacher)
        if (!type || type === 'teacher' || type === 'all') {
            let teacherQuery = supabase
                .from('teacher_exams')
                .select(`
                    id,
                    exam_title,
                    description,
                    type,
                    duration_minutes,
                    is_published,
                    stage_id,
                    subject_id,
                    created_by,
                    created_at,
                    subject:subjects(id, name),
                    stage:educational_stages(id, name),
                    teacher:profiles!teacher_exams_created_by_fkey(id, name, avatar_url)
                `)
                .eq('is_published', true);

            if (stageId) {
                teacherQuery = teacherQuery.eq('stage_id', stageId);
            }
            if (subjectId) {
                teacherQuery = teacherQuery.eq('subject_id', subjectId);
            }
            if (teacherId) {
                teacherQuery = teacherQuery.eq('created_by', teacherId);
            }

            teacherQuery = teacherQuery.order('created_at', { ascending: false });

            if (limit) {
                teacherQuery = teacherQuery.limit(parseInt(limit));
            }

            const { data: teacherExams, error: teacherError } = await teacherQuery;

            if (teacherError) {
                console.error('[Exams API] Teacher error:', teacherError);
            } else {
                results.teacher = (teacherExams || []).map((exam: any) => ({
                    ...exam,
                    source: 'teacher',
                }));
            }
        }

        // دمج النتائج إذا طُلب الكل
        let data;
        if (type === 'comprehensive') {
            data = results.comprehensive;
        } else if (type === 'teacher') {
            data = results.teacher;
        } else {
            // دمج وترتيب حسب التاريخ
            data = [...results.comprehensive, ...results.teacher].sort(
                (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        return NextResponse.json({
            success: true,
            data,
            stageId: stageId || null,
            counts: {
                comprehensive: results.comprehensive.length,
                teacher: results.teacher.length,
                total: results.comprehensive.length + results.teacher.length,
            },
        });

    } catch (error) {
        console.error('[Exams API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
