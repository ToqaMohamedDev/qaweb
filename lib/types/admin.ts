// =============================================
// Admin Types - أنواع لوحة التحكم
// =============================================

import { Database } from '@/lib/database.types';
import { LucideIcon } from 'lucide-react';

// Profile type from database
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Admin Stats Item
export interface AdminStatItem {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

// Delete Modal State
export interface DeleteModalState {
    isOpen: boolean;
    id: string | null;
    name: string;
}

// Filter Option
export interface FilterOption {
    value: string;
    label: string;
}

// Role Config
export interface RoleConfig {
    label: string;
    color: string;
    icon: LucideIcon;
}

// Common Form Field Props
export interface FormFieldProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'number' | 'textarea';
    disabled?: boolean;
    placeholder?: string;
    rows?: number;
}

// Teacher Form Data
export interface TeacherFormData {
    name: string;
    specialization: string;
    bio: string;
    is_verified: boolean;
    is_teacher_approved: boolean;
    teacher_title: string;
    years_of_experience: number;
    education: string;
    phone: string;
    website: string;
    teaching_style: string;
}

// User Form Data
export interface UserFormData {
    name: string;
    email: string;
    role: Profile['role'];
    bio: string;
    specialization: string;
    teacher_title: string;
    years_of_experience: number;
    education: string;
    phone: string;
    website: string;
    teaching_style: string;
}

// Admin Table Column
export interface AdminTableColumn<T> {
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    width?: string;
}

// Pagination Props
export interface PaginationConfig {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
}
