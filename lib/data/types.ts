/**
 * Unified Data Types
 * 
 * Central type definitions for the data layer
 */

import type { Database } from '../database.types';

// =============================================
// Database Table Types
// =============================================

type Tables = Database['public']['Tables'];

export type Stage = Tables['educational_stages']['Row'];
export type StageInsert = Tables['educational_stages']['Insert'];
export type StageUpdate = Tables['educational_stages']['Update'];

export type Subject = Tables['subjects']['Row'];
export type SubjectInsert = Tables['subjects']['Insert'];
export type SubjectUpdate = Tables['subjects']['Update'];

export type Lesson = Tables['lessons']['Row'];
export type LessonInsert = Tables['lessons']['Insert'];
export type LessonUpdate = Tables['lessons']['Update'];

export type Exam = Tables['comprehensive_exams']['Row'];
export type ExamInsert = Tables['comprehensive_exams']['Insert'];
export type ExamUpdate = Tables['comprehensive_exams']['Update'];

export type TeacherExam = Tables['teacher_exams']['Row'];
export type TeacherExamInsert = Tables['teacher_exams']['Insert'];
export type TeacherExamUpdate = Tables['teacher_exams']['Update'];

export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

export type Question = Tables['lesson_questions']['Row'];
export type QuestionInsert = Tables['lesson_questions']['Insert'];
export type QuestionUpdate = Tables['lesson_questions']['Update'];

export type QuestionBank = Tables['question_banks']['Row'];
export type AppSettings = Tables['app_settings']['Row'];

// Subject-Stage relation (if exists in schema)
export interface SubjectStage {
    id: string;
    subject_id: string;
    stage_id: string;
    order_index: number | null;
    is_active: boolean;
}

// =============================================
// Query Options
// =============================================

export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    select?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// =============================================
// Filter Types
// =============================================

export interface StageFilters {
    isActive?: boolean;
    slug?: string;
}

export interface SubjectFilters {
    stageId?: string;
    isActive?: boolean;
    slug?: string;
}

export interface LessonFilters {
    stageId?: string;
    subjectId?: string;
    semester?: 'first' | 'second' | 'full_year';
    isPublished?: boolean;
    isFree?: boolean;
}

export interface ExamFilters {
    stageId?: string;
    subjectId?: string;
    semester?: 'first' | 'second' | 'full_year';
    isPublished?: boolean;
    type?: string;
    createdBy?: string;
}

export interface ProfileFilters {
    role?: 'admin' | 'teacher' | 'student';
    isTeacherApproved?: boolean;
    educationalStageId?: string;
}

// =============================================
// Composite Types
// =============================================

export interface SubjectWithLessons extends Subject {
    lessonsCount: number;
}

export interface StageWithSubjects extends Stage {
    subjects: SubjectWithLessons[];
}

export interface LessonWithRelations extends Lesson {
    subject?: Subject | null;
    stage?: Stage | null;
}

export interface ExamWithRelations extends Exam {
    subject?: Subject | null;
    stage?: Stage | null;
    creator?: Profile | null;
}

// =============================================
// Stats Types
// =============================================

export interface PlatformStats {
    totalUsers: number;
    totalLessons: number;
    averageRating: number;
    successRate: number;
}

export interface AdminStats extends PlatformStats {
    totalTeachers: number;
    totalStudents: number;
    totalExams: number;
    publishedExams: number;
    totalStages: number;
    totalSubjects: number;
    totalQuestions: number;
}

export interface TeacherStats {
    totalExams: number;
    publishedExams: number;
    totalStudents: number;
    totalViews: number;
    avgRating: number;
    ratingCount: number;
}

// =============================================
// Dashboard Types
// =============================================

export interface DashboardData {
    subjects: SubjectWithLessons[];
    stageName: string;
    stageId: string | null;
    currentSemester: 'first' | 'second' | 'full_year';
    stats: PlatformStats;
}

export interface AdminDashboardData {
    stats: AdminStats;
    recentUsers: Profile[];
    recentExams: Exam[];
    activities: ActivityItem[];
    chartData: ChartData;
}

export interface ActivityItem {
    id: string;
    type: 'user' | 'exam' | 'lesson' | 'subscription';
    action: string;
    description: string;
    time: string;
    userId?: string;
}

export interface ChartData {
    users: number[];
    exams: number[];
    lessons: number[];
}

// =============================================
// API Request/Response Types
// =============================================

export type DataInclude = 'stages' | 'subjects' | 'lessons' | 'exams' | 'stats' | 'profile' | 'settings';

export interface DataRequest {
    include: DataInclude[];
    filters?: {
        stageId?: string;
        subjectId?: string;
        semester?: 'first' | 'second' | 'full_year';
        userId?: string;
    };
    options?: QueryOptions;
}

export interface DataResponse {
    stages?: Stage[];
    subjects?: SubjectWithLessons[];
    lessons?: Lesson[];
    exams?: Exam[];
    stats?: PlatformStats | AdminStats;
    profile?: Profile;
    settings?: AppSettings;
    _meta: {
        timestamp: number;
        cached: boolean;
        queryTime: number;
    };
}

// =============================================
// Hook Return Types
// =============================================

export interface QueryState<T> {
    data: T | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export interface MutationState<TInput, TOutput> {
    mutate: (input: TInput) => Promise<TOutput>;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    reset: () => void;
}

// =============================================
// Cache Types
// =============================================

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export interface CacheConfig {
    ttl: number; // Time to live in ms
    staleWhileRevalidate?: boolean;
}

export const CACHE_KEYS = {
    STAGES: 'stages',
    SUBJECTS: 'subjects',
    LESSONS: 'lessons',
    EXAMS: 'exams',
    PROFILE: 'profile',
    SETTINGS: 'settings',
    DASHBOARD: 'dashboard',
    ADMIN_STATS: 'admin-stats',
} as const;

export const CACHE_TTL = {
    SHORT: 60 * 1000,        // 1 minute
    MEDIUM: 5 * 60 * 1000,   // 5 minutes
    LONG: 30 * 60 * 1000,    // 30 minutes
    HOUR: 60 * 60 * 1000,    // 1 hour
} as const;
