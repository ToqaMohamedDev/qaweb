// =============================================
// Hooks Exports
// =============================================

export { useAuth } from './useAuth';
export { useTeachers } from './useTeachers';
export { useSubscriptions } from './useSubscriptions';
export { useSubjects } from './useSubjects';
export { useHomeLessons } from './useLessons';
export { useAdminDashboard } from './useAdminDashboard';
export { useProfile } from './useProfile';
export { useGameSocket } from './useGameSocket';
export { useNotificationPreferences } from './useNotificationPreferences';
export type { NotificationPreferences, TeacherSubscription, UseNotificationPreferencesReturn } from './useNotificationPreferences';

// Protected Route Hooks
export {
    useProtectedRoute,
    useAdminRoute,
    useTeacherRoute,
    useAuthenticatedRoute,
    useProfileRoute,
} from './useProtectedRoute';

// Exam Session Hooks (unified)
export { useExamSession, useTeacherExamPlayer } from './useExamSession';
export type { UseExamSessionOptions, ExamSessionState } from './useExamSession';

// Question Bank Hook
export {
    useQuestionBankCreate,
    createEmptyQuestion,
    createEmptySection,
    createEmptyVerse,
    type Lang,
    type ContentType,
    type QuestionType,
    type Question,
    type QuestionSection,
    type QuestionOption,
    type PoetryVerse,
    type UseQuestionBankCreateReturn,
} from './useQuestionBankCreate';

// Teacher Setup Hook
export {
    useTeacherSetup,
    type TeacherProfile,
    type TeacherFormData,
    type SocialLinks,
    type TabType,
    type UseTeacherSetupReturn,
} from './useTeacherSetup';

// Utility Hooks
export {
    useAsync,
    useDebounce,
    useThrottle,
    usePrevious,
    useLocalStorage,
    useMediaQuery,
    useIsMobile,
    useIsDesktop,
} from './useAsync';

// Form Validation Hook
export { useFormValidation, rules, validate, isValid } from './useFormValidation';
export type { UseFormValidationOptions, UseFormValidationReturn } from './useFormValidation';

// Admin Table Hook
export { useAdminTable } from './useAdminTable';
export type { UseAdminTableOptions, UseAdminTableReturn } from './useAdminTable';

// Exam Create Hook
export { useExamCreate } from './useExamCreate';
export type { UseExamCreateReturn } from './useExamCreate';

// Generic API Query Hooks
export {
    useApiQuery,
    useApiCreate,
    useApiUpdate,
    useApiDelete,
    // Pre-configured hooks
    useUsers,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useTeachers as useTeachersAPI,
    useStages,
    useCreateStage,
    useUpdateStage,
    useDeleteStage,
    useSubjects as useSubjectsAPI,
    useCreateSubject,
    useUpdateSubject,
    useDeleteSubject,
    useLessons as useLessonsAPI,
    useCreateLesson,
    useUpdateLesson,
    useDeleteLesson,
    useExams,
    useCreateExam,
    useUpdateExam,
    useDeleteExam,
    useQuestionBanks,
    useDeleteQuestionBank,
} from './useApiQuery';
export type { QueryConfig, UseQueryResult, UseMutationResult } from './useApiQuery';

// Student Attempts Hooks
export {
    useQuestionBankAttempt,
    useQuestionBankProgress,
    useTeacherExamAttempt,
    useTeacherExamResults,
    useComprehensiveExamAttempt,
    useStudentExamAttempts,
} from './useStudentAttempts';

// Re-export types
export type { UseAuthReturn } from './useAuth';
export type { AsyncState } from './useAsync';

// =============================================
// Data Layer Hooks (with caching via dataService)
// =============================================
export {
    useStages as useStagesWithCache,
    useSubjects as useSubjectsWithCache,
    useSubjectsWithLessons,
    useLessons as useLessonsWithCache,
    useExams as useExamsWithCache,
    usePlatformStats,
    useAdminStats,
    useDashboard,
    useAdminDashboard as useAdminDashboardData,
} from '@/lib/data/hooks';

// =============================================
// Unified Data Hooks (API Routes - Vercel Safe)
// =============================================
export {
    useSession,
    useStages as useStagesAPI,
    useSubjects as useSubjectsAPI2,
    useTeacherDashboard,
    useTeacherProfile,
    useReferenceData,
    type SessionData,
    type Stage,
    type Subject,
    type TeacherDashboardData,
    type TeacherProfileData,
    type ReferenceData,
    type DataState,
} from './useData';
