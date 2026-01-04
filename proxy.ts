// =============================================
// Middleware - حماية الـ Routes على مستوى السيرفر
// =============================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
];

// الصفحات المحمية حسب الدور
const PROTECTED_ROUTES = {
    admin: '/admin',
    teacher: '/teacher',
};

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // تخطي الـ static files و API routes العامة
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.') ||
        pathname.startsWith('/api/public')
    ) {
        return NextResponse.next();
    }

    // إنشاء response object
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // إنشاء Supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    // جلب الـ session
    const { data: { session } } = await supabase.auth.getSession();

    // التحقق إذا كان المسار عام
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
        PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // ═══════════════════════════════════════════════════════════════════
    // 1. الصفحات العامة - السماح للجميع
    // ═══════════════════════════════════════════════════════════════════
    if (isPublicRoute) {
        return response;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. صفحات تسجيل الدخول - إعادة توجيه المسجلين
    // ═══════════════════════════════════════════════════════════════════
    if ((pathname === '/login' || pathname === '/signup') && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. الصفحات المحمية - التحقق من الـ session
    // ═══════════════════════════════════════════════════════════════════
    if (!session) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // جلب بيانات المستخدم من الـ profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, role_selected, is_teacher_approved')
        .eq('id', session.user.id)
        .single();

    // ═══════════════════════════════════════════════════════════════════
    // 4. التحقق من اختيار الدور
    // ═══════════════════════════════════════════════════════════════════
    if (profile && !profile.role_selected && pathname !== '/onboarding') {
        return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. حماية صفحات الأدمن
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.startsWith(PROTECTED_ROUTES.admin)) {
        if (profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. حماية صفحات المدرس
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.startsWith(PROTECTED_ROUTES.teacher)) {
        if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. حماية صفحات اللعبة
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.startsWith('/game')) {
        // اللعبة تحتاج مستخدم مسجل فقط، بدون تحقق إضافي
        // لأننا وصلنا هنا فالمستخدم مسجل
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. حماية الملف الشخصي
    // ═══════════════════════════════════════════════════════════════════
    if (pathname.startsWith('/profile')) {
        // الملف الشخصي يحتاج مستخدم مسجل فقط
        // لأننا وصلنا هنا فالمستخدم مسجل
    }

    return response;
}

// تطبيق الـ middleware على هذه المسارات
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
