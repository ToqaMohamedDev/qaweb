/**
 * Public Data API Route
 * =====================
 * Provides public data (no authentication required)
 * Uses server-side Supabase client for Vercel compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// =============================================
// Constants
// =============================================

const ALLOWED_ENTITIES = new Set([
    'teachers',
    'teacher_profile',  // Single teacher by ID
    'teacher_exams',    // Exams by teacher ID
    'stages',
    'subjects',
    'lessons',
    'lesson',           // Single lesson by ID
    'question_banks',   // For lesson page
    'exams'
]);

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

        const supabase = await createServerClient();

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

            case 'teacher_profile': {
                const id = searchParams.get('id');
                if (!id) {
                    return NextResponse.json({ error: 'Missing teacher ID' }, { status: 400 });
                }

                const result = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (result.error) {
                    error = result.error;
                } else if (result.data) {
                    const t = result.data;
                    // Get exam count
                    const { count: compCount } = await supabase
                        .from('comprehensive_exams')
                        .select('id', { count: 'exact', head: true })
                        .eq('created_by', id)
                        .eq('is_published', true);

                    const { count: teacherCount } = await supabase
                        .from('teacher_exams')
                        .select('id', { count: 'exact', head: true })
                        .eq('created_by', id)
                        .eq('is_published', true);

                    const teacher = t as any;
                    data = [{
                        ...teacher,
                        coverImageURL: teacher.cover_image_url || null,
                        photoURL: teacher.avatar_url,
                        displayName: teacher.name,
                        isVerified: teacher.is_verified || false,
                        specialty: teacher.specialization || teacher.bio,
                        subscriberCount: teacher.subscriber_count || 0,
                        examsCount: (compCount || 0) + (teacherCount || 0),
                    }];
                }
                break;
            }

            case 'teacher_exams': {
                const teacherId = searchParams.get('teacherId');
                if (!teacherId) {
                    return NextResponse.json({ error: 'Missing teacher ID' }, { status: 400 });
                }

                // Get comprehensive exams
                const { data: compExams } = await supabase
                    .from('comprehensive_exams')
                    .select('id, exam_title, exam_description, duration_minutes, created_at, type, is_published, language, blocks')
                    .eq('created_by', teacherId)
                    .eq('is_published', true)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                // Get teacher exams
                const { data: teacherExams } = await supabase
                    .from('teacher_exams')
                    .select('id, exam_title, exam_description, duration_minutes, created_at, type, is_published')
                    .eq('created_by', teacherId)
                    .eq('is_published', true)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                const allExams: any[] = [];

                // Process comprehensive exams
                (compExams || []).forEach((e: any) => {
                    let questionsCount = 0;
                    if (e.blocks) {
                        try {
                            const blocks = typeof e.blocks === 'string' ? JSON.parse(e.blocks) : e.blocks;
                            blocks.forEach((block: any) => {
                                if (block.questions) questionsCount += block.questions.length;
                                if (block.subsections) {
                                    block.subsections.forEach((sub: any) => {
                                        if (sub.questions) questionsCount += sub.questions.length;
                                    });
                                }
                            });
                        } catch { /* ignore */ }
                    }

                    allExams.push({
                        id: e.id,
                        title: e.exam_title || 'امتحان بلا عنوان',
                        description: e.exam_description || '',
                        duration: e.duration_minutes || 0,
                        created_at: e.created_at,
                        type: e.type || 'comprehensive_exam',
                        isPublished: e.is_published,
                        questionsCount,
                        language: e.language || 'arabic',
                    });
                });

                // Process teacher exams
                (teacherExams || []).forEach((e: any) => {
                    if (!allExams.find(ex => ex.id === e.id)) {
                        allExams.push({
                            id: e.id,
                            title: e.exam_title || 'امتحان بلا عنوان',
                            description: e.exam_description || '',
                            duration: e.duration_minutes || 0,
                            created_at: e.created_at,
                            type: e.type || 'teacher_exam',
                            isPublished: e.is_published,
                        });
                    }
                });

                data = allExams;
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

            case 'lesson': {
                const lessonId = searchParams.get('id');
                if (!lessonId) {
                    return NextResponse.json({ error: 'Missing lesson ID' }, { status: 400 });
                }

                const result = await supabase
                    .from('lessons')
                    .select('id, title, description')
                    .eq('id', lessonId)
                    .single();

                if (result.data) {
                    data = [result.data];
                }
                error = result.error;
                break;
            }

            case 'question_banks': {
                const lessonId = searchParams.get('lessonId');
                if (!lessonId) {
                    return NextResponse.json({ error: 'Missing lesson ID' }, { status: 400 });
                }

                const result = await supabase
                    .from('question_banks')
                    .select('*')
                    .eq('lesson_id', lessonId)
                    .eq('is_active', true)
                    .order('created_at', { ascending: true });

                data = result.data || [];
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
