/**
 * Teacher Dashboard API Route
 * 
 * Fetches teacher dashboard data including exams, profile stats, and performance
 * Uses server-side Supabase client for reliable connection on Vercel
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

export async function GET() {
    console.log('[Teacher Dashboard API] Fetching data...');

    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[Teacher Dashboard API] No authenticated user');
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401, headers: securityHeaders }
            );
        }

        console.log('[Teacher Dashboard API] User:', user.email);

        // Fetch exams and profile in parallel
        const [examsResult, profileResult] = await Promise.all([
            supabase.from('comprehensive_exams')
                .select('id, exam_title, language, is_published, created_at, sections')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false }),
            supabase.from('profiles')
                .select('subscriber_count, rating_average, rating_count')
                .eq('id', user.id)
                .single()
        ]);

        if (examsResult.error) {
            console.error('[Teacher Dashboard API] Exams error:', examsResult.error.message);
        }
        if (profileResult.error) {
            console.error('[Teacher Dashboard API] Profile error:', profileResult.error.message);
        }

        const exams = examsResult.data || [];
        const profile = profileResult.data;

        console.log('[Teacher Dashboard API] Exams:', exams.length, 'Profile:', profile ? 'OK' : 'null');

        // Fetch exam attempts if there are exams
        let attempts: any[] = [];
        if (exams.length > 0) {
            const examIds = exams.map(e => e.id);
            const { data: attemptsData } = await supabase
                .from('comprehensive_exam_attempts')
                .select('exam_id, total_score, max_score')
                .in('exam_id', examIds)
                .in('status', ['completed', 'graded']);
            attempts = attemptsData || [];
        }

        return NextResponse.json({
            success: true,
            exams,
            profile: {
                subscriber_count: profile?.subscriber_count || 0,
                rating_average: profile?.rating_average || 0,
                rating_count: profile?.rating_count || 0,
            },
            attempts,
        }, { status: 200, headers: securityHeaders });

    } catch (error) {
        console.error('[Teacher Dashboard API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}
