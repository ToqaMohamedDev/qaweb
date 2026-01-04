// =============================================
// Subject Types - أنواع المواد الدراسية
// =============================================

export interface Subject {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    description?: string | null;
    color?: string;
    icon?: string | null;
    orderIndex?: number;
    isActive?: boolean;
}

// Database Row Type (snake_case for Supabase compatibility)
export interface SubjectDBRow {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    description?: string | null;
    color?: string;
    icon?: string | null;
    order_index?: number;
    is_active?: boolean;
}

export interface EducationalStage {
    id: string;
    name: string;
    nameAr?: string;
    slug?: string;
    description?: string | null;
    orderIndex?: number;
    isActive?: boolean;
}

// Database Row Type
export interface EducationalStageDBRow {
    id: string;
    name: string;
    name_ar?: string;
    slug: string;
    image_url: string | null;
    description?: string | null;
    order_index?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}
