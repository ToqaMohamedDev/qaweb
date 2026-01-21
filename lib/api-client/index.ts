/**
 * Unified API Client
 * Single point of contact for all API requests
 */

import { ApiResponse, ApiError, RequestConfig, HttpMethod } from './types';
import { getBaseUrl } from './endpoints';

// =============================================
// API Client Configuration
// =============================================

interface ApiClientConfig {
    defaultTimeout?: number;
    defaultHeaders?: Record<string, string>;
    onError?: (error: ApiError) => void;
}

// =============================================
// API Client Class
// =============================================

class ApiClient {
    private baseUrl: string;
    private defaultTimeout: number;
    private defaultHeaders: Record<string, string>;
    private onError?: (error: ApiError) => void;

    constructor(config: ApiClientConfig = {}) {
        this.baseUrl = getBaseUrl();
        this.defaultTimeout = config.defaultTimeout || 30000;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...config.defaultHeaders,
        };
        this.onError = config.onError;
    }

    // =============================================
    // Core Request Method
    // =============================================

    private async request<T>(
        method: HttpMethod,
        endpoint: string,
        options: {
            params?: Record<string, any>;
            body?: any;
            config?: RequestConfig;
        } = {}
    ): Promise<ApiResponse<T>> {
        const { params, body, config } = options;

        // Build URL with params
        let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

        if (params) {
            const urlObj = new URL(url, this.baseUrl || 'http://localhost:3000');
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    urlObj.searchParams.set(key, String(value));
                }
            });
            url = typeof window !== 'undefined'
                ? `${endpoint.split('?')[0]}${urlObj.search}`
                : urlObj.toString();
        }

        // Build fetch options
        const fetchOptions: RequestInit = {
            method,
            headers: {
                ...this.defaultHeaders,
                ...config?.headers,
            },
            cache: config?.cache,
        };

        if (body && method !== 'GET') {
            fetchOptions.body = JSON.stringify(body);
        }

        try {
            const controller = new AbortController();
            const timeout = config?.timeout || this.defaultTimeout;

            const timeoutId = setTimeout(() => controller.abort(), timeout);
            fetchOptions.signal = controller.signal;

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                const error = new ApiError(
                    data.error || `HTTP ${response.status}`,
                    response.status
                );
                this.onError?.(error);
                throw error;
            }

            if (data.success === false) {
                const error = ApiError.fromResponse(data);
                this.onError?.(error);
                throw error;
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    const timeoutError = new ApiError('Request timeout', 408, 'TIMEOUT');
                    this.onError?.(timeoutError);
                    throw timeoutError;
                }

                const networkError = ApiError.serverError(error.message);
                this.onError?.(networkError);
                throw networkError;
            }

            throw ApiError.serverError('Unknown error');
        }
    }

    // =============================================
    // HTTP Methods
    // =============================================

    async get<T>(endpoint: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('GET', endpoint, { params, config });
    }

    async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('POST', endpoint, { body, config });
    }

    async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', endpoint, { body, config });
    }

    async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', endpoint, { body, config });
    }

    async delete<T>(endpoint: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', endpoint, { params, config });
    }

    // =============================================
    // Convenience Methods
    // =============================================

    /**
     * Fetch data and return just the data (not the full response)
     */
    async fetchData<T>(endpoint: string, params?: Record<string, any>): Promise<T | null> {
        try {
            const response = await this.get<T>(endpoint, params);
            return response.data ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Fetch array data with fallback to empty array
     */
    async fetchArray<T>(endpoint: string, params?: Record<string, any>): Promise<T[]> {
        try {
            const response = await this.get<T[]>(endpoint, params);
            return response.data ?? [];
        } catch {
            return [];
        }
    }
}

// =============================================
// Singleton Instance
// =============================================

export const apiClient = new ApiClient({
    onError: (error) => {
        console.error('[API Error]', error.message, error.status);
    },
});

// =============================================
// Re-exports
// =============================================

export * from './types';
export * from './endpoints';
export { ApiClient };
