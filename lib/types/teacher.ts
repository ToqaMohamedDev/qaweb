// =============================================
// Teacher Types - أنواع المعلمين
// =============================================

export interface Teacher {
    id: string;
    displayName: string;
    specialty: string;
    photoURL: string | null;
    coverImageURL: string | null;
    isVerified: boolean;
    subscriberCount: number;
    examsCount: number;
    isFeatured: boolean;
    subjects: string[];
}

export interface TeacherProfile extends Teacher {
    bio?: string | null;
    email?: string;
    phone?: string | null;
    website?: string | null;
    socialLinks?: TeacherSocialLinks;
    yearsOfExperience?: number;
    education?: string | null;
    teachingStyle?: string | null;
    ratingAverage?: number;
    ratingCount?: number;
    totalViews?: number;
    stages?: string[];
}

export interface TeacherSocialLinks {
    twitter?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
}

export interface TeacherSubscription {
    id: string;
    userId: string;
    teacherId: string;
    notificationsEnabled: boolean;
    createdAt: string;
}

export interface TeacherRating {
    id: string;
    teacherId: string;
    userId: string;
    rating: number; // 1-5
    review?: string | null;
    createdAt: string;
    updatedAt: string;
}

// Database Row Types (snake_case for Supabase compatibility)
export interface TeacherDBRow {
    id: string;
    name: string | null;
    specialization: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
    is_verified: boolean | null;
    is_featured: boolean | null;
    subjects: string[] | null;
    subscriber_count?: number | null;
}
