/**
 * Types Index
 * 
 * Central export for all application types
 */

// Re-export database types
import type {
    Database,
    Json,
    Tables,
    UserRole,
    DeviceType,
    ExamType,
    SenderType,
    NotificationStatus,
    NotificationTargetRole,
    TablesInsert,
    TablesUpdate,
    Profile,
    EducationalStage,
    Subject,
    Lesson,
    LessonQuestion,
    ComprehensiveExam,
    TeacherExam,
    ComprehensiveExamAttempt,
    TeacherExamAttempt,
    TeacherSubscription,
    TeacherRating,
    UserLessonProgress,
    Notification,
    NotificationPreference,
    Message,
    SupportChat,
    ChatMessage,
    UserDevice,
    VisitorDevice,
    SiteSetting,
} from '../database.types';

export type {
    Database,
    Json,
    Tables,
    UserRole,
    DeviceType,
    ExamType,
    SenderType,
    NotificationStatus,
    NotificationTargetRole,
    TablesInsert,
    TablesUpdate,
    Profile,
    EducationalStage,
    Subject,
    Lesson,
    LessonQuestion,
    ComprehensiveExam,
    TeacherExam,
    ComprehensiveExamAttempt,
    TeacherExamAttempt,
    TeacherSubscription,
    TeacherRating,
    UserLessonProgress,
    Notification,
    NotificationPreference,
    Message,
    SupportChat,
    ChatMessage,
    UserDevice,
    VisitorDevice,
    SiteSetting,
};

// Re-export user types
export type { UserProfile, UserProfileDBRow, AuthState as UserAuthState } from './user';
export { mapDbRowToProfile } from './user';

// Re-export exam types
export type {
    ExamSettings,
    ExamLanguage,
    ExamAttempt,
    QuestionType,
    DifficultyLevel,
    LangText,
    AnswerOption,
    QuestionMedia,
    ExamBlock,
    ExamQuestion,
    StudentAnswer
} from './exam';
export { defaultExamSettings } from './exam';

// Re-export new centralized types (named exports to avoid conflicts)
export {
    // Teacher types (using different names to avoid conflict)
    type TeacherProfile as TeacherProfileExtended,
    type TeacherExam as TeacherExamType,
    type TeacherCardProps,
    type TeacherFilters as TeacherFiltersExtended,
    isTeacherType,
    isTeacherProfileType,
    transformTeacher,
    transformTeacherProfile,
} from './teacher.types';

export {
    // Subject types
    type CategoryOption,
    type QuestionBank,
    isSubject,
    isLesson,
    getLessonTitle,
    getLessonDescription,
    subjectsToCategoryOptions,
} from './subject.types';

// Re-export exam types from consolidated exam.ts
export type {
    Question,
    QuestionOption,
    ExamSubsection,
    TransformedExam,
    ExamPlayerState,
    ExamAvailability,
    Exam,
} from './exam';

// Re-export exam utilities from exam-utils.ts
export {
    getQuestionTypeLabel,
    getOptionText,
    getCorrectAnswerIndex,
    checkExamAvailability,
    questionTypeLabels,
    questionTypeOrder,
    formatExamTime,
    isTimeWarning,
    calculateScorePercentage,
    isPassingScore,
    getScoreGrade,
    isQuestion,
    isExam,
} from '../utils/exam-utils';

// Teacher type (extended Profile with camelCase aliases)
export type Teacher = Tables<'profiles'> & {
    // Database fields (snake_case) - can be null or undefined
    exam_count?: number | null;
    subscriber_count?: number | null;
    rating_average?: number | null;
    rating_count?: number | null;
    cover_image_url?: string | null;
    is_verified?: boolean | null;
    is_teacher_approved?: boolean | null;
    is_teacher_profile_public?: boolean | null;
    teacher_title?: string | null;
    years_of_experience?: number | null;
    teaching_style?: string | null;
    subjects?: string[] | null;
    stages?: string[] | null;
    social_links?: Record<string, string> | null;

    // camelCase aliases (for components)
    coverImageURL?: string | null;
    photoURL?: string | null;
    displayName?: string | null;
    isVerified?: boolean | null;
    isFeatured?: boolean | null;
    specialty?: string | null;
    specialization?: string | null;
    examsCount?: number | null;
    subscriberCount?: number | null;
};

// ==========================================
// Common Types
// ==========================================

export type { Result } from './common';
export { ok, err } from './common';

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface SelectOption {
    value: string;
    label: string;
}

// ==========================================
// Auth Types
// ==========================================

export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role?: string;
    avatar_url?: string;
}

export interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// ==========================================
// Form Types
// ==========================================

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'number';
    placeholder?: string;
    required?: boolean;
    options?: SelectOption[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}

// ==========================================
// Table Types
// ==========================================

export interface TableColumn<T = unknown> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableAction<T = unknown> {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T) => void;
    variant?: 'default' | 'danger' | 'success';
    condition?: (row: T) => boolean;
}

// ==========================================
// Component Props Types
// ==========================================

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
}

// ==========================================
// Exam Types
// ==========================================

export interface GenericExamQuestion {
    id: string;
    text: string | { ar?: string; en?: string };
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    options?: ExamOption[];
    correctAnswer?: string | string[];
    points: number;
    explanation?: string;
}

export interface ExamOption {
    id: string;
    text: string;
    isCorrect?: boolean;
}

export interface ExamSection {
    id: string;
    title: string;
    description?: string;
    questions: GenericExamQuestion[];
}

export interface GenericExamBlock {
    id: string;
    type: string;
    content: unknown;
}

// ==========================================
// Filter Types
// ==========================================

export interface BaseFilters {
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ExamFilters extends BaseFilters {
    stageId?: string;
    subjectId?: string;
    type?: string;
    isPublished?: boolean;
    createdBy?: string;
}

export interface LessonFilters extends BaseFilters {
    stageId?: string;
    subjectId?: string;
    isPublished?: boolean;
    isFree?: boolean;
    createdBy?: string;
}

export interface TeacherFilters extends BaseFilters {
    isApproved?: boolean;
    specialization?: string;
}
