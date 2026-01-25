/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        DATA LAYER - طبقة البيانات                        ║
 * ║                                                                          ║
 * ║  Unified Data Layer - تصدير موحد لطبقة البيانات                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════════════════
export {
    getClient,
    getBrowserClient,
    getServerClient,
    resetBrowserClient,
    createClient,
    supabase,
} from './client';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE (Main Data Access)
// ═══════════════════════════════════════════════════════════════════════════
export {
    dataService,
    getStages,
    getStageBySlug,
    getSubjects,
    getSubjectsWithLessonsCount,
    getLessons,
    getExams,
    getAppSettings,
    getPlatformStats,
    getAdminStats,
    getDashboardData,
    invalidateCache,
} from './service';

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════
export {
    useStages,
    useSubjects,
    useSubjectsWithLessons,
    useLessons,
    useExams,
    usePlatformStats,
    useAdminStats,
    useDashboard,
    useAdminDashboard,
    useQuery,
} from './hooks';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
export type {
    Stage,
    StageInsert,
    StageUpdate,
    Subject,
    SubjectInsert,
    SubjectUpdate,
    Lesson,
    LessonInsert,
    LessonUpdate,
    Exam,
    ExamInsert,
    ExamUpdate,
    Profile,
    ProfileInsert,
    ProfileUpdate,
    Question,
    QuestionBank,
    AppSettings,
    SubjectWithLessons,
    PlatformStats,
    AdminStats,
    DashboardData,
    LessonFilters,
    ExamFilters,
    QueryOptions,
    QueryState,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════
// Mappers (if exists)
// export * from './mappers';

// Repositories (if exists)  
// export * from './repositories';
