/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    SERVER HELPERS FOR API ROUTES                         ║
 * ║                                                                          ║
 * ║  Common patterns and helpers for API routes                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from './server';

// =============================================
// Types
// =============================================

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// =============================================
// Response Helpers
// =============================================

/**
 * Create a success response
 */
export function success<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function error(message: string, status = 500, code?: string): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        { success: false, error: message, ...(code && { code }) },
        { status }
    );
}

/**
 * 400 Bad Request
 */
export function badRequest(message = 'طلب غير صالح'): NextResponse<ApiErrorResponse> {
    return error(message, 400, 'BAD_REQUEST');
}

/**
 * 401 Unauthorized
 */
export function unauthorized(message = 'غير مصرح'): NextResponse<ApiErrorResponse> {
    return error(message, 401, 'UNAUTHORIZED');
}

/**
 * 403 Forbidden
 */
export function forbidden(message = 'غير مسموح'): NextResponse<ApiErrorResponse> {
    return error(message, 403, 'FORBIDDEN');
}

/**
 * 404 Not Found
 */
export function notFound(message = 'غير موجود'): NextResponse<ApiErrorResponse> {
    return error(message, 404, 'NOT_FOUND');
}

/**
 * 500 Server Error
 */
export function serverError(message = 'حدث خطأ في الخادم'): NextResponse<ApiErrorResponse> {
    return error(message, 500, 'SERVER_ERROR');
}

// =============================================
// Auth Helpers
// =============================================

/**
 * Get current user from request (uses server client with cookies)
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
    try {
        const supabase = await createServerClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            return null;
        }
        
        return user;
    } catch {
        return null;
    }
}

/**
 * Get current user with profile
 */
export async function getCurrentUserWithProfile() {
    try {
        const supabase = await createServerClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            return { user: null, profile: null };
        }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        return { user, profile };
    } catch {
        return { user: null, profile: null };
    }
}

/**
 * Require authentication - returns user or throws unauthorized response
 */
export async function requireAuth(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }> {
    const user = await getCurrentUser();
    
    if (!user) {
        throw unauthorized('يجب تسجيل الدخول');
    }
    
    return { user };
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, profile: any }> {
    const { user, profile } = await getCurrentUserWithProfile();
    
    if (!user) {
        throw unauthorized('يجب تسجيل الدخول');
    }
    
    if (profile?.role !== 'admin') {
        throw forbidden('غير مسموح - صلاحيات الأدمن مطلوبة');
    }
    
    return { user, profile };
}

/**
 * Require teacher role
 */
export async function requireTeacher(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, profile: any }> {
    const { user, profile } = await getCurrentUserWithProfile();
    
    if (!user) {
        throw unauthorized('يجب تسجيل الدخول');
    }
    
    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
        throw forbidden('غير مسموح - صلاحيات المعلم مطلوبة');
    }
    
    return { user, profile };
}

// =============================================
// Wrapper for API Handlers
// =============================================

/**
 * Wrap an API handler with error handling
 */
export function withErrorHandling<T>(
    handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
    return handler().catch((err) => {
        // If the error is already a NextResponse, return it
        if (err instanceof NextResponse) {
            return err;
        }
        
        console.error('[API Error]', err);
        return serverError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    });
}

// =============================================
// Security Headers
// =============================================

export const securityHeaders: HeadersInit = {
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store, max-age=0',
};

/**
 * Add security headers to a response
 */
export function withSecurityHeaders<T>(response: NextResponse<T>): NextResponse<T> {
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}
