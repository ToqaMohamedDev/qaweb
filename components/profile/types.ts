// =============================================
// Profile Types - أنواع TypeScript للملف الشخصي
// =============================================

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface Stage {
    id: string;
    name: string;
}

export interface ExamStats {
    total: number;        // إجمالي الامتحانات المتاحة للمرحلة
    taken: number;        // عدد الامتحانات اللي الطالب دخلها
    passed: number;       // عدد الامتحانات اللي نجح فيها
    averageScore: number;
    totalScore: number;
}

export interface UserStats {
    completedLessons: number;
    totalLessons: number;
    examsTaken: number;
    passedExams: number;
    totalScore: number;
    activeDays: number;
    currentStreak: number;
    averageScore: number;
    // إحصائيات منفصلة
    siteExams?: ExamStats;
    teacherExams?: ExamStats;
    questionBank?: ExamStats;
}

export interface ActivityItem {
    id: string;
    type: 'lesson' | 'exam';
    title: string;
    date: string;
    score?: number;
    status?: string;
    subject?: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    unlocked: boolean;
    progress?: number;
    color: string;
}

export interface ProfileFormData {
    name: string;
    avatar_url: string;
    bio: string;
    educational_stage_id: string;
}

export interface StatCardData {
    label: string;
    value: string | number;
    total?: number;
    streak?: number;
    icon: LucideIcon;
    gradient: string;
    bg: string;
}

export type ProfileTab = 'overview' | 'exams' | 'achievements' | 'settings';

export interface TabItem {
    id: ProfileTab;
    label: string;
    icon: LucideIcon;
}

export const initialStats: UserStats = {
    completedLessons: 0,
    totalLessons: 0,
    examsTaken: 0,
    passedExams: 0,
    totalScore: 0,
    activeDays: 1,
    currentStreak: 0,
    averageScore: 0,
    siteExams: { total: 0, taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
    teacherExams: { total: 0, taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
    questionBank: { total: 0, taken: 0, passed: 0, averageScore: 0, totalScore: 0 },
};

export const initialFormData: ProfileFormData = {
    name: '',
    avatar_url: '',
    bio: '',
    educational_stage_id: '',
};
