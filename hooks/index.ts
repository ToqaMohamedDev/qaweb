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

// Protected Route Hooks
export {
    useProtectedRoute,
    useAdminRoute,
    useTeacherRoute,
    useAuthenticatedRoute,
    useProfileRoute,
} from './useProtectedRoute';

// Exam Player Hook
export { useExamPlayer } from './useExamPlayer';

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

// Re-export types
export type { UseAuthReturn } from './useAuth';
export type { AsyncState } from './useAsync';




