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
    // CRITICAL: We MUST initialize Supabase logic even for public routes
    // to ensure session cookies are refreshed/maintained.

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
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // CRITICAL: Always call getUser() to refresh session
    // This updates the auth cookies if they're expired
    let user = null;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            // تجاهل أخطاء التوكن المنتهي، فهي طبيعية وتعني أن المستخدم يحتاج لتسجيل الدخول
            if (!error.message.includes('Refresh Token Not Found') &&
                !error.message.includes('Invalid Refresh Token')) {
                console.error('Middleware Auth Error:', error.message);
            }
        }
        user = data?.user ?? null;
    } catch (err) {
        // حماية إضافية ضد أي كراش غير متوقع أثناء التحقق
        console.error('Middleware Auth Exception:', err);
        user = null;
    }

    // 2. AUTH ROUTES - REDIRECT LOGGED IN USERS TO HOME
    // =================================================
    // DISABLED: Allowing access to login/signup even if logged in, to prevent loops during debugging.
    // if ((pathname === '/login' || pathname === '/signup') && user) {
    //    const response = NextResponse.redirect(new URL('/', request.url));
    //    // Copy cookies to redirect response to persist session
    //    supabaseResponse.cookies.getAll().forEach(cookie => {
    //        response.cookies.set(cookie.name, cookie.value);
    //    });
    //    return response;
    // }

    // 3. CHECK IF PUBLIC ROUTE
    // =================================================
    const isPublicRoute = PUBLIC_ROUTES.has(pathname) ||
        PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // 4. PROTECTED ROUTES - REQUIRES LOGIN
    // =================================================
    if (!user && !isPublicRoute) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // 5. ONBOARDING CHECK - Redirect new users to complete their profile
    // =================================================
    // Skip onboarding check for:
    // 1. The onboarding page itself
    // 2. API routes
    // 3. Auth pages (login/signup)
    // 4. Server Actions (POST requests) - CRITICAL for performance
    // 5. Users arriving with ?welcome=true flag (Freshly onboarded users, bypassing stale DB checks)
    const isWelcomeParam = request.nextUrl.searchParams.get('welcome') === 'true';

    const skipOnboardingCheck = pathname === '/onboarding' ||
        pathname.startsWith('/api/') ||
        pathname === '/login' ||
        pathname === '/signup' ||
        request.method === 'POST' ||
        isWelcomeParam;

    if (user && !skipOnboardingCheck) {
        // Only verify profile if we really need to
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, role_selected, educational_stage_id')
            .eq('id', user.id)
            .single();

        // If user hasn't completed onboarding, redirect to onboarding
        // Check: role_selected is false
        if (!profile?.role_selected) {
            const response = NextResponse.redirect(new URL('/onboarding', request.url));
            supabaseResponse.cookies.getAll().forEach(cookie => {
                response.cookies.set(cookie.name, cookie.value);
            });
            return response;
        }

        // 6. ROLE-BASED PROTECTION (only for admin/teacher dashboard routes)
        // =================================================
        // NOTE: /teachers (plural) is PUBLIC - only /teacher (singular) is for teacher dashboard
        const isTeacherDashboard = pathname.startsWith('/teacher') && !pathname.startsWith('/teachers');

        // Admin Protection
        if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Teacher Dashboard Protection (not /teachers which is public)
        if (isTeacherDashboard &&
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
