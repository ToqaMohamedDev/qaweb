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

// =============================================
// TypeScript Interfaces for Profile API
// =============================================

interface ExamAttempt {
    exam_id: string;
    status: string;
    total_score: number | null;
    max_score: number | null;
    started_at?: string;
    completed_at?: string;
    percentage?: number | null;
    comprehensive_exams?: { exam_title?: string };
    teacher_exams?: { title?: string };
}

interface ExamStatsResult {
    taken: number;
    passed: number;
    averageScore: number;
    totalScore: number;
}

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
        // لو المستخدم ما حددش مرحلة، نستخدم الصف الثالث الثانوي كـ default
        let userStageId = profile?.educational_stage_id || null;

        if (!userStageId && stages && stages.length > 0) {
            // Find default stage (الصف الثالث الثانوي)
            const defaultStage = stages.find((s: any) =>
                s.name?.includes('ثالث') && s.name?.includes('ثانوي')
            );
            if (defaultStage) {
                userStageId = defaultStage.id;
            }
        }

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
 * بتحسب عدد الامتحانات الفريدة (مش المحاولات)
 */
function calculateExamStats(attempts: ExamAttempt[]): ExamStatsResult {
    if (!attempts || attempts.length === 0) {
        return { taken: 0, passed: 0, averageScore: 0, totalScore: 0 };
    }

    // Group attempts by exam_id to count unique exams
    const examGroups = new Map<string, ExamAttempt[]>();
    attempts.forEach(attempt => {
        const examId = attempt.exam_id;
        if (!examGroups.has(examId)) {
            examGroups.set(examId, []);
        }
        examGroups.get(examId)!.push(attempt);
    });

    // Count unique exams taken
    const taken = examGroups.size;

    // For each exam, check if the best attempt is passed
    let passed = 0;
    let totalScoreSum = 0;
    const completedExamScores: number[] = [];

    examGroups.forEach((examAttempts) => {
        // Get the best/latest completed attempt for this exam
        const completedAttempts = examAttempts.filter(
            (e) => (e.status === 'completed' || e.status === 'graded') &&
                e.total_score != null && e.max_score != null && e.max_score > 0
        );

        if (completedAttempts.length > 0) {
            // Get the best score for this exam
            const bestAttempt = completedAttempts.reduce((best, current) => {
                const bestScore = (best.total_score ?? 0) / (best.max_score ?? 1);
                const currentScore = (current.total_score ?? 0) / (current.max_score ?? 1);
                return currentScore > bestScore ? current : best;
            });

            const scorePercent = (bestAttempt.total_score ?? 0) / (bestAttempt.max_score ?? 1);
            completedExamScores.push(scorePercent * 100);
            totalScoreSum += bestAttempt.total_score ?? 0;

            // Check if passed (>= 60%)
            if (scorePercent >= 0.6) {
                passed++;
            }
        }
    });

    const averageScore = completedExamScores.length > 0
        ? Math.round(completedExamScores.reduce((a, b) => a + b, 0) / completedExamScores.length)
        : 0;

    return { taken, passed, averageScore, totalScore: totalScoreSum };
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

        // =============================================
        // Comprehensive exams (امتحانات الموقع) - فلترة حسب المرحلة
        // =============================================
        let comprehensiveAttempts: any[] = [];
        let totalSiteExams = 0;

        if (stageId) {
            // Get ALL published exams for this stage (to get total count)
            const { data: stageCompExams } = await supabase
                .from('comprehensive_exams')
                .select('id')
                .eq('is_published', true)
                .eq('stage_id', stageId);

            const stageCompExamIds = (stageCompExams || []).map((e: any) => e.id);
            totalSiteExams = stageCompExamIds.length;

            if (stageCompExamIds.length > 0) {
                // Fetch attempts only for exams in this stage
                const { data: attempts } = await supabase
                    .from('comprehensive_exam_attempts')
                    .select('*')
                    .eq('student_id', userId)
                    .in('exam_id', stageCompExamIds);
                comprehensiveAttempts = attempts || [];
            }
        } else {
            // No stage filter - get all published exams count
            const { count: totalCount } = await supabase
                .from('comprehensive_exams')
                .select('id', { count: 'exact', head: true })
                .eq('is_published', true);
            totalSiteExams = totalCount || 0;

            const { data: attempts } = await supabase
                .from('comprehensive_exam_attempts')
                .select('*')
                .eq('student_id', userId);
            comprehensiveAttempts = attempts || [];
        }

        // =============================================
        // Teacher exams (امتحانات المدرسين) - فلترة حسب المرحلة
        // =============================================
        let teacherAttempts: any[] = [];
        let totalTeacherExams = 0;

        if (stageId) {
            // Get ALL published exams for this stage (to get total count)
            const { data: stageTeacherExams } = await supabase
                .from('teacher_exams')
                .select('id')
                .eq('is_published', true)
                .eq('stage_id', stageId);

            const stageTeacherExamIds = (stageTeacherExams || []).map((e: any) => e.id);
            totalTeacherExams = stageTeacherExamIds.length;

            if (stageTeacherExamIds.length > 0) {
                // Fetch attempts only for exams in this stage
                const { data: attempts } = await supabase
                    .from('teacher_exam_attempts')
                    .select('*')
                    .eq('student_id', userId)
                    .in('exam_id', stageTeacherExamIds);
                teacherAttempts = attempts || [];
            }
        } else {
            // No stage filter - get all published exams count
            const { count: totalCount } = await supabase
                .from('teacher_exams')
                .select('id', { count: 'exact', head: true })
                .eq('is_published', true);
            totalTeacherExams = totalCount || 0;

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

        // =============================================
        // Question Bank (بنك الأسئلة) - فلترة حسب المرحلة
        // =============================================
        let questionBankAttempts: any[] = [];
        let totalQuestionBanks = 0;

        if (stageId) {
            // Get ALL published question banks for this stage
            // Note: stage_id on question_banks can be NULL, so we also check via lesson's stage_id

            // Method 1: Direct stage_id match
            const { data: directStageQBs } = await supabase
                .from('question_banks')
                .select('id')
                .eq('stage_id', stageId);

            // Method 2: Through lesson's stage_id (for question banks where stage_id is null)
            const { data: lessonStageQBs } = await supabase
                .from('question_banks')
                .select('id, lessons!inner(stage_id)')
                .is('stage_id', null)
                .eq('lessons.stage_id', stageId);

            // Combine both sets of IDs
            const directIds = (directStageQBs || []).map((qb: any) => qb.id);
            const lessonIds = (lessonStageQBs || []).map((qb: any) => qb.id);
            const stageQBIds = [...new Set([...directIds, ...lessonIds])];

            totalQuestionBanks = stageQBIds.length;

            if (stageQBIds.length > 0) {
                const { data: attempts } = await supabase
                    .from('question_bank_attempts')
                    .select('*')
                    .eq('student_id', userId)
                    .in('question_bank_id', stageQBIds);
                questionBankAttempts = attempts || [];
            }
        } else {
            // No stage filter - get all question banks
            const { count: totalCount } = await supabase
                .from('question_banks')
                .select('id', { count: 'exact', head: true });
            totalQuestionBanks = totalCount || 0;

            const { data: attempts } = await supabase
                .from('question_bank_attempts')
                .select('*')
                .eq('student_id', userId);
            questionBankAttempts = attempts || [];
        }

        // حساب إحصائيات بنك الأسئلة
        const questionBankStats = calculateQuestionBankStats(questionBankAttempts);

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
                total: totalSiteExams,           // إجمالي الامتحانات المتاحة للمرحلة
                taken: siteExamStats.taken,      // عدد الامتحانات اللي الطالب دخلها
                passed: siteExamStats.passed,    // عدد الامتحانات اللي نجح فيها
                averageScore: siteExamStats.averageScore,
                totalScore: siteExamStats.totalScore,
            },

            // إحصائيات امتحانات المدرسين (Teacher)
            teacherExams: {
                total: totalTeacherExams,        // إجمالي الامتحانات المتاحة للمرحلة
                taken: teacherExamStats.taken,   // عدد الامتحانات اللي الطالب دخلها
                passed: teacherExamStats.passed, // عدد الامتحانات اللي نجح فيها
                averageScore: teacherExamStats.averageScore,
                totalScore: teacherExamStats.totalScore,
            },

            // إحصائيات بنك الأسئلة (Question Bank)
            questionBank: {
                total: totalQuestionBanks,           // إجمالي بنوك الأسئلة المتاحة للمرحلة
                taken: questionBankStats.taken,      // عدد البنوك اللي الطالب دخلها
                passed: questionBankStats.passed,    // عدد البنوك اللي أكملها
                averageScore: questionBankStats.averageScore,
                totalScore: questionBankStats.totalScore,
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
            siteExams: { total: 0, taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
            teacherExams: { total: 0, taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
            questionBank: { total: 0, taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
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

/**
 * دالة مساعدة لحساب إحصائيات بنك الأسئلة
 */
function calculateQuestionBankStats(attempts: any[]): { taken: number; passed: number; averageScore: number; totalScore: number } {
    if (!attempts || attempts.length === 0) {
        return { taken: 0, passed: 0, averageScore: 0, totalScore: 0 };
    }

    // Group attempts by question_bank_id to count unique question banks
    const qbGroups = new Map<string, any[]>();
    attempts.forEach(attempt => {
        const qbId = attempt.question_bank_id;
        if (!qbGroups.has(qbId)) {
            qbGroups.set(qbId, []);
        }
        qbGroups.get(qbId)!.push(attempt);
    });

    const taken = qbGroups.size;
    let passed = 0;
    const bestScores: number[] = [];

    qbGroups.forEach((qbAttempts) => {
        // Calculate scores manually because score_percentage might be missing in DB view
        const enrichedAttempts = qbAttempts.map((attempt: any) => {
            const percentage = attempt.score_percentage ??
                (attempt.total_questions > 0
                    ? Math.round((attempt.correct_count / attempt.total_questions) * 100)
                    : 0);
            return { ...attempt, score_percentage: percentage };
        });

        // Find best attempt for this question bank
        const bestAttempt = enrichedAttempts.reduce((best, current) =>
            (current.score_percentage > best.score_percentage) ? current : best
            , { score_percentage: 0 });

        // A question bank is considered "passed/completed" if at least one attempt is status='completed' 
        // OR simply if they achieved a good score. 
        // We'll trust status='completed' OR > 50% score as a fallback.
        const isCompleted = enrichedAttempts.some(a => a.status === 'completed') || bestAttempt.score_percentage >= 50;

        if (isCompleted) {
            passed++;
            bestScores.push(bestAttempt.score_percentage);
        }
    });

    const averageScore = bestScores.length > 0
        ? Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length)
        : 0;

    return {
        taken,
        passed,
        averageScore,
        totalScore: averageScore // Using average as the metric
    };
}


