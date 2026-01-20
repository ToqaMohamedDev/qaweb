/**
 * API Response Utilities
 * ======================
 * Standardized API response formats for consistency and security
 */

import { NextResponse } from 'next/server';

// =============================================
// Types
// =============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// =============================================
// Success Responses
// =============================================

/**
 * Return a successful response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
    const response: ApiResponse<T> = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
        status,
        headers: getSecurityHeaders(),
    });
}

/**
 * Return a paginated successful response
 */
export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): NextResponse {
    const response: PaginatedResponse<T> = {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
        status: 200,
        headers: getSecurityHeaders(),
    });
}

// =============================================
// Error Responses
// =============================================

export const ErrorCodes = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
} as const;

/**
 * Return an error response
 */
export function errorResponse(
    message: string,
    status: number = 500,
    code?: keyof typeof ErrorCodes
): NextResponse {
    const response: ApiResponse = {
        success: false,
        error: message,
        code,
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
        status,
        headers: getSecurityHeaders(),
    });
}

/**
 * Unauthorized (401)
 */
export function unauthorizedResponse(message: string = 'غير مصرح'): NextResponse {
    return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden (403)
 */
export function forbiddenResponse(message: string = 'ممنوع الوصول'): NextResponse {
    return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Not Found (404)
 */
export function notFoundResponse(message: string = 'غير موجود'): NextResponse {
    return errorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Bad Request (400)
 */
export function badRequestResponse(message: string = 'طلب غير صالح'): NextResponse {
    return errorResponse(message, 400, 'BAD_REQUEST');
}

/**
 * Rate Limited (429)
 */
export function rateLimitedResponse(message: string = 'تم تجاوز الحد المسموح'): NextResponse {
    return errorResponse(message, 429, 'RATE_LIMITED');
}

/**
 * Validation Error (422)
 */
export function validationErrorResponse(message: string): NextResponse {
    return errorResponse(message, 422, 'VALIDATION_ERROR');
}

// =============================================
// Security Headers
// =============================================

/**
 * Get security headers for API responses
 */
function getSecurityHeaders(): HeadersInit {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'",
        'Cache-Control': 'no-store, max-age=0',
    };
}

// =============================================
// Request Validation
// =============================================

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
    body: Record<string, unknown>,
    requiredFields: string[]
): { valid: boolean; missing: string[] } {
    const missing = requiredFields.filter(field => {
        const value = body[field];
        return value === undefined || value === null || value === '';
    });

    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * Safe JSON parse
 */
export async function safeParseBody<T>(request: Request): Promise<{ data: T | null; error: string | null }> {
    try {
        const data = await request.json();
        return { data, error: null };
    } catch {
        return { data: null, error: 'Invalid JSON body' };
    }
}
