/**
 * API Response Types
 * Central types for all API responses
 */

// =============================================
// Base Response Types
// =============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
}

// =============================================
// Error Types
// =============================================

export class ApiError extends Error {
    public status: number;
    public code?: string;

    constructor(message: string, status: number = 500, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }

    static fromResponse(response: ApiResponse): ApiError {
        return new ApiError(
            response.error || 'Unknown error',
            500,
            undefined
        );
    }

    static unauthorized(message = 'يجب تسجيل الدخول'): ApiError {
        return new ApiError(message, 401, 'UNAUTHORIZED');
    }

    static notFound(message = 'غير موجود'): ApiError {
        return new ApiError(message, 404, 'NOT_FOUND');
    }

    static badRequest(message = 'طلب غير صالح'): ApiError {
        return new ApiError(message, 400, 'BAD_REQUEST');
    }

    static serverError(message = 'خطأ في الخادم'): ApiError {
        return new ApiError(message, 500, 'SERVER_ERROR');
    }
}

// =============================================
// Request Types
// =============================================

export interface RequestConfig {
    headers?: Record<string, string>;
    timeout?: number;
    cache?: RequestCache;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// =============================================
// Entity Types for Public Data API
// =============================================

export type PublicDataEntity =
    | 'teachers'
    | 'teacher_profile'
    | 'teacher_exams'
    | 'stages'
    | 'subjects'
    | 'lessons'
    | 'lesson'
    | 'question_banks'
    | 'exams';

export interface PublicDataParams {
    entity: PublicDataEntity;
    id?: string;
    teacherId?: string;
    stageId?: string;
    subjectId?: string;
    lessonId?: string;
    limit?: number;
}

// =============================================
// Subscription Types
// =============================================

export interface SubscriptionResponse {
    success: boolean;
    action?: 'subscribed' | 'unsubscribed' | 'already_subscribed';
    newCount?: number;
    error?: string;
}

// =============================================
// Exam Types
// =============================================

export interface ExamFetchResponse {
    success: boolean;
    data?: {
        exam: any;
        examTable: string;
        attemptsTable: string;
        user: { id: string; email: string } | null;
        existingAttempt: any | null;
        inProgressAttempt: any | null;
    };
    error?: string;
}

export interface ExamActionResponse {
    success: boolean;
    attemptId?: string;
    error?: string;
}

export type ExamAction = 'create' | 'save' | 'submit';
