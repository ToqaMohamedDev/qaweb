import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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

        // Fetch all dashboard data
        const [
            usersResult,
            teachersResult,
            studentsResult,
            comprehensiveExamsResult,
            lessonsResult,
            stagesResult,
            subjectsResult,
            recentUsersResult,
            recentExamsResult,
        ] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('comprehensive_exams').select('id, is_published', { count: 'exact' }),
            supabase.from('lessons').select('id, is_published', { count: 'exact' }),
            supabase.from('educational_stages').select('id', { count: 'exact', head: true }),
            supabase.from('subjects').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id, email, name, role, avatar_url, created_at').order('created_at', { ascending: false }).limit(5),
            supabase.from('comprehensive_exams').select('id, exam_title, is_published, type, language, created_at').order('created_at', { ascending: false }).limit(4),
        ]);

        const publishedExams = comprehensiveExamsResult.data?.filter(e => e.is_published).length || 0;
        const publishedLessons = lessonsResult.data?.filter(l => l.is_published).length || 0;

        return NextResponse.json({
            stats: {
                totalUsers: usersResult.count || 0,
                totalTeachers: teachersResult.count || 0,
                totalStudents: studentsResult.count || 0,
                totalComprehensiveExams: comprehensiveExamsResult.count || 0,
                publishedExams,
                totalLessons: lessonsResult.count || 0,
                publishedLessons,
                totalStages: stagesResult.count || 0,
                totalSubjects: subjectsResult.count || 0,
                totalQuestions: 0,
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
