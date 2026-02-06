/**
 * Teacher Results API Route
 * 
 * Fetches teacher's exam results (student attempts)
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
    console.log('[Teacher Results API] Fetching results...');

    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[Teacher Results API] No authenticated user');
            return NextResponse.json(
                { success: false, error: 'Not authenticated', data: { exams: [], results: [], summaries: [] } },
                { status: 401, headers: securityHeaders }
            );
        }

        console.log('[Teacher Results API] User:', user.email);

        // Fetch teacher's exams
        const { data: exams } = await supabase
            .from('teacher_exams')
            .select('id, exam_title, language')
            .eq('created_by', user.id);

        const examIds = (exams || []).map((e: any) => e.id);
        let results: any[] = [];
        let summaries: any[] = [];

        if (examIds.length > 0) {
            // Fetch student attempts
            const { data: attempts } = await supabase
                .from('teacher_exam_attempts')
                .select('*')
                .in('exam_id', examIds)
                .in('status', ['completed', 'graded'])
                .order('completed_at', { ascending: false });

            // Map results with exam titles
            results = (attempts || []).map((attempt: any) => {
                const exam = exams?.find((e: any) => e.id === attempt.exam_id);
                return {
                    ...attempt,
                    exam_title: exam?.exam_title || 'امتحان',
                };
            });

            // Calculate summaries
            summaries = (exams || []).map((exam: any) => {
                const examAttempts = results.filter((r: any) => r.exam_id === exam.id);
                const avgScore = examAttempts.length > 0
                    ? examAttempts.reduce((sum: number, r: any) => sum + (r.total_score || 0), 0) / examAttempts.length
                    : 0;
                return {
                    id: exam.id,
                    title: exam.exam_title,
                    attempts_count: examAttempts.length,
                    avg_score: avgScore,
                    language: exam.language,
                };
            });
        }

        console.log('[Teacher Results API] Results:', results.length, 'Summaries:', summaries.length);

        return NextResponse.json(
            {
                success: true,
                data: {
                    exams: exams || [],
                    results,
                    summaries,
                }
            },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Teacher Results API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error', data: { exams: [], results: [], summaries: [] } },
            { status: 500, headers: securityHeaders }
        );
    }
}
