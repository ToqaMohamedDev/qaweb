/**
 * API Endpoints Constants
 * Single source of truth for all API endpoints
 */

// =============================================
// Base URL Helper
// =============================================

export function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return ''; // Client-side: use relative URLs
    }
    // Server-side: need absolute URL
    return process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

// =============================================
// API Endpoints
// =============================================

export const API_ENDPOINTS = {
    // =============================================
    // Core Authentication
    // =============================================
    AUTH_SESSION: '/api/auth/session',
    AUTH_USER: '/api/auth/user',
    AUTH_CALLBACK: '/api/auth/callback',
    AUTH_LOGOUT: '/api/auth/logout',

    // =============================================
    // Reference Data (Public)
    // =============================================
    STAGES: '/api/stages',
    SUBJECTS: '/api/subjects',
    PUBLIC_DATA: '/api/public/data',

    // =============================================
    // Teacher APIs
    // =============================================
    TEACHER_DASHBOARD: '/api/teacher/dashboard',
    TEACHER_EXAMS: '/api/exams',
    TEACHER_PROFILE: '/api/profile',

    // =============================================
    // User APIs
    // =============================================
    PROFILE: '/api/profile',
    SUBSCRIPTIONS: '/api/subscriptions',
    MY_WORDS: '/api/my-words',

    // =============================================
    // Exams
    // =============================================
    EXAM: '/api/exam',
    EXAMS: '/api/exams',

    // =============================================
    // Other
    // =============================================
    NOTIFICATIONS: '/api/notifications',
    EXAM_PUBLISHED: '/api/notifications/exam-published',
    ADMIN_STATS: '/api/admin/stats',
    SUPPORT_CHAT: '/api/support/chat',
    UPLOAD_TEACHER_IMAGE: '/api/upload/teacher-image',
    GAME_CREATE: '/api/game/create',
    GAME_JOIN: '/api/game/join',
    RATINGS: '/api/ratings',
    TESTIMONIALS: '/api/testimonials',
} as const;

// =============================================
// Entity Endpoints Builder
// =============================================

export function buildPublicDataUrl(params: {
    entity: string;
    id?: string;
    teacherId?: string;
    stageId?: string;
    subjectId?: string;
    lessonId?: string;
    limit?: number;
}): string {
    const url = new URL(API_ENDPOINTS.PUBLIC_DATA, getBaseUrl() || 'http://localhost:3000');

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    });

    // For client-side, return just the path + query
    if (typeof window !== 'undefined') {
        return `${API_ENDPOINTS.PUBLIC_DATA}${url.search}`;
    }

    return url.toString();
}

// =============================================
// Type-safe Endpoint Helpers
// =============================================

export const endpoints = {
    // Teachers
    teachers: (limit?: number) =>
        buildPublicDataUrl({ entity: 'teachers', limit }),

    teacherProfile: (id: string) =>
        buildPublicDataUrl({ entity: 'teacher_profile', id }),

    teacherExams: (teacherId: string, limit?: number) =>
        buildPublicDataUrl({ entity: 'teacher_exams', teacherId, limit }),

    // Subjects
    subjects: (stageId?: string, limit?: number) =>
        buildPublicDataUrl({ entity: 'subjects', stageId, limit }),

    // Stages
    stages: (limit?: number) =>
        buildPublicDataUrl({ entity: 'stages', limit }),

    // Lessons
    lessons: (stageId: string, subjectId: string, limit?: number) =>
        buildPublicDataUrl({ entity: 'lessons', stageId, subjectId, limit }),

    lesson: (id: string) =>
        buildPublicDataUrl({ entity: 'lesson', id }),

    // Question Banks
    questionBanks: (lessonId: string) =>
        buildPublicDataUrl({ entity: 'question_banks', lessonId }),

    // Exams
    exams: (stageId?: string, limit?: number) =>
        buildPublicDataUrl({ entity: 'exams', stageId, limit }),

    // Subscriptions
    subscriptions: () => API_ENDPOINTS.SUBSCRIPTIONS,

    unsubscribe: (teacherId: string) =>
        `${API_ENDPOINTS.SUBSCRIPTIONS}?teacherId=${teacherId}`,

    // Exam
    exam: (examId: string) =>
        `${API_ENDPOINTS.EXAM}?examId=${examId}`,
} as const;
