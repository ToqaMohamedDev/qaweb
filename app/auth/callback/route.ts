import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development';
            let redirectTo = `${origin}${next}`;

            if (process.env.NODE_ENV === 'production' && forwardedHost) {
                redirectTo = `https://${forwardedHost}${next}`;
            }

            const response = NextResponse.redirect(redirectTo);

            // CRITICAL: Explicitly apply cookies from the store to the response
            // This bridges the gap for Vercel environments
            const allCookies = cookieStore.getAll();

            allCookies.forEach(cookie => {
                // Only copy Supabase auth cookies to avoid bloating headers
                // or just copy all to be safe. Copying all is safer for session consistency.
                response.cookies.set({
                    name: cookie.name,
                    value: cookie.value,
                    path: '/', // Force root path
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax', // Required for Google Auth redirection flow
                    httpOnly: false,
                    maxAge: 60 * 60 * 24 * 7 // 1 week (or keep original if available, but cookieStore doesn't always expose original maxAge)
                });
            });

            return response;
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
