'use client';

// =============================================
// Query Provider - React Query Configuration
// =============================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

const queryClientOptions = {
    defaultOptions: {
        queries: {
            // الوقت قبل اعتبار البيانات قديمة (5 دقائق)
            staleTime: 5 * 60 * 1000,

            // الوقت قبل حذف البيانات من الكاش (30 دقيقة)
            gcTime: 30 * 60 * 1000,

            // عدم إعادة المحاولة عند الفشل في development
            retry: process.env.NODE_ENV === 'production' ? 3 : false,

            // إعادة الجلب عند focus النافذة
            refetchOnWindowFocus: false,

            // إعادة الجلب عند الاتصال بالإنترنت
            refetchOnReconnect: true,
        },
        mutations: {
            // عدم إعادة المحاولة للـ mutations
            retry: false,
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    // إنشاء QueryClient مرة واحدة فقط
    const [queryClient] = useState(() => new QueryClient(queryClientOptions));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

// مفاتيح الاستعلام للـ Caching
export const queryKeys = {
    // Auth
    auth: {
        all: ['auth'] as const,
        user: () => [...queryKeys.auth.all, 'user'] as const,
        profile: (id: string) => [...queryKeys.auth.all, 'profile', id] as const,
    },

    // Exams
    exams: {
        all: ['exams'] as const,
        lists: () => [...queryKeys.exams.all, 'list'] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.exams.lists(), filters] as const,
        details: () => [...queryKeys.exams.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.exams.details(), id] as const,
    },

    // Questions
    questions: {
        all: ['questions'] as const,
        lists: () => [...queryKeys.questions.all, 'list'] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.questions.lists(), filters] as const,
        byLesson: (lessonId: string) => [...queryKeys.questions.all, 'lesson', lessonId] as const,
    },

    // Lessons
    lessons: {
        all: ['lessons'] as const,
        lists: () => [...queryKeys.lessons.all, 'list'] as const,
        list: (filters: Record<string, unknown>) => [...queryKeys.lessons.lists(), filters] as const,
        detail: (id: string) => [...queryKeys.lessons.all, 'detail', id] as const,
    },

    // Teachers
    teachers: {
        all: ['teachers'] as const,
        lists: () => [...queryKeys.teachers.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.teachers.all, 'detail', id] as const,
        subscriptions: (userId: string) => [...queryKeys.teachers.all, 'subscriptions', userId] as const,
    },

    // Subjects
    subjects: {
        all: ['subjects'] as const,
        list: () => [...queryKeys.subjects.all, 'list'] as const,
        byStage: (stageId: string) => [...queryKeys.subjects.all, 'stage', stageId] as const,
    },

    // Stages
    stages: {
        all: ['stages'] as const,
        list: () => [...queryKeys.stages.all, 'list'] as const,
    },

    // Notifications
    notifications: {
        all: ['notifications'] as const,
        list: (userId: string) => [...queryKeys.notifications.all, 'user', userId] as const,
        unread: (userId: string) => [...queryKeys.notifications.all, 'unread', userId] as const,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
