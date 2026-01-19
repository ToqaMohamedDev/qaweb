import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    // CRITICAL: Get the correct origin from headers to handle Vercel's proxy
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle errors from provider
    if (errorParam) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`);
    }

    if (code) {
        const cookieStore = await cookies();

        // Collect cookies to set on the final response
        const cookiesToSet: { name: string; value: string; options: any }[] = [];

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookies) {
                        // Don't set on cookieStore - collect them for the response
                        cookies.forEach(cookie => {
                            cookiesToSet.push(cookie);
                        });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Create redirect response
            const response = NextResponse.redirect(`${origin}${next}`);

            // CRITICAL: Set cookies on the response object directly
            // This ensures they are sent with the redirect
            cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, {
                    ...options,
                    path: options?.path || '/',
                    secure: protocol === 'https',
                    sameSite: 'lax',
                });
            });

            console.log(`[Auth Callback] Success! Setting ${cookiesToSet.length} cookies and redirecting to ${origin}${next}`);
            return response;
        } else {
            console.error('[Auth Callback] Exchange Error:', error);
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}&code=exchange_failed`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=no_code_provided`);
}
