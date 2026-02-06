/**
 * User Subscriptions API Route
 * 
 * Fetches user's teacher subscriptions
 * Uses server-side Supabase client for reliable connection on Vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

// GET: Get user's subscriptions
export async function GET() {
    console.log('[Subscriptions API] Fetching subscriptions...');

    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('[Subscriptions API] No authenticated user');
            return NextResponse.json(
                { success: false, error: 'Not authenticated', data: [] },
                { status: 401, headers: securityHeaders }
            );
        }

        console.log('[Subscriptions API] User:', user.email);

        // Fetch subscriptions with teacher details
        const { data, error } = await supabase
            .from("teacher_subscriptions")
            .select(`
                id,
                teacher_id,
                created_at,
                teacher:profiles!teacher_subscriptions_teacher_id_fkey(
                    id,
                    name,
                    email,
                    avatar_url,
                    bio,
                    specialization,
                    rating_average,
                    rating_count,
                    subscriber_count,
                    exam_count,
                    is_verified,
                    subjects
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error('[Subscriptions API] Error:', error.message);
            return NextResponse.json(
                { success: false, error: error.message, data: [] },
                { status: 400, headers: securityHeaders }
            );
        }

        // Filter out null teachers and normalize
        const validSubs = (data || [])
            .filter((s: any) => s.teacher !== null)
            .map((s: any) => ({
                id: s.id,
                teacher_id: s.teacher_id,
                created_at: s.created_at,
                teacher: s.teacher,
            }));

        console.log('[Subscriptions API] Found:', validSubs.length, 'subscriptions');

        return NextResponse.json(
            { success: true, data: validSubs },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Subscriptions API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error', data: [] },
            { status: 500, headers: securityHeaders }
        );
    }
}

// DELETE: Unsubscribe from a teacher
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

        const { subscriptionId } = await request.json();

        if (!subscriptionId) {
            return NextResponse.json(
                { success: false, error: 'Missing subscriptionId' },
                { status: 400, headers: securityHeaders }
            );
        }

        const { error } = await supabase
            .from("teacher_subscriptions")
            .delete()
            .eq("id", subscriptionId)
            .eq("user_id", user.id); // Security: only delete own subscriptions

        if (error) {
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
        console.error('[Subscriptions API] Delete error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}
