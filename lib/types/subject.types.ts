/**
 * Subject & Stage Types
 * Centralized types for educational data
 */

// =============================================
// Subject Type
// =============================================

export interface Subject {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    icon: string | null;
    color: string | null;
    stage_id: string | null;
    order_index: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// =============================================
// Educational Stage Type
// =============================================

export interface EducationalStage {
    id: string;
    name: string;
    name_ar?: string;
    name_en?: string;
    slug: string;
    description: string | null;
    order_index: number | null;
    is_active: boolean;
    icon?: string | null;
    created_at: string;
    updated_at: string;
}

// =============================================
// Lesson Type
// =============================================

export interface Lesson {
    id: string;
    title: string | { ar?: string; en?: string };
    description: string | { ar?: string; en?: string } | null;
    stage_id: string | null;
    subject_id: string | null;
    order_index: number | null;
    is_published: boolean;
    likes_count?: number;
    views_count?: number;
    created_at: string;
    updated_at: string;
}

// =============================================
// Question Bank Type
// =============================================

export interface QuestionBank {
    id: string;
    title: string;
    description: string | null;
    lesson_id: string;
    subject_id: string | null;
    stage_id: string | null;
    questions: any[]; // JSONB array
    is_active: boolean;
    difficulty?: 'easy' | 'medium' | 'hard';
    created_at: string;
    updated_at: string;
}

// =============================================
// Category Option (for dropdowns)
// =============================================

export interface CategoryOption {
    id: string;
    name: string;
    icon?: React.ReactNode;
    slug?: string;
}

// =============================================
// Type Guards
// =============================================

export function isSubject(obj: any): obj is Subject {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.slug === 'string'
    );
}

export function isLesson(obj: any): obj is Lesson {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        (typeof obj.title === 'string' || typeof obj.title === 'object')
    );
}

// =============================================
// Transformers
// =============================================

/**
 * Get localized lesson title
 */
export function getLessonTitle(lesson: Lesson, lang: 'ar' | 'en' = 'ar'): string {
    if (typeof lesson.title === 'string') {
        return lesson.title;
    }
    return lesson.title?.[lang] || lesson.title?.ar || '';
}

/**
 * Get localized lesson description
 */
export function getLessonDescription(lesson: Lesson, lang: 'ar' | 'en' = 'ar'): string {
    if (typeof lesson.description === 'string') {
        return lesson.description;
    }
    if (lesson.description === null) {
        return '';
    }
    return lesson.description?.[lang] || lesson.description?.ar || '';
}

/**
 * Convert subjects to category options
 */
export function subjectsToCategoryOptions(subjects: Subject[]): CategoryOption[] {
    return subjects.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
    }));
}
