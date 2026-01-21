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
    // Public Data
    PUBLIC_DATA: '/api/public/data',

    // Authentication
    AUTH_USER: '/api/auth/user',
    AUTH_CALLBACK: '/api/auth/callback',

    // Subscriptions
    SUBSCRIPTIONS: '/api/subscriptions',

    // Exams
    EXAM: '/api/exam',

    // Notifications
    NOTIFICATIONS: '/api/notifications',
    EXAM_PUBLISHED: '/api/notifications/exam-published',

    // Admin
    ADMIN_STATS: '/api/admin/stats',

    // Support
    SUPPORT_CHAT: '/api/support/chat',

    // Upload
    UPLOAD_TEACHER_IMAGE: '/api/upload/teacher-image',

    // Game
    GAME_CREATE: '/api/game/create',
    GAME_JOIN: '/api/game/join',
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
