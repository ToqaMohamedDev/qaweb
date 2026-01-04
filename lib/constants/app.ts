// =============================================
// App Constants - ثوابت إضافية للتطبيق
// =============================================

// Note: SITE_CONFIG, PAGINATION, BREAKPOINTS are in config.ts
// This file contains additional constants not in config.ts

// ============================================
// API Configuration
// ============================================

export const API_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
} as const;

// ============================================
// Cache Configuration
// ============================================

export const CACHE_CONFIG = {
    // Time in seconds
    short: 60, // 1 minute
    medium: 300, // 5 minutes
    long: 3600, // 1 hour
    day: 86400, // 24 hours
} as const;

// ============================================
// User Roles
// ============================================

export const USER_ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
} as const;

export const ROLE_LABELS = {
    admin: 'مدير',
    teacher: 'معلم',
    student: 'طالب',
} as const;

export const ROLE_COLORS = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
} as const;

// ============================================
// Game Configuration
// ============================================

export const GAME_CONFIG = {
    defaultTimeLimit: 30, // seconds per question
    minTimeLimit: 10,
    maxTimeLimit: 120,
    defaultQuestionsCount: 10,
    minQuestionsCount: 5,
    maxQuestionsCount: 50,
    roomCodeLength: 6,
    maxPlayersPerRoom: 10,
    reconnectionTimeout: 30000, // 30 seconds
} as const;

// ============================================
// File Upload
// ============================================

export const UPLOAD_CONFIG = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxImageSize: 2 * 1024 * 1024, // 2MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword'],
} as const;

// ============================================
// Exam Configuration
// ============================================

export const EXAM_CONFIG = {
    defaultDuration: 60, // minutes
    minDuration: 10,
    maxDuration: 180,
    passingScore: 60, // percentage
    maxQuestions: 100,
    questionTypes: ['single_choice', 'multiple_choice', 'true_false', 'text'] as const,
} as const;

// ============================================
// Navigation Links
// ============================================

export const NAV_LINKS = [
    { href: '/', label: 'الرئيسية', labelEn: 'Home' },
    { href: '/arabic', label: 'عربي', labelEn: 'Arabic' },
    { href: '/english', label: 'English', labelEn: 'English' },
    { href: '/teachers', label: 'المعلمين', labelEn: 'Teachers' },
    { href: '/game', label: 'Quiz Battle', labelEn: 'Quiz Battle' },
] as const;

// ============================================
// Social Links
// ============================================

export const SOCIAL_LINKS = {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com',
} as const;


// ============================================
// Z-Index Layers
// ============================================

export const Z_INDEX = {
    dropdown: 50,
    sticky: 100,
    fixed: 200,
    modal: 300,
    popover: 400,
    tooltip: 500,
    toast: 600,
} as const;

// ============================================
// Animation Durations
// ============================================

export const ANIMATION_DURATION = {
    fast: 150,
    normal: 300,
    slow: 500,
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
    generic: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    network: 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
    unauthorized: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول.',
    forbidden: 'ليس لديك صلاحية للوصول إلى هذا المحتوى.',
    notFound: 'المحتوى المطلوب غير موجود.',
    validation: 'يرجى التحقق من البيانات المدخلة.',
    serverError: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
    saved: 'تم الحفظ بنجاح',
    updated: 'تم التحديث بنجاح',
    deleted: 'تم الحذف بنجاح',
    created: 'تم الإنشاء بنجاح',
    loggedIn: 'تم تسجيل الدخول بنجاح',
    loggedOut: 'تم تسجيل الخروج بنجاح',
    copied: 'تم النسخ إلى الحافظة',
} as const;

export default {
    API_CONFIG,
    CACHE_CONFIG,
    USER_ROLES,
    ROLE_LABELS,
    ROLE_COLORS,
    GAME_CONFIG,
    UPLOAD_CONFIG,
    EXAM_CONFIG,
    NAV_LINKS,
    SOCIAL_LINKS,
    Z_INDEX,
    ANIMATION_DURATION,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
};
