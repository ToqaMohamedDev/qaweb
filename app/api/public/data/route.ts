/**
 * Public Data API Route
 * =====================
 * Provides public data (no authentication required)
 * Uses server-side Supabase client for Vercel compatibility
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// =============================================
// Constants
// =============================================

const ALLOWED_ENTITIES = new Set([
    'teachers',
    'stages',
    'subjects',
    'lessons',
    'exams'
]);

// =============================================
// Helper
// =============================================

async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { /* Read-only in API routes */ },
            },
        }
    );
}

// =============================================
// GET - Fetch Public Data
// =============================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entity = searchParams.get('entity');
        const stageId = searchParams.get('stageId');
        const subjectId = searchParams.get('subjectId');
        const language = searchParams.get('language');
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

        if (!entity || !ALLOWED_ENTITIES.has(entity)) {
            return NextResponse.json(
                { error: 'Invalid entity' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        let data: any[] = [];
        let error: any = null;

        switch (entity) {
            case 'teachers': {
                // Get approved teachers
                const result = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'teacher')
                    .eq('is_teacher_approved', true)
                    .order('subscriber_count', { ascending: false })
                    .limit(limit);

                if (result.error) {
                    error = result.error;
                } else {
                    data = result.data || [];

                    // Get exam counts for teachers
                    if (data.length > 0) {
                        const teacherIds = data.map(t => t.id);

                        const { data: teacherExamCounts } = await supabase
                            .from('teacher_exams')
                            .select('created_by')
                            .in('created_by', teacherIds)
                            .eq('is_published', true);

                        const { data: compExamCounts } = await supabase
                            .from('comprehensive_exams')
                            .select('created_by')
                            .in('created_by', teacherIds)
                            .eq('is_published', true);

                        const examCountMap: Record<string, number> = {};
                        (teacherExamCounts || []).forEach((exam: any) => {
                            examCountMap[exam.created_by] = (examCountMap[exam.created_by] || 0) + 1;
                        });
                        (compExamCounts || []).forEach((exam: any) => {
                            if (exam.created_by) {
                                examCountMap[exam.created_by] = (examCountMap[exam.created_by] || 0) + 1;
                            }
                        });

                        data = data.map(teacher => ({
                            ...teacher,
                            coverImageURL: teacher.cover_image_url || null,
                            photoURL: teacher.avatar_url,
                            displayName: teacher.name,
                            isVerified: teacher.is_verified || false,
                            specialty: teacher.specialization || teacher.bio,
                            subscriberCount: teacher.subscriber_count || 0,
                            examsCount: examCountMap[teacher.id] || 0,
                            exams_count: examCountMap[teacher.id] || 0,
                        }));
                    }
                }
                break;
            }

            case 'stages': {
                const result = await supabase
                    .from('educational_stages')
                    .select('*')
                    .order('order_index', { ascending: true })
                    .limit(limit);

                data = result.data || [];
                error = result.error;
                break;
            }

            case 'subjects': {
                let query = supabase
                    .from('subjects')
                    .select('*')
                    .order('order_index', { ascending: true })
                    .limit(limit);

                if (stageId) {
                    query = query.eq('stage_id', stageId);
                }

                const result = await query;
                data = result.data || [];
                error = result.error;
                break;
            }

            case 'lessons': {
                let query = supabase
                    .from('lessons')
                    .select('id, title, description, order_index, stage_id, subject_id')
                    .eq('is_published', true)
                    .order('order_index', { ascending: true })
                    .limit(limit);

                if (stageId) {
                    query = query.eq('stage_id', stageId);
                }
                if (subjectId) {
                    query = query.eq('subject_id', subjectId);
                }

                const result = await query;
                data = result.data || [];
                error = result.error;
                break;
            }

            case 'exams': {
                let query = supabase
                    .from('comprehensive_exams')
                    .select('id, exam_title, exam_description, duration_minutes, total_marks, stage_id, language')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (stageId) {
                    query = query.or(`stage_id.eq.${stageId},stage_id.is.null`);
                }
                if (language) {
                    query = query.eq('language', language);
                }

                const result = await query;
                data = (result.data || []).map(e => ({
                    id: e.id,
                    title: e.exam_title,
                    description: e.exam_description,
                    duration_minutes: e.duration_minutes,
                    total_marks: e.total_marks,
                    stage_id: e.stage_id,
                    language: e.language,
                    type: 'comprehensive'
                }));
                error = result.error;
                break;
            }
        }

        if (error) {
            console.error(`[Public API] Error fetching ${entity}:`, error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data, success: true });

    } catch (error) {
        console.error('[Public API] Unexpected Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
