/**
 * Teacher Profile API Route
 * 
 * Update teacher profile information
 * Uses server-side Supabase client for reliable connection on Vercel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

// GET: Get profile data
export async function GET() {
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

        // Get profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400, headers: securityHeaders }
            );
        }

        return NextResponse.json(
            { success: true, data: profile },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Profile API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}

// PATCH: Update profile
export async function PATCH(request: NextRequest) {
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

        const body = await request.json();

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({
                name: body.name,
                bio: body.bio,
                avatar_url: body.avatar_url,
                cover_image_url: body.cover_image_url,
                specialization: body.specialization,
                teacher_title: body.teacher_title,
                years_of_experience: body.years_of_experience,
                education: body.education,
                phone: body.phone,
                website: body.website,
                teaching_style: body.teaching_style,
                subjects: body.subjects,
                stages: body.stages,
                is_teacher_profile_public: body.is_teacher_profile_public,
                social_links: body.social_links,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            console.error('[Profile API] Update error:', error.message);
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
        console.error('[Profile API] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}
