/**
 * Teacher Exams API Route
 * 
 * Fetches teacher's exams from the database
 * Uses server-side Supabase client for reliable connection on Vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

export async function GET() {
    console.log('[Teacher Exams API] Fetching exams...');

    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[Teacher Exams API] No authenticated user');
            return NextResponse.json(
                { success: false, error: 'Not authenticated', data: [] },
                { status: 401, headers: securityHeaders }
            );
        }

        console.log('[Teacher Exams API] User:', user.email);

        // Fetch teacher exams (check both tables)
        const [teacherExamsResult, comprehensiveExamsResult] = await Promise.all([
            supabase
                .from('teacher_exams')
                .select('*')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false }),
            supabase
                .from('comprehensive_exams')
                .select('id, exam_title, language, is_published, created_at, updated_at, duration_minutes, sections')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })
        ]);

        // Combine and normalize exams from both tables
        const teacherExams = (teacherExamsResult.data || []).map((exam: any) => ({
            id: exam.id,
            title: exam.exam_title || exam.title || 'امتحان بدون عنوان',
            language: exam.language || 'arabic',
            is_published: exam.is_published ?? false,
            created_at: exam.created_at,
            updated_at: exam.updated_at,
            duration_minutes: exam.duration_minutes || 30,
            questions_count: countQuestions(exam.sections),
            attempts_count: 0,
            source: 'teacher_exams',
        }));

        const comprehensiveExams = (comprehensiveExamsResult.data || []).map((exam: any) => ({
            id: exam.id,
            title: exam.exam_title || 'امتحان',
            language: exam.language || 'arabic',
            is_published: exam.is_published ?? false,
            created_at: exam.created_at,
            updated_at: exam.updated_at,
            duration_minutes: exam.duration_minutes || 30,
            questions_count: countQuestions(exam.sections),
            attempts_count: 0,
            source: 'comprehensive_exams',
        }));

        // Combine and sort by created_at
        const allExams = [...teacherExams, ...comprehensiveExams]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        console.log('[Teacher Exams API] Total exams:', allExams.length);

        return NextResponse.json(
            { success: true, data: allExams },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Teacher Exams API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error', data: [] },
            { status: 500, headers: securityHeaders }
        );
    }
}

// Helper function to count questions from sections
function countQuestions(sections: any): number {
    if (!sections || !Array.isArray(sections)) return 0;
    return sections.reduce((total: number, section: any) => {
        if (section.questions && Array.isArray(section.questions)) {
            return total + section.questions.length;
        }
        return total;
    }, 0);
}

// DELETE: Delete an exam
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401, headers: securityHeaders }
            );
        }

        const { searchParams } = new URL(request.url);
        const examId = searchParams.get('examId');
        const source = searchParams.get('source') || 'teacher_exams';

        if (!examId) {
            return NextResponse.json(
                { success: false, error: 'Exam ID required' },
                { status: 400, headers: securityHeaders }
            );
        }

        // Delete from the appropriate table
        const { error } = await supabase
            .from(source === 'comprehensive_exams' ? 'comprehensive_exams' : 'teacher_exams')
            .delete()
            .eq('id', examId)
            .eq('created_by', user.id);

        if (error) {
            console.error('[Teacher Exams API] Delete error:', error.message);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400, headers: securityHeaders }
            );
        }

        return NextResponse.json(
            { success: true },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Teacher Exams API] Delete unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}

// PATCH: Update exam (publish/unpublish)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401, headers: securityHeaders }
            );
        }

        const body = await request.json();
        const { examId, source, is_published } = body;

        if (!examId) {
            return NextResponse.json(
                { success: false, error: 'Exam ID required' },
                { status: 400, headers: securityHeaders }
            );
        }

        const table = source === 'comprehensive_exams' ? 'comprehensive_exams' : 'teacher_exams';

        // Update the exam
        const { error } = await supabase
            .from(table)
            .update({ is_published })
            .eq('id', examId)
            .eq('created_by', user.id);

        if (error) {
            console.error('[Teacher Exams API] Update error:', error.message);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400, headers: securityHeaders }
            );
        }

        return NextResponse.json(
            { success: true },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Teacher Exams API] Update unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}
