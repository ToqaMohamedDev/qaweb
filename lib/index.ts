// =============================================
// Library Exports - نقطة تصدير مركزية للمكتبة
// =============================================

// Types
export * from './types';

// Database Types
export type {
    Database,
    Json,
    UserRole,
    DeviceType,
    Profile,
    EducationalStage,
    Subject,
    Lesson,
    LessonQuestion,
    ComprehensiveExam,
    TeacherExam,
    TeacherSubscription,
    Notification,
    UserDevice,
    VisitorDevice,
} from './database.types';

// Services
export * from './services';

// Supabase Client
export {
    supabase,
    getSupabaseClient,
    createClient
} from './supabase';

// Actions
export * from './actions';

// Utils
export * from './utils';

// Animations
export * from './animations';

// Constants
export * from './constants';
