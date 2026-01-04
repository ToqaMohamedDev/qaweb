// =============================================
// Date & Time Utilities - أدوات التاريخ والوقت
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format date to Arabic relative time
 */
export function formatRelativeTime(date: Date | string | number): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} ${diffMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
    if (diffHours < 24) return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
    if (diffDays < 7) return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
    if (diffWeeks < 4) return `منذ ${diffWeeks} ${diffWeeks === 1 ? 'أسبوع' : 'أسابيع'}`;
    if (diffMonths < 12) return `منذ ${diffMonths} ${diffMonths === 1 ? 'شهر' : 'أشهر'}`;
    return `منذ ${diffYears} ${diffYears === 1 ? 'سنة' : 'سنوات'}`;
}

/**
 * Format date to Arabic readable format
 */
export function formatDateArabic(date: Date | string | number): string {
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format date with time
 */
export function formatDateTimeArabic(date: Date | string | number): string {
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format time only
 */
export function formatTimeArabic(date: Date | string | number): string {
    const d = new Date(date);
    return d.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format duration in minutes to readable format
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} دقيقة`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) return `${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    return `${hours} ${hours === 1 ? 'ساعة' : 'ساعات'} و ${mins} دقيقة`;
}

/**
 * Format seconds to MM:SS
 */
export function formatTimeMMSS(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatTimeHHMMSS(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSERS & VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
    const today = new Date();
    const target = new Date(date);
    return (
        target.getDate() === today.getDate() &&
        target.getMonth() === today.getMonth() &&
        target.getFullYear() === today.getFullYear()
    );
}

/**
 * Check if date is in past
 */
export function isPast(date: Date | string | number): boolean {
    return new Date(date).getTime() < Date.now();
}

/**
 * Check if date is in future
 */
export function isFuture(date: Date | string | number): boolean {
    return new Date(date).getTime() > Date.now();
}

/**
 * Check if date is within range
 */
export function isWithinRange(date: Date | string | number, start: Date | string | number, end: Date | string | number): boolean {
    const d = new Date(date).getTime();
    return d >= new Date(start).getTime() && d <= new Date(end).getTime();
}

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add days to date
 */
export function addDays(date: Date | string | number, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Add hours to date
 */
export function addHours(date: Date | string | number, hours: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + hours * 60 * 60 * 1000);
    return result;
}

/**
 * Add minutes to date
 */
export function addMinutes(date: Date | string | number, minutes: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + minutes * 60 * 1000);
    return result;
}

/**
 * Get difference in days between two dates
 */
export function diffInDays(date1: Date | string | number, date2: Date | string | number): number {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string | number): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string | number): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// COUNTDOWN TIMER
// ═══════════════════════════════════════════════════════════════════════════

export interface CountdownResult {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

/**
 * Calculate countdown to a future date
 */
export function getCountdown(targetDate: Date | string | number): CountdownResult {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isExpired: false,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const DateUtils = {
    formatRelativeTime,
    formatDateArabic,
    formatDateTimeArabic,
    formatTimeArabic,
    formatDuration,
    formatTimeMMSS,
    formatTimeHHMMSS,
    isToday,
    isPast,
    isFuture,
    isWithinRange,
    addDays,
    addHours,
    addMinutes,
    diffInDays,
    startOfDay,
    endOfDay,
    getCountdown,
};
