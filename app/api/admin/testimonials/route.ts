/**
 * Admin Testimonials API Route
 * =============================================
 * Handles admin operations for testimonials
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// =============================================
// Helpers
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
                setAll() { },
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
// GET - Get all testimonials (admin)
// =============================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const limit = parseInt(searchParams.get('limit') || '50');

        const authClient = await createSupabaseAuthClient();
        const authResult = await verifyAdmin(authClient);

        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const adminClient = createSupabaseAdminClient();

        let query = adminClient
            .from('testimonials')
            .select(`
                *,
                user:user_id (
                    id,
                    name,
                    email,
                    avatar_url,
                    role
                ),
                reviewer:reviewed_by (
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[Admin Testimonials API] Error:', error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data, count, success: true });

    } catch (error) {
        console.error('[Admin Testimonials API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// =============================================
// PATCH - Update testimonial status (approve/reject)
// =============================================

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, admin_notes } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Testimonial ID is required' },
                { status: 400 }
            );
        }

        if (!status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'Status must be "approved" or "rejected"' },
                { status: 400 }
            );
        }

        const authClient = await createSupabaseAuthClient();
        const authResult = await verifyAdmin(authClient);

        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const adminClient = createSupabaseAdminClient();

        const { data, error } = await adminClient
            .from('testimonials')
            .update({
                status,
                admin_notes: admin_notes || null,
                reviewed_by: authResult.user?.id,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Admin Testimonials API] Update Error:', error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data,
            success: true,
            message: status === 'approved' ? 'تم قبول الرأي' : 'تم رفض الرأي'
        });

    } catch (error) {
        console.error('[Admin Testimonials API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// =============================================
// DELETE - Delete a testimonial
// =============================================

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Testimonial ID is required' },
                { status: 400 }
            );
        }

        const authClient = await createSupabaseAuthClient();
        const authResult = await verifyAdmin(authClient);

        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const adminClient = createSupabaseAdminClient();

        const { error } = await adminClient
            .from('testimonials')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Admin Testimonials API] Delete Error:', error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'تم حذف الرأي بنجاح'
        });

    } catch (error) {
        console.error('[Admin Testimonials API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
