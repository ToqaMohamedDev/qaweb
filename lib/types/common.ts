// =============================================
// Common Types - أنواع مشتركة
// =============================================

// API Response Types
export interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
    success: boolean;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: string;
}

// Pagination
export interface PaginationParams {
    page: number;
    limit: number;
    offset?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Filter & Sort
export interface FilterOptions {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
    data: T | null;
    status: LoadingState;
    error: string | null;
}

// Form States
export interface FormField<T = string> {
    value: T;
    error: string | null;
    touched: boolean;
}

// =============================================
// Result Pattern - for consistent returns
// =============================================

/**
 * Result type for operations that can fail
 * Use this instead of throwing errors
 */
export type Result<T, E = ApiError> =
    | { success: true; data: T; error: null }
    | { success: false; data: null; error: E };

/**
 * Helper to create success result
 */
export function ok<T, E = ApiError>(data: T): Result<T, E> {
    return { success: true, data, error: null };
}

/**
 * Helper to create error result
 */
export function err<E = ApiError>(error: E): Result<never, E> {
    return { success: false, data: null, error };
}

