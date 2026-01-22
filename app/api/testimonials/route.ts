/**
 * Testimonials API Route
 * =============================================
 * Handles public testimonials (approved only)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// =============================================
// Helpers
// =============================================

async function createSupabaseClient() {
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

// =============================================
// GET - Get approved testimonials (public)
// =============================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '6');

        const supabase = await createSupabaseClient();

        // Fetch testimonials
        const { data: testimonials, error } = await supabase
            .from('testimonials')
            .select('id, content, rating, created_at, user_id')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Testimonials API] Error:', error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        if (!testimonials || testimonials.length === 0) {
            return NextResponse.json({ data: [], success: true });
        }

        // Fetch profiles for the testimonial authors
        const userIds = testimonials.map(t => t.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, role')
            .in('id', userIds);

        // Map profiles to testimonials
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const data = testimonials.map(t => ({
            ...t,
            profiles: profilesMap.get(t.user_id) || { id: t.user_id, name: 'مستخدم', avatar_url: null, role: 'student' }
        }));

        return NextResponse.json({ data, success: true });

    } catch (error) {
        console.error('[Testimonials API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// =============================================
// POST - Submit a new testimonial (authenticated)
// =============================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, rating } = body;

        if (!content || content.trim().length < 10) {
            return NextResponse.json(
                { error: 'الرأي يجب أن يكون 10 أحرف على الأقل' },
                { status: 400 }
            );
        }

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'التقييم يجب أن يكون بين 1 و 5' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول لإضافة رأي' },
                { status: 401 }
            );
        }

        // Check if user already has a pending or approved testimonial
        const { data: existing } = await supabase
            .from('testimonials')
            .select('id, status')
            .eq('user_id', user.id)
            .in('status', ['pending', 'approved'])
            .single();

        if (existing) {
            const statusMessage = existing.status === 'pending'
                ? 'لديك رأي قيد المراجعة بالفعل'
                : 'لديك رأي معتمد بالفعل';
            return NextResponse.json(
                { error: statusMessage },
                { status: 400 }
            );
        }

        // Insert new testimonial
        const { data, error } = await supabase
            .from('testimonials')
            .insert({
                user_id: user.id,
                content: content.trim(),
                rating,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('[Testimonials API] Insert Error:', error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data,
            success: true,
            message: 'تم إرسال رأيك بنجاح وسيتم مراجعته قريباً'
        }, { status: 201 });

    } catch (error) {
        console.error('[Testimonials API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
