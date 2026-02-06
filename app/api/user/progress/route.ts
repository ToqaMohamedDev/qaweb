/**
 * User Learning Progress API Route
 * 
 * Fetches user's lesson progress data
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
    console.log('[Progress API] Fetching progress...');

    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[Progress API] No authenticated user');
            return NextResponse.json(
                { success: false, error: 'Not authenticated', data: { progress: [], stats: null } },
                { status: 401, headers: securityHeaders }
            );
        }

        console.log('[Progress API] User:', user.email);

        // Fetch progress with lesson details
        const { data, error } = await supabase
            .from("user_lesson_progress")
            .select(`
                *,
                lesson:lessons(
                    id,
                    title,
                    description,
                    image_url,
                    subject:subjects(id, name, icon, color),
                    stage:educational_stages(id, name)
                )
            `)
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error('[Progress API] Error:', error.message);
            return NextResponse.json(
                { success: false, error: error.message, data: { progress: [], stats: null } },
                { status: 400, headers: securityHeaders }
            );
        }

        const progressData = data || [];

        // Calculate stats
        const completed = progressData.filter((p: any) => p.is_completed).length;
        const inProgress = progressData.filter((p: any) => !p.is_completed && p.progress_percentage > 0).length;
        const totalPct = progressData.reduce((sum: number, p: any) => sum + (p.progress_percentage || 0), 0);

        const stats = {
            totalLessons: progressData.length,
            completedLessons: completed,
            inProgressLessons: inProgress,
            overallProgress: progressData.length > 0 ? Math.round(totalPct / progressData.length) : 0,
        };

        console.log('[Progress API] Found:', progressData.length, 'lessons');

        return NextResponse.json(
            { success: true, data: { progress: progressData, stats } },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Progress API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error', data: { progress: [], stats: null } },
            { status: 500, headers: securityHeaders }
        );
    }
}
