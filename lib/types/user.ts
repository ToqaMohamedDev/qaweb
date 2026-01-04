// =============================================
// User Types - أنواع المستخدمين
// =============================================

export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
    bio: string | null;
    specialization: string | null;
    isVerified: boolean;
    subscriberCount: number;
    educationalStageId?: string | null;
    isTeacherApproved: boolean; // هل تم اعتماد المدرس من الأدمن
    roleSelected: boolean; // هل اختار المستخدم دوره
    createdAt: string;
    updatedAt: string;
}

// Database Row Type (snake_case for Supabase compatibility)
// This matches the full profiles table schema
export interface UserProfileDBRow {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar_url: string | null;
    bio: string | null;
    specialization: string | null;
    is_verified: boolean;
    subscriber_count: number;
    educational_stage_id?: string | null;
    is_teacher_approved: boolean;
    role_selected: boolean;

    // Teacher-specific fields
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

// Auth State
export interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** تحويل صف قاعدة البيانات إلى UserProfile */
export function mapDbRowToProfile(row: UserProfileDBRow | null): UserProfile | null {
    if (!row) return null;

    return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        avatarUrl: row.avatar_url,
        bio: row.bio,
        specialization: row.specialization,
        isVerified: row.is_verified,
        subscriberCount: row.subscriber_count,
        educationalStageId: row.educational_stage_id,
        isTeacherApproved: row.is_teacher_approved ?? false,
        roleSelected: row.role_selected ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

