/**
 * Subscriptions API Route
 * Handles teacher subscriptions for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

// Ensure user profile exists in profiles table
async function ensureProfileExists(userId: string, userEmail: string | undefined) {
    const adminClient = createAdminClient();
    
    // Check if profile exists
    const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
    
    if (!existingProfile) {
        // Create profile with default student role
        const { error: createError } = await adminClient
            .from('profiles')
            .insert({
                id: userId,
                email: userEmail || '',
                role: 'student',
                role_selected: false,
                name: userEmail?.split('@')[0] || 'مستخدم جديد',
            });
        
        if (createError) {
            console.error('Error creating profile:', createError);
            return false;
        }
    }
    
    return true;
}

// =============================================
// GET - Fetch user's subscriptions
// =============================================

export async function GET() {
    try {
        const supabase = await createServerClient();

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
        const supabase = await createServerClient();

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

        // Ensure user profile exists (fixes FK constraint for new users)
        const profileExists = await ensureProfileExists(user.id, user.email);
        if (!profileExists) {
            return NextResponse.json(
                { success: false, error: 'فشل في إنشاء الملف الشخصي' },
                { status: 500 }
            );
        }

        // Use admin client for subscription operations to bypass RLS issues
        const adminClient = createAdminClient();

        // Check if already subscribed
        const { data: existing } = await adminClient
            .from('teacher_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('teacher_id', teacherId)
            .single();

        if (existing) {
            // Already subscribed, return current count
            const { count } = await adminClient
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
        const { error: insertError } = await adminClient
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
        const { count } = await adminClient
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
        const supabase = await createServerClient();

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

        // Use admin client for subscription operations
        const adminClient = createAdminClient();

        // Unsubscribe
        const { error: deleteError } = await adminClient
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
        const { count } = await adminClient
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
