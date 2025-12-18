// =============================================
// أنواع البيانات الأساسية
// =============================================

export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar_url: string | null;
    bio: string | null;
    specialization: string | null;
    is_verified: boolean;
    subscriber_count: number;

    // المرحلة التعليمية المفضلة
    educational_stage_id?: string | null;

    // حقول المعلم
    is_teacher_profile_public?: boolean;
    teacher_title?: string | null;
    years_of_experience?: number;
    education?: string | null;
    phone?: string | null;
    website?: string | null;
    social_links?: {
        twitter?: string;
        youtube?: string;
        facebook?: string;
        instagram?: string;
        linkedin?: string;
    };
    subjects?: string[];
    stages?: string[];
    teaching_style?: string | null;
    cover_image_url?: string | null;
    is_featured?: boolean;
    featured_until?: string | null;
    total_views?: number;
    rating_average?: number;
    rating_count?: number;

    created_at: string;
    updated_at: string;
}

// =============================================
// المراحل والمواد
// =============================================

export interface EducationalStage {
    id: string;
    name: string;
    name_ar: string;
    description?: string | null;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Subject {
    id: string;
    name: string;
    name_ar: string;
    description?: string | null;
    icon?: string | null;
    color: string;
    stage_id?: string | null;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// =============================================
// الدروس
// =============================================

export interface Lesson {
    id: string;
    title: string;
    title_ar?: string | null;
    description?: string | null;
    content?: string | null;
    subject_id?: string | null;
    stage_id?: string | null;
    order_index: number;
    is_published: boolean;
    is_free: boolean;
    views_count: number;
    likes_count: number;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface LessonQuestion {
    id: string;
    lesson_id: string;
    text: { ar: string; en: string };
    type: 'mcq' | 'truefalse' | 'essay' | 'fill_blank' | 'matching';
    options: Array<{ id: string; text: { ar: string; en: string } }>;
    correct_option_id?: string | null;
    correct_answer?: any;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
    order_index: number;
    media?: any;
    hint?: { ar: string; en: string };
    explanation?: { ar: string; en: string };
    is_active: boolean;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

// =============================================
// الإشعارات والرسائل
// =============================================

export interface Notification {
    id: string;
    title: string;
    message: string;
    target_role: 'all' | 'students' | 'teachers' | 'admins';
    status: 'draft' | 'sent' | 'scheduled';
    sent_at?: string | null;
    scheduled_for?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    from_user_id?: string | null;
    from_name: string;
    from_email: string;
    subject: string;
    message: string;
    is_read: boolean;
    is_starred: boolean;
    is_archived: boolean;
    is_replied: boolean;
    reply_text?: string | null;
    replied_at?: string | null;
    replied_by?: string | null;
    created_at: string;
}

// =============================================
// الاشتراكات والتقييمات
// =============================================

export interface TeacherSubscription {
    id: string;
    user_id: string;
    teacher_id: string;
    notifications_enabled: boolean;
    created_at: string;
}

export interface TeacherRating {
    id: string;
    teacher_id: string;
    user_id: string;
    rating: number; // 1-5
    review?: string | null;
    created_at: string;
    updated_at: string;
}

// =============================================
// الامتحانات الشاملة
// =============================================

export interface ComprehensiveExam {
    id: string;
    type: 'arabic_comprehensive_exam' | 'english_comprehensive_exam';
    language: 'arabic' | 'english';
    usage_scope: 'exam' | 'lesson';
    lesson_id?: string | null;
    exam_title: string;
    exam_description?: string | null;
    total_marks?: number | null;
    duration_minutes?: number | null;
    passing_score?: number | null;
    grading_mode: 'manual' | 'hybrid' | 'auto';
    branch_tags: string[];
    blocks: any[];
    sections: any[];
    is_published: boolean;
    stage_id?: string | null;
    subject_id?: string | null;
    subject_name?: string | null;
    stage_name?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ComprehensiveExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    student_name?: string | null;
    started_at: string;
    completed_at?: string | null;
    answers: any;
    total_score: number;
    max_score: number;
    status: 'in_progress' | 'completed' | 'graded';
    created_at: string;
    updated_at: string;
}

// =============================================
// إعدادات الموقع
// =============================================

export interface SiteSetting {
    id: string;
    key: string;
    value: any;
    description?: string | null;
    updated_by?: string | null;
    created_at: string;
    updated_at: string;
}

// =============================================
// محادثات الدعم
// =============================================

export interface SupportChat {
    id: string;
    user_id?: string | null;
    user_name: string;
    user_email: string;
    status: 'open' | 'resolved' | 'pending';
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    chat_id: string;
    sender_type: 'user' | 'ai' | 'admin';
    sender_id?: string | null;
    message: string;
    is_ai_response: boolean;
    created_at: string;
}

// =============================================
// تقدم المستخدم
// =============================================

export interface UserLessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    is_completed: boolean;
    progress_percentage: number;
    last_accessed_at: string;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
}
