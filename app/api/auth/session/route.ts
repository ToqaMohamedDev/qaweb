import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        // Get the session from the cookie
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            return NextResponse.json({ user: null, profile: null }, { status: 200 });
        }

        // Check DB for profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        return NextResponse.json({
            user: session.user,
            profile: profile
        }, { status: 200 });

    } catch (error) {
        console.error('Session API Error:', error);
        return NextResponse.json({ user: null, error: 'Internal Server Error' }, { status: 500 });
    }
}
