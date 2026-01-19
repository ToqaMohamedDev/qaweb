/**
 * Middleware for handling Supabase Authentication & Routing
 * =======================================================
 * 
 * 1. Refreshes the user's session on every request (Supabase Requirement)
 * 2. Protects sensitive routes (requires login/role)
 * 3. Redirects authenticated users from auth pages to home
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// =============================================
// ROUTE CONSTANTS
// =============================================

// الصفحات التي لا تحتاج authentication
const PUBLIC_ROUTES = [
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
];

// الصفحات التي تبدأ بهذه المسارات عامة
const PUBLIC_PREFIXES = [
    '/arabic/',
    '/english/',
    '/teachers/',
    '/api/public',
    '/api/webhooks', // Important for Stripe/etc
];

// الصفحات المحمية حسب الدور
const PROTECTED_ROUTES = {
    admin: '/admin',
    teacher: '/teacher',
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 0. SKIP STATIC FILES & ASSETS
    // =================================================
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') ||
        pathname.startsWith('/favicon.ico')
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
                    // Update request cookies for subsequent checks
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    supabaseResponse = NextResponse.next({
                        request,
                    });

                    // Update response cookies to persist session
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: This refreshes the session token if expired
    const { data: { user }, error } = await supabase.auth.getUser();

    // 2. CHECK ROUTE TYPE
    // =================================================
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
        PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // 3. PUBLIC ROUTES - ALLOW ALL
    // =================================================
    if (isPublicRoute) {
        return supabaseResponse;
    }

    // 4. AUTH ROUTES (Login/Signup) - REDIRECT IF LOGGED IN
    // =================================================
    if ((pathname === '/login' || pathname === '/signup') && user) {
        const url = new URL('/', request.url);
        return NextResponse.redirect(url);
    }

    // 5. PROTECTED ROUTES - REQUIRES LOGIN
    // =================================================
    if (!user) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        // Important: Return redirect but we lose cookie updates if we don't handle them?
        // Usually redirects for non-auth users don't need cookie updates unless we were clearing them.
        return NextResponse.redirect(redirectUrl);
    }

    // 6. ROLE-BASED PROTECTION
    // =================================================
    // Only fetch profile if we are in a role-protected route
    // to save DB calls on normal pages
    if (
        pathname.startsWith(PROTECTED_ROUTES.admin) ||
        pathname.startsWith(PROTECTED_ROUTES.teacher) ||
        pathname === '/onboarding' ||
        (!pathname.startsWith('/profile') && !pathname.startsWith('/game')) // Check strict role enforcement
    ) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, role_selected')
            .eq('id', user.id)
            .single();

        // 6a. Force Onboarding if role not selected
        if (profile && !profile.role_selected && pathname !== '/onboarding') {
            const url = new URL('/onboarding', request.url);
            return NextResponse.redirect(url);
        }

        // 6b. Admin Protection
        if (pathname.startsWith(PROTECTED_ROUTES.admin)) {
            if (profile?.role !== 'admin') {
                const url = new URL('/', request.url);
                return NextResponse.redirect(url);
            }
        }

        // 6c. Teacher Protection
        if (pathname.startsWith(PROTECTED_ROUTES.teacher)) {
            if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
                const url = new URL('/', request.url);
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
