/**
 * Exam API Route
 * Fetches exam data for playing/viewing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// =============================================
// Helper
// =============================================

async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { /* Read-only in some contexts */ }
                },
            },
        }
    );
}

// =============================================
// GET - Fetch exam data
// =============================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const examId = searchParams.get('examId');

        if (!examId) {
            return NextResponse.json(
                { success: false, error: 'Missing examId' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Get current user (optional - may be null for public exams)
        const { data: { user } } = await supabase.auth.getUser();

        // Try comprehensive_exams first
        let examData: any = null;
        let examTable = 'comprehensive_exams';

        const { data: comprehensiveExam } = await supabase
            .from('comprehensive_exams')
            .select('*')
            .eq('id', examId)
            .maybeSingle();

        if (comprehensiveExam) {
            examData = comprehensiveExam;
            examTable = 'comprehensive_exams';
        } else {
            // Try teacher_exams
            const { data: teacherExam } = await supabase
                .from('teacher_exams')
                .select('*')
                .eq('id', examId)
                .maybeSingle();

            if (teacherExam) {
                examData = teacherExam;
                examTable = 'teacher_exams';
            }
        }

        if (!examData) {
            return NextResponse.json(
                { success: false, error: 'الامتحان غير موجود' },
                { status: 404 }
            );
        }

        // Determine attempts table
        const attemptsTable = examTable === 'teacher_exams'
            ? 'teacher_exam_attempts'
            : 'comprehensive_exam_attempts';

        // Check for existing attempts if user is logged in
        let existingAttempt = null;
        let inProgressAttempt = null;

        if (user) {
            // Check completed attempt
            const { data: completed } = await supabase
                .from(attemptsTable)
                .select('id, total_score, max_score, status')
                .eq('exam_id', examId)
                .eq('student_id', user.id)
                .in('status', ['completed', 'graded'])
                .maybeSingle();

            if (completed) {
                existingAttempt = completed;
            } else {
                // Check in-progress attempt
                const { data: inProgress } = await supabase
                    .from(attemptsTable)
                    .select('id, answers')
                    .eq('exam_id', examId)
                    .eq('student_id', user.id)
                    .eq('status', 'in_progress')
                    .maybeSingle();

                if (inProgress) {
                    inProgressAttempt = inProgress;
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                exam: examData,
                examTable,
                attemptsTable,
                user: user ? { id: user.id, email: user.email } : null,
                existingAttempt,
                inProgressAttempt,
            }
        });

    } catch (error) {
        console.error('Exam GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

// =============================================
// POST - Create or update exam attempt
// =============================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'يجب تسجيل الدخول' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, examId, attemptsTable, attemptId, answers, score, maxScore } = body;

        if (!examId || !attemptsTable) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        if (action === 'create') {
            // Create new attempt
            const { data: newAttempt, error } = await supabase
                .from(attemptsTable)
                .insert({
                    exam_id: examId,
                    student_id: user.id,
                    status: 'in_progress',
                    started_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (error) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                attemptId: newAttempt.id
            });
        }

        if (action === 'save' && attemptId) {
            // Save answers
            const { error } = await supabase
                .from(attemptsTable)
                .update({
                    answers,
                    updated_at: new Date().toISOString()
                })
                .eq('id', attemptId);

            if (error) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true });
        }

        if (action === 'submit' && attemptId) {
            // Submit exam
            const { error } = await supabase
                .from(attemptsTable)
                .update({
                    answers,
                    completed_at: new Date().toISOString(),
                    status: 'completed',
                    total_score: score,
                    max_score: maxScore,
                })
                .eq('id', attemptId);

            if (error) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Exam POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
