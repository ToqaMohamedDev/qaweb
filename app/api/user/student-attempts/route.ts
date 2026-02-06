/**
 * Student Exam Attempts API Route
 * 
 * Fetches student's exam attempts and question bank progress
 * Uses server-side Supabase client for reliable connection on Vercel
 * Calls RPC functions: get_student_exam_attempts and get_student_question_bank_progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

export async function GET(request: NextRequest) {
    console.log('[StudentAttempts API] Fetching attempts...');

    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'exams'; // 'exams' or 'progress'
        const studentId = searchParams.get('studentId'); // optional

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[StudentAttempts API] No authenticated user');
            return NextResponse.json(
                { success: false, error: 'Not authenticated', data: null },
                { status: 401, headers: securityHeaders }
            );
        }

        console.log('[StudentAttempts API] User:', user.email, 'Type:', type);

        if (type === 'exams') {
            // Fetch exam attempts
            // Cast to any to allow custom RPC function calls not in generated types
            const { data, error } = await (supabase as any).rpc('get_student_exam_attempts', {
                p_student_id: studentId || null,
            });

            if (error) {
                console.error('[StudentAttempts API] RPC Error:', error.message);
                return NextResponse.json(
                    { success: false, error: error.message, data: null },
                    { status: 400, headers: securityHeaders }
                );
            }

            console.log('[StudentAttempts API] Exams found:',
                data?.comprehensive_exams?.length || 0, 'comprehensive,',
                data?.teacher_exams?.length || 0, 'teacher');

            return NextResponse.json(
                { success: true, data },
                { status: 200, headers: securityHeaders }
            );

        } else if (type === 'progress') {
            // Fetch question bank progress
            // Cast to any to allow custom RPC function calls not in generated types
            const { data, error } = await (supabase as any).rpc('get_student_question_bank_progress', {
                p_student_id: studentId || null,
            });

            if (error) {
                console.error('[StudentAttempts API] RPC Error:', error.message);
                return NextResponse.json(
                    { success: false, error: error.message, data: [] },
                    { status: 400, headers: securityHeaders }
                );
            }

            console.log('[StudentAttempts API] Progress items:', data?.length || 0);

            return NextResponse.json(
                { success: true, data: data || [] },
                { status: 200, headers: securityHeaders }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Invalid type parameter', data: null },
            { status: 400, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[StudentAttempts API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error', data: null },
            { status: 500, headers: securityHeaders }
        );
    }
}
