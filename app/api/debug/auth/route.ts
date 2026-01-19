/**
 * Debug endpoint to check auth status and session
 * Visit: /api/debug/auth
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();

    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(c =>
        c.name.includes('supabase') ||
        c.name.includes('sb-')
    );

    // Create Supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set() { },
                remove() { },
            },
        }
    );

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Try a simple query
    let stageResult = null;
    let stageError = null;
    try {
        const result = await supabase
            .from('educational_stages')
            .select('id, name')
            .limit(1);
        stageResult = result.data;
        stageError = result.error;
    } catch (e: any) {
        stageError = e.message;
    }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        cookies: {
            total: allCookies.length,
            supabase: supabaseCookies.map(c => ({
                name: c.name,
                valueLength: c.value?.length || 0,
            })),
        },
        session: {
            exists: !!session,
            expiresAt: session?.expires_at,
            error: sessionError?.message,
        },
        user: {
            exists: !!user,
            id: user?.id,
            email: user?.email,
            error: userError?.message,
        },
        testQuery: {
            success: !!stageResult,
            resultCount: stageResult?.length || 0,
            error: stageError?.message || stageError,
        }
    }, {
        headers: {
            'Cache-Control': 'no-store',
        }
    });
}
