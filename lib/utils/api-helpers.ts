// =============================================
// API Response Helpers - مساعدات استجابات API
// =============================================

import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ═══════════════════════════════════════════════════════════════════════════
// HTTP STATUS CODES
// ═══════════════════════════════════════════════════════════════════════════

export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Success response with data
 */
export function success<T>(data: T, message?: string, status: number = 200) {
    return NextResponse.json<ApiSuccessResponse<T>>(
        { success: true, data, ...(message && { message }) },
        { status }
    );
}

/**
 * Created response (201)
 */
export function created<T>(data: T, message = 'تم الإنشاء بنجاح') {
    return success(data, message, 201);
}

/**
 * No content response (204)
 */
export function noContent() {
    return new NextResponse(null, { status: 204 });
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Error response factory
 */
export function error(
    message: string,
    status: number = 500,
    code?: string,
    details?: unknown
) {
    const body: ApiErrorResponse = {
        success: false,
        error: message,
    };
    if (code) body.code = code;
    if (details) body.details = details;

    return NextResponse.json<ApiErrorResponse>(body, { status });
}

/**
 * Bad request (400)
 */
export function badRequest(message = 'طلب غير صالح', details?: unknown) {
    return error(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST', details);
}

/**
 * Unauthorized (401)
 */
export function unauthorized(message = 'غير مصرح') {
    return error(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
}

/**
 * Forbidden (403)
 */
export function forbidden(message = 'غير مسموح') {
    return error(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
}

/**
 * Not found (404)
 */
export function notFound(message = 'غير موجود') {
    return error(message, HttpStatus.NOT_FOUND, 'NOT_FOUND');
}

/**
 * Conflict (409)
 */
export function conflict(message = 'تعارض في البيانات') {
    return error(message, HttpStatus.CONFLICT, 'CONFLICT');
}

/**
 * Validation error (422)
 */
export function validationError(message = 'خطأ في التحقق', details?: unknown) {
    return error(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
}

/**
 * Rate limit exceeded (429)
 */
export function rateLimitExceeded(message = 'تم تجاوز الحد المسموح') {
    return error(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
}

/**
 * Internal server error (500)
 */
export function serverError(message = 'حدث خطأ في الخادم') {
    return error(message, HttpStatus.INTERNAL_SERVER_ERROR, 'SERVER_ERROR');
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Try-catch wrapper for API handlers
 */
export async function withErrorHandling<T>(
    handler: () => Promise<T>,
    errorMessage = 'حدث خطأ غير متوقع'
): Promise<NextResponse> {
    try {
        const result = await handler();
        return success(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : errorMessage;
        console.error('[API Error]', err);
        return serverError(message);
    }
}

/**
 * Validate required fields
 */
export function validateRequired(data: Record<string, unknown>, fields: string[]): string | null {
    for (const field of fields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            return `الحقل "${field}" مطلوب`;
        }
    }
    return null;
}

/**
 * Parse request body safely
 */
export async function parseBody<T = Record<string, unknown>>(request: Request): Promise<T | null> {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const ApiHelpers = {
    success,
    created,
    noContent,
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    validationError,
    rateLimitExceeded,
    serverError,
    withErrorHandling,
    validateRequired,
    parseBody,
};
