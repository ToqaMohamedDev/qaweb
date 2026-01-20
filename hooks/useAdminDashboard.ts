/**
 * useAdminDashboard Hook - Uses Server API for data fetching
 * Works correctly on Vercel with HttpOnly cookies
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, RecentUser, RecentExam, ActivityItem } from '@/components/admin/types';

export function useAdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalComprehensiveExams: 0,
        publishedExams: 0,
        totalLessons: 0,
        publishedLessons: 0,
        totalStages: 0,
        totalSubjects: 0,
        totalQuestions: 0,
        verifiedTeachers: 0,
        growth: {
            users: 0,
            exams: 0,
            lessons: 0,
        },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [chartData, setChartData] = useState({
        users: [] as number[],
        exams: [] as number[],
        lessons: [] as number[],
    });

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log('[useAdminDashboard] Fetching from API...');

        try {
            const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();

            setStats(data.stats);
            setRecentUsers(data.recentUsers || []);
            setRecentExams(data.recentExams || []);
            setActivities(data.activities || []);
            setChartData(data.chartData || { users: [], exams: [], lessons: [] });

            console.log('[useAdminDashboard] Data fetched successfully');

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[useAdminDashboard] Error:', message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        stats,
        loading,
        error,
        recentUsers,
        recentExams,
        activities,
        chartData,
        refetch: fetchDashboardData,
    };
}
