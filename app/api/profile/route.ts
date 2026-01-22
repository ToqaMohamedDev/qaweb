/**
 * ============================================================================
 * PROFILE API - جلب بيانات الملف الشخصي
 * ============================================================================
 * 
 * هذا الـ API يجلب جميع بيانات الملف الشخصي بما في ذلك:
 * - الملف الشخصي الأساسي
 * - المراحل التعليمية
 * - إحصائيات المستخدم
 * - النشاط الأخير
 * 
 * يعمل على Vercel و Local لأنه يستخدم Server-side Supabase client
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('[Profile API] Profile error:', profileError);
        }

        // 3. Get educational stages
        const { data: stages } = await supabase
            .from('educational_stages')
            .select('id, name')
            .order('order_index', { ascending: true });

        // 4. Get user stats (مع فلترة حسب المرحلة الدراسية)
        const userStageId = profile?.educational_stage_id || null;
        const stats = await getUserStats(supabase, user.id, userStageId);

        // 5. Get recent activity
        const recentActivity = await getRecentActivity(supabase, user.id);

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    created_at: user.created_at,
                },
                profile,
                stages: stages || [],
                stats,
                recentActivity,
            }
        });

    } catch (error) {
        console.error('[Profile API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH - تحديث بيانات الملف الشخصي
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, avatar_url, bio, educational_stage_id } = body;

        const { data, error } = await supabase
            .from('profiles')
            .update({
                name,
                avatar_url,
                bio,
                educational_stage_id: educational_stage_id || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('[Profile API] Update error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[Profile API] PATCH error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * دالة مساعدة لحساب إحصائيات الامتحانات
 */
function calculateExamStats(attempts: any[]) {
    if (!attempts || attempts.length === 0) {
        return { taken: 0, passed: 0, averageScore: 0, totalScore: 0 };
    }

    const taken = attempts.length;
    const passed = attempts.filter(
        (e) => (e.status === 'completed' || e.status === 'graded') &&
            e.total_score && e.max_score &&
            (e.total_score / e.max_score) >= 0.6
    ).length;

    let totalScore = 0;
    let averageScore = 0;

    const completedAttempts = attempts.filter(e => e.total_score != null && e.max_score != null && e.max_score > 0);
    if (completedAttempts.length > 0) {
        totalScore = completedAttempts.reduce((acc, e) => acc + (e.total_score || 0), 0);
        const avgScores = completedAttempts.map(e => (e.total_score / e.max_score) * 100);
        averageScore = Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length);
    }

    return { taken, passed, averageScore, totalScore };
}

/**
 * جلب إحصائيات المستخدم (مع فصل إحصائيات الموقع عن المدرسين + فلترة حسب المرحلة)
 */
async function getUserStats(supabase: any, userId: string, stageId: string | null) {
    try {
        // جلب الدروس المفلترة حسب المرحلة
        let lessonsQuery = supabase
            .from('lessons')
            .select('id')
            .eq('is_published', true);

        if (stageId) {
            lessonsQuery = lessonsQuery.eq('stage_id', stageId);
        }

        const { data: stageLessons } = await lessonsQuery;
        const stageLessonIds = (stageLessons || []).map((l: any) => l.id);

        // Lesson progress - فلترة حسب الدروس الخاصة بالمرحلة
        let lessonProgressQuery = supabase
            .from('user_lesson_progress')
            .select('*')
            .eq('user_id', userId);

        if (stageLessonIds.length > 0) {
            lessonProgressQuery = lessonProgressQuery.in('lesson_id', stageLessonIds);
        }

        const { data: lessonProgress } = await lessonProgressQuery;

        // Total lessons للمرحلة
        const totalLessons = stageLessonIds.length;

        // Comprehensive exam attempts (امتحانات الموقع) - فلترة حسب المرحلة
        let comprehensiveAttempts: any[] = [];

        if (stageId) {
            // Get exams for this stage
            const { data: stageCompExams } = await supabase
                .from('comprehensive_exams')
                .select('id')
                .eq('is_published', true)
                .eq('stage_id', stageId);

            const stageCompExamIds = (stageCompExams || []).map((e: any) => e.id);

            if (stageCompExamIds.length > 0) {
                // Fetch attempts only for exams in this stage
                const { data: attempts } = await supabase
                    .from('comprehensive_exam_attempts')
                    .select('*')
                    .eq('student_id', userId)
                    .in('exam_id', stageCompExamIds);
                comprehensiveAttempts = attempts || [];
            }
            // If no exams for this stage, comprehensiveAttempts stays empty []
        } else {
            // No stage filter - get all attempts
            const { data: attempts } = await supabase
                .from('comprehensive_exam_attempts')
                .select('*')
                .eq('student_id', userId);
            comprehensiveAttempts = attempts || [];
        }

        // Teacher exam attempts (امتحانات المدرسين) - فلترة حسب المرحلة
        let teacherAttempts: any[] = [];

        if (stageId) {
            // Get exams for this stage
            const { data: stageTeacherExams } = await supabase
                .from('teacher_exams')
                .select('id')
                .eq('is_published', true)
                .eq('stage_id', stageId);

            const stageTeacherExamIds = (stageTeacherExams || []).map((e: any) => e.id);

            if (stageTeacherExamIds.length > 0) {
                // Fetch attempts only for exams in this stage
                const { data: attempts } = await supabase
                    .from('teacher_exam_attempts')
                    .select('*')
                    .eq('student_id', userId)
                    .in('exam_id', stageTeacherExamIds);
                teacherAttempts = attempts || [];
            }
            // If no exams for this stage, teacherAttempts stays empty []
        } else {
            // No stage filter - get all attempts
            const { data: attempts } = await supabase
                .from('teacher_exam_attempts')
                .select('*')
                .eq('student_id', userId);
            teacherAttempts = attempts || [];
        }

        // حساب إحصائيات امتحانات الموقع (Comprehensive)
        const siteExamStats = calculateExamStats(comprehensiveAttempts);

        // حساب إحصائيات امتحانات المدرسين (Teacher)
        const teacherExamStats = calculateExamStats(teacherAttempts);

        const completedLessons = lessonProgress?.filter((p: any) => p.is_completed)?.length || 0;

        // Calculate active days and streak
        const activityDates = new Set<string>();
        lessonProgress?.forEach((p: any) => {
            if (p.last_accessed_at || p.updated_at) {
                activityDates.add(new Date(p.last_accessed_at || p.updated_at).toDateString());
            }
        });
        comprehensiveAttempts?.forEach((e: any) => {
            if (e.started_at) {
                activityDates.add(new Date(e.started_at).toDateString());
            }
        });
        teacherAttempts?.forEach((e: any) => {
            if (e.started_at) {
                activityDates.add(new Date(e.started_at).toDateString());
            }
        });

        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            if (activityDates.has(checkDate.toDateString())) {
                currentStreak++;
            } else if (i > 0) {
                break;
            }
        }

        return {
            completedLessons,
            totalLessons: totalLessons || 0,

            // إحصائيات امتحانات الموقع (Comprehensive)
            siteExams: {
                taken: siteExamStats.taken,
                passed: siteExamStats.passed,
                averageScore: siteExamStats.averageScore,
                totalScore: siteExamStats.totalScore,
            },

            // إحصائيات امتحانات المدرسين (Teacher)
            teacherExams: {
                taken: teacherExamStats.taken,
                passed: teacherExamStats.passed,
                averageScore: teacherExamStats.averageScore,
                totalScore: teacherExamStats.totalScore,
            },

            // الإحصائيات المجمعة (للتوافق مع الكود القديم)
            examsTaken: siteExamStats.taken + teacherExamStats.taken,
            passedExams: siteExamStats.passed + teacherExamStats.passed,
            averageScore: siteExamStats.averageScore, // متوسط الموقع فقط
            totalScore: siteExamStats.totalScore + teacherExamStats.totalScore,

            activeDays: Math.max(activityDates.size, 1),
            currentStreak,
        };

    } catch (error) {
        console.error('[Profile API] Stats error:', error);
        return {
            completedLessons: 0,
            totalLessons: 0,
            siteExams: { taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
            teacherExams: { taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
            examsTaken: 0,
            passedExams: 0,
            totalScore: 0,
            activeDays: 1,
            currentStreak: 0,
            averageScore: 0,
        };
    }
}

/**
 * جلب النشاط الأخير
 */
async function getRecentActivity(supabase: any, userId: string) {
    try {
        const activities: any[] = [];

        // Lesson progress
        const { data: lessonProgress } = await supabase
            .from('user_lesson_progress')
            .select(`
                id,
                lesson_id,
                is_completed,
                last_accessed_at,
                lessons:lesson_id (title, subject_id)
            `)
            .eq('user_id', userId)
            .order('last_accessed_at', { ascending: false })
            .limit(5);

        if (lessonProgress) {
            lessonProgress.forEach((p: any) => {
                if (p.lessons) {
                    activities.push({
                        id: p.id,
                        type: 'lesson',
                        title: p.lessons.title || 'درس',
                        date: p.last_accessed_at,
                        status: p.is_completed ? 'مكتمل' : 'قيد التقدم',
                    });
                }
            });
        }

        // Exam attempts
        const { data: examAttempts } = await supabase
            .from('comprehensive_exam_attempts')
            .select(`
                id,
                exam_id,
                started_at,
                total_score,
                max_score,
                status,
                comprehensive_exams:exam_id (exam_title)
            `)
            .eq('student_id', userId)
            .order('started_at', { ascending: false })
            .limit(5);

        if (examAttempts) {
            examAttempts.forEach((e: any) => {
                const score = e.max_score > 0
                    ? Math.round((e.total_score / e.max_score) * 100)
                    : 0;
                activities.push({
                    id: e.id,
                    type: 'exam',
                    title: e.comprehensive_exams?.exam_title || 'امتحان',
                    date: e.started_at,
                    score,
                    status:
                        e.status === 'completed' || e.status === 'graded'
                            ? 'مكتمل'
                            : e.status === 'in_progress'
                                ? 'قيد التنفيذ'
                                : e.status,
                });
            });
        }

        // Sort by date
        activities.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

        return activities.slice(0, 8);

    } catch (error) {
        console.error('[Profile API] Activity error:', error);
        return [];
    }
}
