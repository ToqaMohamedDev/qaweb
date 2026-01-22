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

import { NextResponse } from 'next/server';
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

        // 4. Get user stats
        const stats = await getUserStats(supabase, user.id);

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
 * جلب إحصائيات المستخدم
 */
async function getUserStats(supabase: any, userId: string) {
    try {
        // Lesson progress
        const { data: lessonProgress } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .eq('user_id', userId);

        // Total lessons
        const { count: totalLessons } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);

        // Exam attempts
        const { data: examAttempts } = await supabase
            .from('comprehensive_exam_attempts')
            .select('*')
            .eq('student_id', userId);

        const completedLessons = lessonProgress?.filter((p: any) => p.is_completed)?.length || 0;
        const examsTaken = examAttempts?.length || 0;
        const passedExams = examAttempts?.filter(
            (e: any) => e.status === 'completed' || e.status === 'graded'
        )?.length || 0;

        let totalScore = 0;
        let averageScore = 0;
        if (examAttempts && examAttempts.length > 0) {
            totalScore = examAttempts.reduce((acc: number, e: any) => acc + (e.total_score || 0), 0);
            const avgScores = examAttempts.map((e: any) =>
                (e.max_score ?? 0) > 0 ? ((e.total_score ?? 0) / e.max_score!) * 100 : 0
            );
            averageScore = avgScores.reduce((a: number, b: number) => a + b, 0) / avgScores.length;
        }

        // Calculate active days and streak
        const activityDates = new Set<string>();
        lessonProgress?.forEach((p: any) => {
            if (p.last_accessed_at || p.updated_at) {
                activityDates.add(new Date(p.last_accessed_at || p.updated_at).toDateString());
            }
        });
        examAttempts?.forEach((e: any) => {
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
            examsTaken,
            passedExams,
            totalScore,
            activeDays: Math.max(activityDates.size, 1),
            currentStreak,
            averageScore: Math.round(averageScore),
        };

    } catch (error) {
        console.error('[Profile API] Stats error:', error);
        return {
            completedLessons: 0,
            totalLessons: 0,
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
