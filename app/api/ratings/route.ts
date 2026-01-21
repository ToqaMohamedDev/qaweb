/**
 * Teacher Ratings API Route
 * Handles fetching and submitting teacher ratings
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
// GET - Fetch ratings for a teacher
// =============================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');

        if (!teacherId) {
            return NextResponse.json(
                { success: false, error: 'Missing teacherId' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Fetch ratings
        const { data: ratingsData, error: ratingsError } = await supabase
            .from('teacher_ratings')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (ratingsError) {
            return NextResponse.json(
                { success: false, error: ratingsError.message },
                { status: 500 }
            );
        }

        // Get user profiles for ratings
        if (ratingsData && ratingsData.length > 0) {
            const userIds = [...new Set(ratingsData.map(r => r.user_id))];

            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', userIds);

            const usersMap = new Map((usersData || []).map(u => [u.id, u]));

            const ratingsWithUsers = ratingsData.map(r => ({
                ...r,
                user: usersMap.get(r.user_id) || null,
            }));

            // Calculate stats
            const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            let sum = 0;
            ratingsWithUsers.forEach(r => {
                if (r.rating >= 1 && r.rating <= 5) {
                    distribution[r.rating]++;
                    sum += r.rating;
                }
            });

            return NextResponse.json({
                success: true,
                data: {
                    ratings: ratingsWithUsers,
                    stats: {
                        average: ratingsWithUsers.length > 0 ? sum / ratingsWithUsers.length : 0,
                        total: ratingsWithUsers.length,
                        distribution,
                    },
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                ratings: [],
                stats: {
                    average: 0,
                    total: 0,
                    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                },
            },
        });

    } catch (error) {
        console.error('Ratings GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

// =============================================
// POST - Submit or update a rating
// =============================================

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'يجب تسجيل الدخول' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { teacherId, rating, review, existingRatingId } = body;

        if (!teacherId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Invalid rating data' },
                { status: 400 }
            );
        }

        if (existingRatingId) {
            // Update existing rating
            const { error } = await supabase
                .from('teacher_ratings')
                .update({
                    rating,
                    review: review?.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingRatingId)
                .eq('user_id', user.id); // Security: only update own rating

            if (error) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }
        } else {
            // Create new rating
            const { error } = await supabase
                .from('teacher_ratings')
                .insert({
                    user_id: user.id,
                    teacher_id: teacherId,
                    rating,
                    review: review?.trim() || null,
                });

            if (error) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }
        }

        // Update teacher's average rating
        const { data: allRatings } = await supabase
            .from('teacher_ratings')
            .select('rating')
            .eq('teacher_id', teacherId);

        if (allRatings && allRatings.length > 0) {
            const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
            const avg = sum / allRatings.length;

            await supabase
                .from('profiles')
                .update({
                    rating_average: avg,
                    rating_count: allRatings.length,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', teacherId);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Ratings POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
