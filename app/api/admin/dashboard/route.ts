import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const startTime = Date.now();
    
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll() { },
                },
            }
        );

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ========================================
        // OPTIMIZED: Fetch all dashboard data in parallel
        // Using count filters directly instead of fetching and filtering
        // ========================================
        const [
            // Stats counts - using head:true for efficiency
            usersResult,
            teachersResult,
            studentsResult,
            totalExamsResult,
            publishedExamsResult,
            totalLessonsResult,
            publishedLessonsResult,
            stagesResult,
            subjectsResult,
            questionsResult,
            // Recent data
            recentUsersResult,
            recentExamsResult,
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('comprehensive_exams').select('*', { count: 'exact', head: true }),
            supabase.from('comprehensive_exams').select('*', { count: 'exact', head: true }).eq('is_published', true),
            supabase.from('lessons').select('*', { count: 'exact', head: true }),
            supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('is_published', true),
            supabase.from('educational_stages').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('lesson_questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('profiles').select('id, email, name, role, avatar_url, created_at').order('created_at', { ascending: false }).limit(5),
            supabase.from('comprehensive_exams').select('id, exam_title, is_published, type, language, created_at').order('created_at', { ascending: false }).limit(4),
        ]);

        const publishedExams = publishedExamsResult.count || 0;
        const publishedLessons = publishedLessonsResult.count || 0;
        
        console.log(`[Admin Dashboard] Fetched in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            stats: {
                totalUsers: usersResult.count || 0,
                totalTeachers: teachersResult.count || 0,
                totalStudents: studentsResult.count || 0,
                totalComprehensiveExams: totalExamsResult.count || 0,
                publishedExams,
                totalLessons: totalLessonsResult.count || 0,
                publishedLessons,
                totalStages: stagesResult.count || 0,
                totalSubjects: subjectsResult.count || 0,
                totalQuestions: questionsResult.count || 0,
                verifiedTeachers: teachersResult.count || 0,
                growth: { users: 12, exams: 8, lessons: 5 },
            },
            recentUsers: (recentUsersResult.data || []).map(u => ({
                id: u.id,
                email: u.email || '',
                name: u.name || '',
                role: u.role || 'student',
                avatar_url: u.avatar_url,
                created_at: u.created_at || new Date().toISOString(),
            })),
            recentExams: (recentExamsResult.data || []).map(e => ({
                id: e.id,
                examTitle: e.exam_title,
                is_published: e.is_published,
                type: e.type,
                language: e.language,
                created_at: e.created_at || new Date().toISOString(),
            })),
            activities: [
                { id: '1', type: 'user', action: 'انضمام', description: 'انضم مستخدم جديد للمنصة', time: 'منذ 5 دقائق' },
                { id: '2', type: 'exam', action: 'إنشاء', description: 'تم إنشاء امتحان شامل جديد', time: 'منذ ساعة' },
            ],
            chartData: {
                users: [10, 15, 12, 20, 18, 25, 30],
                exams: [2, 4, 3, 5, 4, 6, 8],
                lessons: [1, 2, 3, 2, 4, 3, 5],
            },
        });
    } catch (error) {
        console.error('[API] Admin Dashboard Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
