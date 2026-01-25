'use client';

// =============================================
// useDashboard Hook - هوك الصفحة الرئيسية الجديد
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardAction, type SubjectWithLessons, type PlatformStats, type ExamForDashboard } from '@/lib/actions/dashboard';

export interface UseDashboardReturn {
    subjects: SubjectWithLessons[];
    exams: ExamForDashboard[];
    stageName: string;
    stageId: string | null;
    currentSemester: 'first' | 'second' | 'full_year';
    stats: PlatformStats;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const defaultStats: PlatformStats = {
    totalUsers: 0,
    totalLessons: 0,
    totalExams: 0,
    averageRating: 4.8,
    successRate: 85
};

export function useDashboard(): UseDashboardReturn {
    const [subjects, setSubjects] = useState<SubjectWithLessons[]>([]);
    const [exams, setExams] = useState<ExamForDashboard[]>([]);
    const [stageName, setStageName] = useState<string>('');
    const [stageId, setStageId] = useState<string | null>(null);
    const [currentSemester, setCurrentSemester] = useState<'first' | 'second' | 'full_year'>('full_year');
    const [stats, setStats] = useState<PlatformStats>(defaultStats);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('[useDashboard] Fetching dashboard data...');
            const result = await fetchDashboardAction();

            if (result.success) {
                setSubjects(result.subjects);
                setExams(result.exams);
                setStageName(result.stageName);
                setStageId(result.stageId);
                setCurrentSemester(result.currentSemester);
                setStats(result.stats);
                console.log('[useDashboard] Data fetched successfully:', {
                    subjectsCount: result.subjects.length,
                    examsCount: result.exams.length,
                    stageName: result.stageName,
                    currentSemester: result.currentSemester,
                    stats: result.stats
                });
            } else {
                console.error('[useDashboard] Error:', result.error);
                setError(result.error || 'حدث خطأ أثناء تحميل البيانات');
            }
        } catch (err) {
            console.error('[useDashboard] Exception:', err);
            setError('حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        subjects,
        exams,
        stageName,
        stageId,
        currentSemester,
        stats,
        isLoading,
        error,
        refresh: fetchData
    };
}
