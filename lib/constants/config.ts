// =============================================
// App Configuration - إعدادات التطبيق
// =============================================

// Site Info
export const SITE_CONFIG = {
    name: 'QAlaa',
    nameAr: 'كيو علاء',
    description: 'منصة تعليمية متكاملة',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
    auth: '/api/auth',
    teachers: '/api/teachers',
    subjects: '/api/subjects',
    exams: '/api/exams',
    notifications: '/api/notifications',
} as const;

// Pagination Defaults
export const PAGINATION = {
    defaultPageSize: 12,
    maxPageSize: 50,
} as const;

// Cache Keys (for React Query or SWR)
export const CACHE_KEYS = {
    teachers: 'teachers',
    subjects: 'subjects',
    user: 'user',
    subscriptions: 'subscriptions',
    notifications: 'notifications',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    theme: 'theme',
    sidebarOpen: 'sidebar-open',
    language: 'language',
} as const;

// Default Values
export const DEFAULTS = {
    stageName: 'الصف الثالث الثانوي',
    teacherSpecialty: 'عام',
    avatarFallback: '/images/default-avatar.png',
    coverFallback: '/images/default-cover.png',
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

// Theme Colors
export const COLORS = {
    primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
    },
    accent: {
        red: '#ef4444',
        orange: '#f97316',
        yellow: '#eab308',
    },
} as const;

// Validation Rules
export const VALIDATION = {
    name: {
        minLength: 2,
        maxLength: 50,
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
        minLength: 8,
        maxLength: 100,
    },
    bio: {
        maxLength: 500,
    },
} as const;

// Feature Flags
export const FEATURES = {
    enableNotifications: true,
    enableChat: true,
    enableRatings: true,
    enableSubscriptions: true,
} as const;
