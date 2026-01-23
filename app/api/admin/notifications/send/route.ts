/**
 * ============================================================================
 * API: ADMIN SEND NOTIFICATIONS
 * ============================================================================
 * 
 * POST /api/admin/notifications/send
 * 
 * Allows admins to send notifications to:
 * - All users
 * - Specific role (students, teachers, admins)
 * - Verified teachers only
 * - Subscribers of specific teachers
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notifyAll } from '@/lib/onesignal/server';

// =============================================
// Helper Functions
// =============================================

async function createSupabaseAuthClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { /* Read-only in API routes */ },
            },
        }
    );
}

function createSupabaseAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return []; },
                setAll() { },
            },
        }
    );
}

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createSupabaseAuthClient>>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { authorized: false, error: 'Forbidden - Admin access required', status: 403 };
    }

    return { authorized: true, user, profile };
}

// =============================================
// POST - Send Notification
// =============================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            message,
            target_role = 'all',
            scheduled_for = null,
            send_immediately = true,
            teacher_verified_only = false,
            teacher_id = null, // For sending to teacher subscribers
        } = body;

        // Validate required fields
        if (!title || !message) {
            return NextResponse.json(
                { error: 'Title and message are required' },
                { status: 400 }
            );
        }

        // Verify admin access
        const authClient = await createSupabaseAuthClient();
        const authResult = await verifyAdmin(authClient);
        
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const adminClient = createSupabaseAdminClient();
        const now = new Date().toISOString();
        const status = send_immediately ? 'sent' : 'pending';
        const sent_at = send_immediately ? now : null;

        // =============================================
        // CASE 1: Send to teacher subscribers
        // =============================================
        if (teacher_id) {
            const { data: subscribers, error: subError } = await adminClient
                .from('teacher_subscriptions')
                .select('user_id')
                .eq('teacher_id', teacher_id)
                .eq('notifications_enabled', true);

            if (subError) {
                console.error('Error fetching subscribers:', subError);
                return NextResponse.json(
                    { error: 'Failed to fetch subscribers' },
                    { status: 500 }
                );
            }

            if (!subscribers || subscribers.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'No subscribers found',
                    notified: 0
                });
            }

            // Create individual notifications for each subscriber
            const notifications = subscribers.map(sub => ({
                user_id: sub.user_id,
                title,
                message,
                target_role: 'students',
                status,
                sent_at,
                scheduled_for,
                created_by: authResult.user!.id,
            }));

            const { error: insertError } = await adminClient
                .from('notifications')
                .insert(notifications);

            if (insertError) {
                console.error('Error inserting notifications:', insertError);
                return NextResponse.json(
                    { error: 'Failed to create notifications' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: `Notifications sent to ${subscribers.length} subscribers`,
                notified: subscribers.length
            });
        }

        // =============================================
        // CASE 2: Send to specific role or all users
        // =============================================

        // Get target users
        let query = adminClient
            .from('profiles')
            .select('id, role');

        // Filter by role
        if (target_role !== 'all') {
            query = query.eq('role', target_role);
        }

        // Filter verified teachers only
        if (teacher_verified_only && target_role === 'teachers') {
            query = query.eq('is_teacher_approved', true);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) {
            console.error('Error fetching users:', usersError);
            return NextResponse.json(
                { error: 'Failed to fetch users' },
                { status: 500 }
            );
        }

        if (!users || users.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No users found matching criteria',
                notified: 0
            });
        }

        // Create individual notifications for each user
        const notifications = users.map(user => ({
            user_id: user.id,
            title,
            message,
            target_role,
            status,
            sent_at,
            scheduled_for,
            created_by: authResult.user!.id,
        }));

        const { error: insertError } = await adminClient
            .from('notifications')
            .insert(notifications);

        if (insertError) {
            console.error('Error inserting notifications:', insertError);
            return NextResponse.json(
                { error: 'Failed to create notifications' },
                { status: 500 }
            );
        }

        // Send push notification via OneSignal (if immediate)
        if (send_immediately) {
            await notifyAll({
                title,
                message,
            }).catch(err => console.error('OneSignal error:', err));
        }

        return NextResponse.json({
            success: true,
            message: `Notifications sent to ${users.length} users`,
            notified: users.length,
            target_role,
            status
        });

    } catch (error) {
        console.error('Send notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
