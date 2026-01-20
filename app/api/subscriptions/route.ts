/**
 * Subscriptions API Route
 * Handles teacher subscriptions for authenticated users
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
// GET - Fetch user's subscriptions
// =============================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, data: [], message: 'Not authenticated' },
                { status: 200 } // Return 200 with empty data for unauthenticated
            );
        }

        // Fetch subscriptions
        const { data, error } = await supabase
            .from('teacher_subscriptions')
            .select('teacher_id')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json(
                { success: false, data: [], error: error.message },
                { status: 200 }
            );
        }

        const teacherIds = data?.map(s => s.teacher_id) || [];

        return NextResponse.json({
            success: true,
            data: teacherIds,
            userId: user.id
        });

    } catch (error) {
        console.error('Subscriptions GET error:', error);
        return NextResponse.json(
            { success: false, data: [], error: 'Server error' },
            { status: 500 }
        );
    }
}

// =============================================
// POST - Subscribe to a teacher
// =============================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'يجب تسجيل الدخول للاشتراك' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { teacherId } = body;

        if (!teacherId) {
            return NextResponse.json(
                { success: false, error: 'Teacher ID is required' },
                { status: 400 }
            );
        }

        // Check if already subscribed
        const { data: existing } = await supabase
            .from('teacher_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('teacher_id', teacherId)
            .single();

        if (existing) {
            // Already subscribed, return current count
            const { count } = await supabase
                .from('teacher_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', teacherId);

            return NextResponse.json({
                success: true,
                action: 'already_subscribed',
                newCount: count || 0
            });
        }

        // Subscribe
        const { error: insertError } = await supabase
            .from('teacher_subscriptions')
            .insert({
                user_id: user.id,
                teacher_id: teacherId,
            });

        if (insertError) {
            console.error('Subscribe error:', insertError);
            return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500 }
            );
        }

        // Get new count
        const { count } = await supabase
            .from('teacher_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        return NextResponse.json({
            success: true,
            action: 'subscribed',
            newCount: count || 0
        });

    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

// =============================================
// DELETE - Unsubscribe from a teacher
// =============================================

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'يجب تسجيل الدخول لإلغاء الاشتراك' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');

        if (!teacherId) {
            return NextResponse.json(
                { success: false, error: 'Teacher ID is required' },
                { status: 400 }
            );
        }

        // Unsubscribe
        const { error: deleteError } = await supabase
            .from('teacher_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('teacher_id', teacherId);

        if (deleteError) {
            console.error('Unsubscribe error:', deleteError);
            return NextResponse.json(
                { success: false, error: deleteError.message },
                { status: 500 }
            );
        }

        // Get new count
        const { count } = await supabase
            .from('teacher_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        return NextResponse.json({
            success: true,
            action: 'unsubscribed',
            newCount: count || 0
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
