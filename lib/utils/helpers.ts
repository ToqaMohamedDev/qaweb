// =============================================
// Helper Utilities - دوال مساعدة عامة
// =============================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج الـ CSS classes مع دعم Tailwind
 * @example cn('px-4 py-2', isActive && 'bg-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * تأخير التنفيذ
 * @example await delay(1000);
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * إنشاء معرف فريد
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * التحقق من صحة رابط URL
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
 * استخراج الحرف الأول للـ Avatar
 * @example getInitials('أحمد محمد') => 'أ'
 */
export function getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
}

/**
 * خلط مصفوفة عشوائياً (Fisher-Yates shuffle)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * تجميع المصفوفة حسب خاصية معينة
 * @example groupBy(users, 'role') => { admin: [...], student: [...] }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] ?? [];
        groups[group].push(item);
        return groups;
    }, {} as Record<string, T[]>);
}

/**
 * إزالة العناصر المكررة
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
        const k = item[key];
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

/**
 * Debounce - تأخير تنفيذ الدالة
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttle - تحديد عدد مرات تنفيذ الدالة
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * التحقق من أن الكود يعمل على المتصفح
 */
export function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

/**
 * التحقق من iOS
 */
export function isIOS(): boolean {
    if (!isBrowser()) return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * نسخ نص إلى الحافظة
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
