// =============================================
// Admin Dashboard Types
// =============================================

import type { LucideIcon } from 'lucide-react';

export interface DashboardStats {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalComprehensiveExams: number;
    totalLessons: number;
    totalStages: number;
    totalSubjects: number;
    totalQuestions: number;
    verifiedTeachers: number;
    publishedLessons: number;
    publishedExams: number;
    growth: {
        users: number;
        exams: number;
        lessons: number;
    };
}

export interface RecentUser {
    id: string;
    name: string;
    email: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    avatar_url?: string;
}

export interface RecentExam {
    id: string;
    examTitle?: string;
    title?: { ar?: string; en?: string };
    isPublished?: boolean;
    is_published?: boolean;
    created_at: string;
    type?: string;
    language?: string;
}

export interface ActivityItem {
    id: string;
    action: string;
    description: string;
    time: string;
    type: 'user' | 'teacher' | 'exam' | 'lesson' | 'system';
    icon?: LucideIcon;
}

export interface QuickAction {
    icon: LucideIcon;
    title: string;
    description: string;
    href: string;
    color: string;
}

export interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    chartData?: number[];
}

export interface MiniStatItem {
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
}
