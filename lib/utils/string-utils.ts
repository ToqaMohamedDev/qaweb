// =============================================
// String Utilities - أدوات النصوص
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// TEXT TRUNCATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Truncate text by words
 */
export function truncateWords(text: string, maxWords: number, suffix = '...'): string {
    if (!text) return text;
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + suffix;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT TRANSFORMATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert to title case
 */
export function toTitleCase(text: string): string {
    if (!text) return text;
    return text.replace(/\w\S*/g, word => capitalize(word.toLowerCase()));
}

/**
 * Convert to kebab-case
 */
export function toKebabCase(text: string): string {
    if (!text) return text;
    return text
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

/**
 * Convert to camelCase
 */
export function toCamelCase(text: string): string {
    if (!text) return text;
    return text
        .toLowerCase()
        .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase());
}

/**
 * Convert to snake_case
 */
export function toSnakeCase(text: string): string {
    if (!text) return text;
    return text
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// ARABIC TEXT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Remove Arabic diacritics (تشكيل)
 */
export function removeArabicDiacritics(text: string): string {
    if (!text) return text;
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Normalize Arabic text (أ, إ, آ -> ا)
 */
export function normalizeArabic(text: string): string {
    if (!text) return text;
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[ى]/g, 'ي');
}

/**
 * Check if text is Arabic
 */
export function isArabic(text: string): boolean {
    if (!text) return false;
    return /[\u0600-\u06FF]/.test(text);
}

/**
 * Get text direction
 */
export function getTextDirection(text: string): 'rtl' | 'ltr' {
    return isArabic(text) ? 'rtl' : 'ltr';
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format number with Arabic numerals
 */
export function toArabicNumerals(num: number | string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, digit => arabicNumerals[parseInt(digit)]);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number, locale = 'ar-EG'): string {
    return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت';

    const units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH & MATCHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Highlight search term in text
 */
export function highlightText(text: string, searchTerm: string, className = 'bg-yellow-200 dark:bg-yellow-900'): string {
    if (!text || !searchTerm) return text;

    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, `<mark class="${className}">$1</mark>`);
}

/**
 * Escape special regex characters
 */
export function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fuzzy search match
 */
export function fuzzyMatch(text: string, query: string): boolean {
    if (!text || !query) return false;

    const normalizedText = normalizeArabic(removeArabicDiacritics(text.toLowerCase()));
    const normalizedQuery = normalizeArabic(removeArabicDiacritics(query.toLowerCase()));

    let queryIndex = 0;
    for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
        if (normalizedText[i] === normalizedQuery[queryIndex]) {
            queryIndex++;
        }
    }

    return queryIndex === normalizedQuery.length;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if string is empty or whitespace
 */
export function isBlank(text: string | null | undefined): boolean {
    return !text || text.trim().length === 0;
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if string is valid phone number (Egyptian format)
 */
export function isValidEgyptianPhone(phone: string): boolean {
    return /^(\+20|0)?1[0125]\d{8}$/.test(phone.replace(/\s/g, ''));
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate random string
 */
export function randomString(length: number, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate slug from text
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Get initials from name
 */
export function getInitials(name: string, maxChars = 2): string {
    if (!name) return '';

    const words = name.trim().split(/\s+/);
    return words
        .slice(0, maxChars)
        .map(word => word[0])
        .join('')
        .toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const StringUtils = {
    truncate,
    truncateWords,
    capitalize,
    toTitleCase,
    toKebabCase,
    toCamelCase,
    toSnakeCase,
    removeArabicDiacritics,
    normalizeArabic,
    isArabic,
    getTextDirection,
    toArabicNumerals,
    formatNumber,
    formatPercentage,
    formatFileSize,
    highlightText,
    escapeRegExp,
    fuzzyMatch,
    isBlank,
    isValidEmail,
    isValidUrl,
    isValidEgyptianPhone,
    randomString,
    slugify,
    getInitials,
};
