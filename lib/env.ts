// =============================================
// Environment Variable Validation
// =============================================
// This module provides type-safe access to environment variables.
// Validation is done lazily to avoid issues during build/SSR.

type EnvConfig = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;

    // Site
    NEXT_PUBLIC_SITE_URL: string;

    // Redis (optional)
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;

    // Feature Flags
    NODE_ENV: 'development' | 'production' | 'test';
    IS_PRODUCTION: boolean;
};

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, fallback?: string): string {
    const value = process.env[key];
    return value || fallback || '';
}

/**
 * Get required environment variable (throws if missing in production)
 */
function getRequiredEnvVar(key: string): string {
    const value = process.env[key];

    if (!value) {
        // Only throw in production, warn in development
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        // In development, return empty string and log warning
        if (typeof window === 'undefined') {
            console.warn(`⚠️ Missing environment variable: ${key}`);
        }
        return '';
    }

    return value;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Create a lazy-evaluated environment configuration
 * Values are only validated when accessed
 */
function createEnvConfig(): EnvConfig {
    // Determine site URL with fallbacks
    const getSiteUrl = (): string => {
        const envUrl = getEnvVar('NEXT_PUBLIC_SITE_URL');
        if (envUrl && isValidUrl(envUrl)) return envUrl;
        if (typeof window !== 'undefined') return window.location.origin;
        return 'http://localhost:3000';
    };

    return {
        // Supabase - required
        get NEXT_PUBLIC_SUPABASE_URL() {
            return getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
        },
        get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
            return getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        },
        get SUPABASE_SERVICE_ROLE_KEY() {
            return getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
        },

        // Site
        get NEXT_PUBLIC_SITE_URL() {
            return getSiteUrl();
        },

        // Redis (optional)
        get UPSTASH_REDIS_REST_URL() {
            return getEnvVar('UPSTASH_REDIS_REST_URL');
        },
        get UPSTASH_REDIS_REST_TOKEN() {
            return getEnvVar('UPSTASH_REDIS_REST_TOKEN');
        },

        // Runtime
        get NODE_ENV() {
            return (process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'];
        },
        get IS_PRODUCTION() {
            return process.env.NODE_ENV === 'production';
        },
    };
}

// Export validated config
export const env = createEnvConfig();

// Type-safe accessors for common checks
export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

export default env;

