// =============================================
// Error Handling Utilities - معالجة الأخطاء الموحدة
// =============================================

import { logger } from '@/lib/utils/logger';
import type { ApiError } from '@/lib/types/common';

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly context?: string;

    constructor(
        message: string,
        code: string = 'INTERNAL_ERROR',
        statusCode: number = 500,
        isOperational: boolean = true,
        context?: string
    ) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;

        // Maintains proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    toApiError(): ApiError {
        return {
            message: this.message,
            code: this.code,
            details: this.context,
        };
    }
}

// Specific error classes
export class NotFoundError extends AppError {
    constructor(resource: string, id?: string) {
        super(
            id ? `${resource} with ID ${id} not found` : `${resource} not found`,
            'NOT_FOUND',
            404,
            true,
            resource
        );
    }
}

export class ValidationError extends AppError {
    constructor(message: string, field?: string) {
        super(message, 'VALIDATION_ERROR', 400, true, field);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 'UNAUTHORIZED', 401, true);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 'FORBIDDEN', 403, true);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, originalError?: unknown) {
        super(
            message,
            'DATABASE_ERROR',
            500,
            true,
            originalError instanceof Error ? originalError.message : undefined
        );
    }
}

// ============================================
// Error Handlers
// ============================================

/**
 * Extract a user-friendly message from any error
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof AppError) {
        return error.message;
    }

    if (error instanceof Error) {
        // Don't expose internal error messages in production
        if (process.env.NODE_ENV === 'production') {
            return 'حدث خطأ غير متوقع';
        }
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'حدث خطأ غير متوقع';
}

/**
 * Convert any error to ApiError format
 */
export function toApiError(error: unknown): ApiError {
    if (error instanceof AppError) {
        return error.toApiError();
    }

    if (error instanceof Error) {
        return {
            message: getErrorMessage(error),
            code: 'UNKNOWN_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };
    }

    return {
        message: getErrorMessage(error),
        code: 'UNKNOWN_ERROR',
    };
}

/**
 * Log error with appropriate level based on type
 */
export function logError(error: unknown, context?: string): void {
    const errorMessage = getErrorMessage(error);

    if (error instanceof AppError && error.isOperational) {
        // Operational errors are expected (e.g., validation, not found)
        logger.warn(errorMessage, { context, data: { code: error.code } });
    } else {
        // Programming errors or unexpected issues
        logger.error(errorMessage, {
            context,
            data: error instanceof Error ? { stack: error.stack } : undefined
        });
    }
}

/**
 * Wrap async functions with consistent error handling
 */
export async function tryCatch<T>(
    operation: () => Promise<T>,
    context?: string
): Promise<{ data: T | null; error: ApiError | null }> {
    try {
        const data = await operation();
        return { data, error: null };
    } catch (error) {
        logError(error, context);
        return { data: null, error: toApiError(error) };
    }
}

export default {
    AppError,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    getErrorMessage,
    toApiError,
    logError,
    tryCatch,
};
