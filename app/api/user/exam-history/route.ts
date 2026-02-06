/**
 * User Exam History API Route
 * 
 * Fetches user's exam attempts from both teacher_exam_attempts and comprehensive_exam_attempts
 * Uses server-side Supabase client for reliable connection on Vercel
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

interface ExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    status: string;
    total_score: number | null;
    max_score: number | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string | null;
    exam_title?: string;
    exam_type?: string;
    teacher_name?: string;
    teacher_id?: string;
    source: "teacher" | "comprehensive";
}

export async function GET() {
    console.log('[ExamHistory API] Fetching exam history...');

    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[ExamHistory API] No authenticated user');
            return NextResponse.json(
                { success: false, error: 'Not authenticated', data: [] },
                { status: 401, headers: securityHeaders }
            );
        }

        console.log('[ExamHistory API] User:', user.email);

        // Fetch teacher exam attempts
        const { data: teacherAttempts, error: teacherError } = await supabase
            .from("teacher_exam_attempts")
            .select("id, exam_id, student_id, status, total_score, max_score, started_at, completed_at, created_at")
            .eq("student_id", user.id)
            .order("created_at", { ascending: false });

        if (teacherError) {
            console.error("[ExamHistory API] Error fetching teacher attempts:", teacherError);
        }

        // Get teacher exam details
        const teacherExamIds = (teacherAttempts || []).map(a => a.exam_id);
        let teacherExamsData: Record<string, any> = {};

        if (teacherExamIds.length > 0) {
            const { data: exams } = await supabase
                .from("teacher_exams")
                .select("id, exam_title, type, created_by")
                .in("id", teacherExamIds);

            if (exams) {
                // Get teacher profiles
                const teacherIds = [...new Set(exams.map(e => e.created_by).filter(Boolean))];
                let teachersData: Record<string, any> = {};

                if (teacherIds.length > 0) {
                    const { data: teachers } = await supabase
                        .from("profiles")
                        .select("id, name")
                        .in("id", teacherIds);

                    if (teachers) {
                        teachersData = Object.fromEntries(teachers.map(t => [t.id, t]));
                    }
                }

                teacherExamsData = Object.fromEntries(
                    exams.map(e => [e.id, { ...e, teacher: teachersData[e.created_by] }])
                );
            }
        }

        // Fetch comprehensive exam attempts
        const { data: compAttempts, error: compError } = await supabase
            .from("comprehensive_exam_attempts")
            .select("id, exam_id, student_id, status, total_score, max_score, started_at, completed_at, created_at")
            .eq("student_id", user.id)
            .order("created_at", { ascending: false });

        if (compError) {
            console.error("[ExamHistory API] Error fetching comprehensive attempts:", compError);
        }

        // Get comprehensive exam details
        const compExamIds = (compAttempts || []).map(a => a.exam_id);
        let compExamsData: Record<string, any> = {};

        if (compExamIds.length > 0) {
            const { data: exams } = await supabase
                .from("comprehensive_exams")
                .select("id, exam_title, type")
                .in("id", compExamIds);

            if (exams) {
                compExamsData = Object.fromEntries(exams.map(e => [e.id, e]));
            }
        }

        // Normalize teacher exam attempts
        const normalizedTeacher: ExamAttempt[] = (teacherAttempts || []).map((a: any) => {
            const examData = teacherExamsData[a.exam_id];
            return {
                id: a.id,
                exam_id: a.exam_id,
                student_id: a.student_id,
                status: a.status,
                total_score: a.total_score,
                max_score: a.max_score,
                started_at: a.started_at,
                completed_at: a.completed_at,
                created_at: a.created_at,
                exam_title: examData?.exam_title,
                exam_type: examData?.type,
                teacher_name: examData?.teacher?.name,
                teacher_id: examData?.teacher?.id,
                source: "teacher" as const,
            };
        });

        // Normalize comprehensive exam attempts
        const normalizedComp: ExamAttempt[] = (compAttempts || []).map((a: any) => {
            const examData = compExamsData[a.exam_id];
            return {
                id: a.id,
                exam_id: a.exam_id,
                student_id: a.student_id,
                status: a.status,
                total_score: a.total_score,
                max_score: a.max_score,
                started_at: a.started_at,
                completed_at: a.completed_at,
                created_at: a.created_at,
                exam_title: examData?.exam_title,
                exam_type: examData?.type,
                source: "comprehensive" as const,
            };
        });

        const allAttempts = [...normalizedTeacher, ...normalizedComp];
        console.log('[ExamHistory API] Found:', allAttempts.length, 'attempts');

        return NextResponse.json(
            { success: true, data: allAttempts },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[ExamHistory API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error', data: [] },
            { status: 500, headers: securityHeaders }
        );
    }
}
