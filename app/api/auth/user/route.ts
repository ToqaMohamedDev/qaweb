/**
 * Auth User API Route
 * Returns current authenticated user data
 * Used by client components instead of direct supabase.auth.getUser()
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// =============================================
// GET - Get current user
// =============================================

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: true,
                data: {
                    user: null,
                    profile: null,
                    isAuthenticated: false,
                }
            });
        }

        // Optionally fetch profile
        const { searchParams } = new URL(request.url);
        const includeProfile = searchParams.get('includeProfile') === 'true';

        let profile = null;
        if (includeProfile) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            profile = profileData;
        }

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    created_at: user.created_at,
                },
                profile,
                isAuthenticated: true,
            }
        });

    } catch (error) {
        console.error('Auth user error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error', data: { user: null, profile: null, isAuthenticated: false } },
            { status: 500 }
        );
    }
}
