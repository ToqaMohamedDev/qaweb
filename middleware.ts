/**
 * Middleware for handling Supabase Authentication & Routing
 * =======================================================
 * 
 * CRITICAL: This middleware runs on EVERY request and:
 * 1. Refreshes the user's session (keeps auth cookies fresh)
 * 2. Protects sensitive routes (requires login/role)
 * 3. Redirects authenticated users from auth pages
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// =============================================
// ROUTE CONSTANTS
// =============================================

// الصفحات التي لا تحتاج authentication
const PUBLIC_ROUTES = new Set([
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/arabic',
    '/english',
    '/teachers',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/support',
    '/game',
    '/game/create',
]);

// الصفحات التي تبدأ بهذه المسارات عامة
const PUBLIC_PREFIXES = [
    '/arabic/',
    '/english/',
    '/teachers/',
    '/api/',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 0. SKIP STATIC FILES & ASSETS
    // =================================================
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 1. INITIALIZE SUPABASE CLIENT & REFRESH SESSION
    // =================================================
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Update request cookies
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    // Create new response with updated cookies
                    supabaseResponse = NextResponse.next({
                        request,
                    });

                    // Set cookies on response
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            // Ensure cookies work on Vercel
                            path: '/',
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                        })
                    );
                },
            },
        }
    );

    // CRITICAL: Always call getUser() to refresh session
    // This updates the auth cookies if they're expired
    const { data: { user } } = await supabase.auth.getUser();

    // 2. CHECK ROUTE TYPE
    // =================================================
    const isPublicRoute = PUBLIC_ROUTES.has(pathname) ||
        PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // 3. PUBLIC ROUTES - ALWAYS RETURN WITH REFRESHED COOKIES
    // =================================================
    if (isPublicRoute) {
        return supabaseResponse;
    }

    // 4. AUTH ROUTES - REDIRECT LOGGED IN USERS TO HOME
    // =================================================
    if ((pathname === '/login' || pathname === '/signup') && user) {
        const response = NextResponse.redirect(new URL('/', request.url));
        // Copy cookies to redirect response
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value);
        });
        return response;
    }

    // 5. PROTECTED ROUTES - REQUIRES LOGIN
    // =================================================
    if (!user) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // 6. ROLE-BASED PROTECTION (only for admin/teacher routes)
    // =================================================
    if (pathname.startsWith('/admin') || pathname.startsWith('/teacher')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // Admin Protection
        if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Teacher Protection
        if (pathname.startsWith('/teacher') &&
            profile?.role !== 'teacher' &&
            profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Return response with updated cookies
    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico
         * - static files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
