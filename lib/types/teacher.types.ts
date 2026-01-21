/**
 * Teacher Types
 * Centralized types for teacher-related data
 */

// =============================================
// Base Teacher Type
// =============================================

export interface Teacher {
    // Database fields (snake_case)
    id: string;
    name: string;
    bio: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
    specialization: string | null;
    is_verified: boolean;
    is_teacher_approved: boolean;
    subscriber_count: number;
    exam_count: number;
    rating_average: number | null;
    rating_count: number;
    total_views: number;
    phone: string | null;

    // Computed fields
    subjects: string[];
    stages: string[];

    // Aliases for UI compatibility (camelCase)
    displayName?: string;
    photoURL?: string;
    coverImageURL?: string;
    isVerified?: boolean;
    subscriberCount?: number;
    examsCount?: number;
    specialty?: string;
}

// =============================================
// Teacher Profile (Extended)
// =============================================

export interface TeacherProfile extends Teacher {
    // Additional profile fields
    years_of_experience?: number;
    education?: string | null;
    teaching_style?: string | null;
    teacher_title?: string | null;
    website?: string | null;
    whatsapp?: string | null;
    social_links?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        youtube?: string;
        linkedin?: string;
        telegram?: string;
        whatsapp?: string;
    };

    // Stats
    stats: {
        exams: number;
        lessons: number;
        rating: number;
        views: number;
    };

    // Aliases
    yearsOfExperience?: number;
    socialLinks?: TeacherProfile['social_links'];
    ratingCount?: number;
}

// =============================================
// Teacher Exam
// =============================================

export interface TeacherExam {
    id: string;
    title: string;
    description: string;
    duration: number;
    created_at: string;
    type: string;
    isPublished: boolean;
    questionsCount?: number;
    language?: string;
}

// =============================================
// Teacher Card Props
// =============================================

export interface TeacherCardProps {
    teacher: Teacher;
    isSubscribed?: boolean;
    isSubscribing?: boolean;
    onSubscribe?: (teacherId: string) => void;
    currentUserId?: string | null;
}

// =============================================
// Teacher Filter Options
// =============================================

export interface TeacherFilters {
    searchQuery: string;
    selectedCategory: string;
    sortBy?: 'name' | 'subscribers' | 'rating' | 'exams';
    sortOrder?: 'asc' | 'desc';
}

// =============================================
// Type Guards
// =============================================

export function isTeacherType(obj: any): obj is Teacher {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string'
    );
}

export function isTeacherProfileType(obj: any): obj is TeacherProfile {
    return isTeacherType(obj) && 'stats' in obj;
}

// =============================================
// Type Transformers
// =============================================

/**
 * Transform raw database teacher to UI-friendly Teacher
 */
export function transformTeacher(raw: any): Teacher {
    return {
        // Database fields
        id: raw.id,
        name: raw.name || 'معلم',
        bio: raw.bio || null,
        avatar_url: raw.avatar_url || null,
        cover_image_url: raw.cover_image_url || null,
        specialization: raw.specialization || null,
        is_verified: raw.is_verified || false,
        is_teacher_approved: raw.is_teacher_approved || false,
        subscriber_count: raw.subscriber_count || 0,
        exam_count: raw.exam_count || 0,
        rating_average: raw.rating_average || null,
        rating_count: raw.rating_count || 0,
        total_views: raw.total_views || 0,
        phone: raw.phone || null,
        subjects: raw.subjects || [],
        stages: raw.stages || [],

        // Aliases
        displayName: raw.name || 'معلم',
        photoURL: raw.avatar_url,
        coverImageURL: raw.cover_image_url,
        isVerified: raw.is_verified || false,
        subscriberCount: raw.subscriber_count || 0,
        examsCount: raw.exam_count || 0,
        specialty: raw.specialization || raw.bio || null,
    };
}

/**
 * Transform raw database to TeacherProfile
 */
export function transformTeacherProfile(raw: any, examsCount = 0): TeacherProfile {
    const base = transformTeacher(raw);

    return {
        ...base,
        years_of_experience: raw.years_of_experience || 0,
        education: raw.education || null,
        teaching_style: raw.teaching_style || null,
        teacher_title: raw.teacher_title || null,
        website: raw.website || null,
        whatsapp: raw.social_links?.whatsapp || raw.whatsapp || null,
        social_links: raw.social_links || {},
        stats: {
            exams: examsCount || raw.exam_count || 0,
            lessons: 0,
            rating: raw.rating_average || 0,
            views: raw.total_views || 0,
        },
        yearsOfExperience: raw.years_of_experience || 0,
        socialLinks: raw.social_links || {},
        ratingCount: raw.rating_count || 0,
    };
}
