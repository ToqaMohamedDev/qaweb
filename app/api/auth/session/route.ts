import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper: wrap a promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
    ]);
}

export async function GET() {
    const startTime = Date.now();
    console.log('[Session API] Started');

    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
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
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        );

        // Get session with 5-second timeout to prevent Vercel hang
        console.log('[Session API] Getting session...');
        const sessionResult = await withTimeout(
            supabase.auth.getSession(),
            5000,
            { data: { session: null }, error: { message: 'Timeout' } as any }
        );

        const { data: { session }, error } = sessionResult;
        console.log(`[Session API] getSession completed in ${Date.now() - startTime}ms, hasSession: ${!!session}`);

        if (error || !session) {
            console.log('[Session API] No session found, returning null');
            return NextResponse.json({ user: null, profile: null }, { status: 200 });
        }

        // Get profile with 3-second timeout
        console.log('[Session API] Getting profile...');
        const profileResult = await withTimeout(
            (async () => {
                return await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            })(),
            3000,
            { data: null, error: { message: 'Timeout' }, count: null, status: 408, statusText: 'Timeout' } as any
        );

        const { data: profile } = profileResult;
        console.log(`[Session API] Total time: ${Date.now() - startTime}ms`);

        return NextResponse.json({
            user: session.user,
            profile: profile
        }, { status: 200 });

    } catch (error) {
        console.error('[Session API] Error:', error, `Time: ${Date.now() - startTime}ms`);
        return NextResponse.json({ user: null, error: 'Internal Server Error' }, { status: 500 });
    }
}
