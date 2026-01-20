/**
 * Security Utilities
 * ==================
 * Centralized security functions for the application
 */

// =============================================
// Input Sanitization
// =============================================

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
    if (!input) return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize input for SQL-like patterns (extra layer)
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';
    return input
        .trim()
        .replace(/[<>\"'`;]/g, '')
        .slice(0, 10000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// =============================================
// Rate Limiting (Client-side)
// =============================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if action should be rate limited
 * @param key - Unique identifier for the action
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 */
export function isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (entry.count >= maxAttempts) {
        return true;
    }

    entry.count++;
    return false;
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

// =============================================
// CSRF Protection Helper
// =============================================

/**
 * Generate a random token for CSRF protection
 */
export function generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint32Array(length);

    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(randomValues);
    } else {
        for (let i = 0; i < length; i++) {
            randomValues[i] = Math.floor(Math.random() * chars.length);
        }
    }

    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

// =============================================
// Secure Headers Check
// =============================================

/**
 * Security headers that should be present
 */
export const REQUIRED_SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// =============================================
// Password Validation
// =============================================

interface PasswordValidation {
    isValid: boolean;
    errors: string[];
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('يجب أن تحتوي على حرف كبير');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('يجب أن تحتوي على حرف صغير');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('يجب أن تحتوي على رقم');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// =============================================
// Content Security
// =============================================

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf'],
    audio: ['audio/mpeg', 'audio/wav'],
};

/**
 * Max file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    audio: 20 * 1024 * 1024, // 20MB
};

/**
 * Validate file for upload
 */
export function validateFile(file: File, type: keyof typeof ALLOWED_FILE_TYPES): { valid: boolean; error?: string } {
    const allowedTypes = ALLOWED_FILE_TYPES[type];
    const maxSize = MAX_FILE_SIZES[type === 'images' ? 'image' : type === 'documents' ? 'document' : 'audio'];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'نوع الملف غير مدعوم' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: `حجم الملف يتجاوز الحد المسموح (${maxSize / 1024 / 1024}MB)` };
    }

    return { valid: true };
}
