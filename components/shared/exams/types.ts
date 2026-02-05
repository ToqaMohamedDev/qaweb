// ═══════════════════════════════════════════════════════════════════════════
// Exams Shared Types - أنواع مشتركة لإدارة الامتحانات
// ═══════════════════════════════════════════════════════════════════════════

import { LucideIcon } from 'lucide-react';

export type ExamLanguage = 'arabic' | 'english' | 'all';
export type ExamStatusFilter = 'all' | 'published' | 'draft';

export interface ExamData {
    id: string;
    exam_title: string;
    language: 'arabic' | 'english';
    is_published: boolean;
    created_at: string;
    updated_at?: string;
    duration_minutes?: number;
    stage_id?: string;
    subject_id?: string;
    semester?: string;
    sections?: any[];
    blocks?: any[];
    total_marks?: number;
    created_by?: string;
}

export interface ExamCardProps {
    exam: ExamData;
    index?: number;
    variant?: 'admin' | 'teacher';
    showDropdown?: boolean;
    isDropdownActive?: boolean;
    onToggleDropdown?: () => void;
    onDelete?: () => void;
    onTogglePublish?: () => void;
    onEdit?: () => void;
    onView?: () => void;
}

export interface ExamsFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filterLanguage: ExamLanguage;
    onLanguageChange: (value: ExamLanguage) => void;
    filterStatus: ExamStatusFilter;
    onStatusChange: (value: ExamStatusFilter) => void;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
    // Optional extended filters
    stages?: { id: string; name: string }[];
    subjects?: { id: string; name: string }[];
    selectedStage?: string;
    onStageChange?: (value: string) => void;
    selectedSubject?: string;
    onSubjectChange?: (value: string) => void;
    selectedSemester?: string;
    onSemesterChange?: (value: string) => void;
}

export interface ExamStatsItem {
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
}

export interface ExamsListProps {
    exams: ExamData[];
    isLoading?: boolean;
    variant?: 'admin' | 'teacher';
    onDelete?: (examId: string) => void;
    onTogglePublish?: (examId: string, currentStatus: boolean) => void;
    createHref?: string;
    emptyMessage?: string;
}
