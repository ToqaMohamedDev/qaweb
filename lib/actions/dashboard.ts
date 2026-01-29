'use server';

import { createClient } from '@/lib/supabase-server';

// =============================================
// Types
// =============================================

export interface SubjectWithLessons {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    lessonsCount: number;
    description: string | null;
    imageUrl?: string | null;
}

export interface PlatformStats {
    totalUsers: number;
    totalLessons: number;
    totalExams: number;
    averageRating: number;
    successRate: number;
}

export interface ExamForDashboard {
    id: string;
    examTitle: string;
    type: 'comprehensive' | 'teacher';
    subjectId: string | null;
    subjectName: string | null;
    questionsCount: number;
    duration: number | null;
    createdAt: string;
    creatorName?: string;
}

export interface DashboardData {
    subjects: SubjectWithLessons[];
    exams: ExamForDashboard[];
    stageName: string;
    stageId: string | null;
    currentSemester: 'first' | 'second' | 'full_year';
    stats: PlatformStats;
    success: boolean;
    error?: string;
}

// =============================================
// Dashboard Server Action - OPTIMIZED VERSION
// =============================================

/**
 * جلب بيانات الـ Dashboard للصفحة الرئيسية (محسّن)
 * - استخدام Promise.all لتنفيذ الاستعلامات بالتوازي
 * - تقليل عدد الاستعلامات من 8+ إلى 3-4
 * - جلب الحقول المطلوبة فقط
 */
export async function fetchDashboardAction(): Promise<DashboardData> {
    const supabase = await createClient();
    const startTime = Date.now();

    try {
        // ========================================
        // المرحلة 1: جلب البيانات الأساسية بالتوازي
        // ========================================
        const [appSettingsResult, userResult, defaultStageResult] = await Promise.all([
            // إعدادات التطبيق
            supabase
                .from('app_settings')
                .select('show_first_semester, show_second_semester')
                .eq('id', 'global')
                .single(),
            // المستخدم الحالي
            supabase.auth.getUser(),
            // المرحلة الافتراضية (نجلبها مسبقاً لتوفير الوقت)
            supabase
                .from('educational_stages')
                .select('id, name')
                .eq('slug', 'grade-3-secondary')
                .single()
        ]);

        const appSettings = appSettingsResult.data;
        const user = userResult.data?.user;
        const defaultStage = defaultStageResult.data;

        // تحديد إعدادات الترم
        const showFirst = appSettings?.show_first_semester ?? true;
        const showSecond = appSettings?.show_second_semester ?? true;
        let currentSemester: 'first' | 'second' | 'full_year' = 'full_year';
        if (showFirst && !showSecond) currentSemester = 'first';
        else if (!showFirst && showSecond) currentSemester = 'second';

        // ========================================
        // المرحلة 2: تحديد المرحلة الدراسية
        // ========================================
        let stageId: string | null = defaultStage?.id || null;
        let stageName: string = defaultStage?.name || 'الصف الثالث الثانوي';

        if (user) {
            // جلب بروفايل المستخدم مع المرحلة في query واحد باستخدام join
            const { data: profileWithStage } = await supabase
                .from('profiles')
                .select(`
                    educational_stage_id,
                    educational_stages!profiles_educational_stage_id_fkey (
                        id,
                        name
                    )
                `)
                .eq('id', user.id)
                .single();

            if (profileWithStage?.educational_stage_id && profileWithStage.educational_stages) {
                // Supabase returns single relation as object, not array
                const stageData = profileWithStage.educational_stages as unknown as { id: string; name: string } | null;
                if (stageData) {
                    stageId = stageData.id;
                    stageName = stageData.name;
                }
            }
        }

        // إذا لم توجد مرحلة، نرجع بيانات فارغة
        if (!stageId) {
            console.log('[Dashboard] No stage found');
            return {
                subjects: [],
                exams: [],
                stageName,
                stageId: null,
                currentSemester,
                stats: { totalUsers: 0, totalLessons: 0, totalExams: 0, averageRating: 4.8, successRate: 85 },
                success: true
            };
        }

        // ========================================
        // المرحلة 3: جلب المواد والدروس بالتوازي
        // ========================================
        const [subjectStagesResult, lessonsResult, examsResult, statsResult] = await Promise.all([
            // المواد المرتبطة بالمرحلة مع بيانات المادة (JOIN)
            supabase
                .from('subject_stages')
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
                .order('order_index', { ascending: true }),

            // الدروس المنشورة للمرحلة
            supabase
                .from('lessons')
                .select('id, subject_id')
                .eq('is_published', true)
                .or(`stage_id.eq.${stageId},stage_id.is.null`)
                .or(
                    showFirst && !showSecond
                        ? 'semester.eq.first,semester.eq.full_year'
                        : !showFirst && showSecond
                            ? 'semester.eq.second,semester.eq.full_year'
                            : 'semester.eq.first,semester.eq.second,semester.eq.full_year'
                ),

            // الامتحانات المنشورة للمرحلة أو الامتحانات العامة
            // استخدام نفس الـ query المستخدم في /api/public/data?entity=exams
            supabase
                .from('comprehensive_exams')
                .select('id, exam_title, exam_description, duration_minutes, total_marks, stage_id, subject_id, subject_name, language, created_at')
                .eq('is_published', true)
                .or(`stage_id.eq.${stageId},stage_id.is.null`)
                .order('created_at', { ascending: false })
                .limit(8),

            // الإحصائيات بالتوازي
            fetchPlatformStatsOptimized(supabase, stageId)
        ]);

        const subjectStages = subjectStagesResult.data || [];
        const allLessons = lessonsResult.data || [];
        const rawExams = examsResult.data || [];

        console.log(`[Dashboard] Fetched ${subjectStages.length} subject-stages, ${allLessons.length} lessons, ${rawExams.length} exams in ${Date.now() - startTime}ms`);
        console.log(`[Dashboard] Stage ID: ${stageId}, Exams query: is_published=true AND (stage_id=${stageId} OR stage_id IS NULL)`);
        if (rawExams.length > 0) {
            console.log(`[Dashboard] First exam:`, rawExams[0]);
        } else {
            console.log(`[Dashboard] No exams found for stage ${stageId}`);
        }

        // ========================================
        // المرحلة 4: معالجة البيانات
        // ========================================

        // إنشاء map لعدد الدروس لكل مادة
        const lessonsCountMap = new Map<string, number>();
        allLessons.forEach(lesson => {
            const count = lessonsCountMap.get(lesson.subject_id) || 0;
            lessonsCountMap.set(lesson.subject_id, count + 1);
        });

        // بناء قائمة المواد
        type SubjectData = {
            id: string;
            name: string;
            slug: string;
            icon: string | null;
            color: string | null;
            description: string | null;
            image_url: string | null;
            is_active: boolean;
        };

        const subjectsWithLessons: SubjectWithLessons[] = subjectStages
            .filter(ss => {
                const subject = ss.subjects as unknown as SubjectData | null;
                return subject && subject.is_active;
            })
            .map(ss => {
                const subject = ss.subjects as unknown as SubjectData;
                return {
                    id: subject.id,
                    name: subject.name,
                    slug: subject.slug,
                    icon: subject.icon,
                    color: subject.color,
                    description: subject.description,
                    imageUrl: subject.image_url,
                    lessonsCount: lessonsCountMap.get(subject.id) || 0
                };
            });

        // بناء قائمة الامتحانات
        const exams: ExamForDashboard[] = rawExams.map(exam => ({
            id: exam.id,
            examTitle: exam.exam_title,
            type: 'comprehensive' as const,
            subjectId: exam.subject_id,
            subjectName: exam.subject_name || null,
            questionsCount: exam.total_marks || 0,
            duration: exam.duration_minutes,
            createdAt: exam.created_at
        }));

        console.log(`[Dashboard] Total time: ${Date.now() - startTime}ms`);

        return {
            subjects: subjectsWithLessons,
            exams,
            stageName,
            stageId,
            currentSemester,
            stats: statsResult,
            success: true
        };

    } catch (error) {
        console.error('[Dashboard Action] Error:', error);
        return {
            subjects: [],
            exams: [],
            stageName: '',
            stageId: null,
            currentSemester: 'full_year',
            stats: { totalUsers: 0, totalLessons: 0, totalExams: 0, averageRating: 0, successRate: 0 },
            success: false,
            error: 'Failed to fetch dashboard data'
        };
    }
}

/**
 * جلب الإحصائيات بشكل محسّن باستخدام Promise.all
 */
async function fetchPlatformStatsOptimized(
    supabase: Awaited<ReturnType<typeof createClient>>,
    stageId: string | null
): Promise<PlatformStats> {
    try {
        // Prepare promises for parallel execution
        const usersPromise = supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');

        // Lessons count (conditionally filtered by stage)
        let lessonsQuery = supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);

        if (stageId) {
            lessonsQuery = lessonsQuery.eq('stage_id', stageId);
        }

        const ratingsPromise = supabase
            .from('teacher_ratings')
            .select('rating')
            .limit(100);

        // Fetch recent comprehensive exam attempts (last 50)
        const compAttemptsPromise = supabase
            .from('comprehensive_exam_attempts')
            .select('total_score, max_score')
            .eq('status', 'completed')
            .limit(50);

        // Fetch recent teacher exam attempts (last 50)
        const teacherAttemptsPromise = supabase
            .from('teacher_exam_attempts')
            .select('total_score, max_score')
            .eq('status', 'completed')
            .limit(50);

        const [usersResult, lessonsResult, ratingsResult, compAttemptsResult, teacherAttemptsResult] = await Promise.all([
            usersPromise,
            lessonsQuery,
            ratingsPromise,
            compAttemptsPromise,
            teacherAttemptsPromise
        ]);

        // 1. Average Rating Calculation
        let averageRating = 4.9; // Default slightly high
        if (ratingsResult.data && ratingsResult.data.length > 0) {
            const sum = ratingsResult.data.reduce((acc, r) => acc + (r.rating || 0), 0);
            averageRating = Math.round((sum / ratingsResult.data.length) * 10) / 10;
        }

        // 2. Success Rate Calculation (Real Data)
        let successRate = 0;
        const allAttempts = [
            ...(compAttemptsResult.data || []),
            ...(teacherAttemptsResult.data || [])
        ];

        if (allAttempts.length > 0) {
            const passedCount = allAttempts.filter(a => {
                const max = a.max_score || 0;
                const score = a.total_score || 0;
                // Consider passed if score >= 50%
                return max > 0 && (score / max) >= 0.5;
            }).length;

            successRate = Math.round((passedCount / allAttempts.length) * 100);
        }

        return {
            totalUsers: usersResult.count || 0,
            totalLessons: lessonsResult.count || 0,
            totalExams: 0,
            averageRating,
            successRate
        };
    } catch (error) {
        console.error('[Platform Stats] Error:', error);
        return { totalUsers: 0, totalLessons: 0, totalExams: 0, averageRating: 4.8, successRate: 0 };
    }
}

// Legacy function kept for backwards compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _fetchPlatformStatsLegacy(supabase: Awaited<ReturnType<typeof createClient>>, stageId: string | null): Promise<PlatformStats> {
    try {
        // 1. عدد المستخدمين (الطلاب فقط)
        const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');

        // 2. عدد الدروس المنشورة للمرحلة المحددة فقط
        let lessonsQuery = supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);

        if (stageId) {
            lessonsQuery = lessonsQuery.eq('stage_id', stageId);
        }

        const { count: lessonsCount } = await lessonsQuery;

        // 3. متوسط التقييمات
        const { data: ratings } = await supabase
            .from('teacher_ratings')
            .select('rating');

        let averageRating = 4.8; // قيمة افتراضية
        if (ratings && ratings.length > 0) {
            const sum = ratings.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
            averageRating = Math.round((sum / ratings.length) * 10) / 10;
        }

        // 4. نسبة النجاح من الامتحانات
        const { data: examAttempts } = await supabase
            .from('teacher_exam_attempts')
            .select('score, total_questions')
            .not('score', 'is', null);

        let successRate = 85; // قيمة افتراضية
        if (examAttempts && examAttempts.length > 0) {
            const passedAttempts = examAttempts.filter((a: { score: number; total_questions: number }) =>
                (a.score / a.total_questions) >= 0.5
            ).length;
            successRate = Math.round((passedAttempts / examAttempts.length) * 100);
        }

        return {
            totalUsers: usersCount || 0,
            totalLessons: lessonsCount || 0,
            totalExams: 0,
            averageRating,
            successRate
        };
    } catch (error) {
        console.error('[Platform Stats] Error:', error);
        return {
            totalUsers: 0,
            totalLessons: 0,
            totalExams: 0,
            averageRating: 4.8,
            successRate: 85
        };
    }
}

/**
 * جلب دروس مادة معينة (محسّن)
 * - استخدام Promise.all للاستعلامات المتوازية
 * - جلب الحقول المطلوبة فقط
 */
export async function fetchSubjectLessonsAction(subjectSlug: string) {
    const supabase = await createClient();
    const startTime = Date.now();

    try {
        // ========================================
        // المرحلة 1: جلب البيانات الأساسية بالتوازي
        // ========================================
        const [appSettingsResult, subjectResult, userResult, defaultStageResult] = await Promise.all([
            supabase
                .from('app_settings')
                .select('show_first_semester, show_second_semester')
                .eq('id', 'global')
                .single(),
            supabase
                .from('subjects')
                .select('id, name, slug')
                .eq('slug', subjectSlug)
                .single(),
            supabase.auth.getUser(),
            supabase
                .from('educational_stages')
                .select('id')
                .eq('slug', 'grade-3-secondary')
                .single()
        ]);

        const appSettings = appSettingsResult.data;
        const subject = subjectResult.data;
        const user = userResult.data?.user;
        const defaultStage = defaultStageResult.data;

        if (!subject) {
            return { success: false, error: 'Subject not found', lessons: [] };
        }

        const showFirst = appSettings?.show_first_semester ?? true;
        const showSecond = appSettings?.show_second_semester ?? true;

        // ========================================
        // المرحلة 2: تحديد المرحلة الدراسية
        // ========================================
        let stageId: string | null = defaultStage?.id || null;

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('educational_stage_id')
                .eq('id', user.id)
                .single();

            if (profile?.educational_stage_id) {
                stageId = profile.educational_stage_id;
            }
        }

        // ========================================
        // المرحلة 3: جلب الدروس
        // ========================================
        let lessonsQuery = supabase
            .from('lessons')
            .select('id, title, description, image_url, is_free, order_index, semester, views_count, likes_count')
            .eq('subject_id', subject.id)
            .eq('is_published', true)
            .order('order_index', { ascending: true });

        if (stageId) {
            lessonsQuery = lessonsQuery.or(`stage_id.eq.${stageId},stage_id.is.null`);
        }

        // فلتر الترم
        if (showFirst && !showSecond) {
            lessonsQuery = lessonsQuery.or('semester.eq.first,semester.eq.full_year');
        } else if (!showFirst && showSecond) {
            lessonsQuery = lessonsQuery.or('semester.eq.second,semester.eq.full_year');
        }

        const { data: lessons } = await lessonsQuery;

        console.log(`[Subject Lessons] Fetched ${lessons?.length || 0} lessons in ${Date.now() - startTime}ms`);

        return {
            success: true,
            subject,
            lessons: lessons || []
        };

    } catch (error) {
        console.error('[Subject Lessons Action] Error:', error);
        return { success: false, error: 'Failed to fetch lessons', lessons: [] };
    }
}
