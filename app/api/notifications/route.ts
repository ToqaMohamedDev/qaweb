/**
 * ============================================================================
 * NOTIFICATIONS API ROUTE
 * ============================================================================
 * 
 * GET  /api/notifications        - جلب الإشعارات
 * POST /api/notifications        - عمليات متنوعة (mark read, delete, etc.)
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// ============================================================================
// GET - Fetch notifications
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', notifications: [], unreadCount: 0 },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const page = parseInt(searchParams.get('page') || '1');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const type = searchParams.get('type');

        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data: notifications, error, count } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json(
                { error: 'Failed to fetch notifications', notifications: [], unreadCount: 0 },
                { status: 500 }
            );
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        return NextResponse.json({
            notifications: notifications || [],
            total: count || 0,
            unreadCount: unreadCount || 0,
            page,
            limit,
        });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', notifications: [], unreadCount: 0 },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST - Mark as read, delete, etc.
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, notificationId, notificationIds } = body;

        switch (action) {
            case 'markAsRead': {
                if (!notificationId) {
                    return NextResponse.json({ error: 'notificationId required' }, { status: 400 });
                }

                const { error } = await supabase
                    .from('notifications')
                    .update({ is_read: true, read_at: new Date().toISOString() })
                    .eq('id', notificationId)
                    .eq('user_id', user.id);

                if (error) {
                    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
                }

                return NextResponse.json({ success: true });
            }

            case 'markAllAsRead': {
                const { error } = await supabase
                    .from('notifications')
                    .update({ is_read: true, read_at: new Date().toISOString() })
                    .eq('user_id', user.id)
                    .eq('is_read', false);

                if (error) {
                    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
                }

                return NextResponse.json({ success: true });
            }

            case 'delete': {
                if (!notificationId) {
                    return NextResponse.json({ error: 'notificationId required' }, { status: 400 });
                }

                const { error } = await supabase
                    .from('notifications')
                    .delete()
                    .eq('id', notificationId)
                    .eq('user_id', user.id);

                if (error) {
                    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
                }

                return NextResponse.json({ success: true });
            }

            case 'deleteMultiple': {
                if (!notificationIds || !Array.isArray(notificationIds)) {
                    return NextResponse.json({ error: 'notificationIds array required' }, { status: 400 });
                }

                const { error } = await supabase
                    .from('notifications')
                    .delete()
                    .in('id', notificationIds)
                    .eq('user_id', user.id);

                if (error) {
                    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
                }

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Notifications POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
