'use client';

// =============================================
// useProfile Hook - جلب بيانات الملف الشخصي
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Play,
    BookOpen,
    GraduationCap,
    FileText,
    Star,
    Flame,
    Zap,
    Trophy,
} from 'lucide-react';
import { supabase, getProfile, updateProfile as updateUserProfile } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import type { UserProfile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import type {
    Stage,
    UserStats,
    ActivityItem,
    Achievement,
    ProfileFormData,
} from '@/components/profile';
import { initialStats, initialFormData } from '@/components/profile';

interface UseProfileReturn {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isSaving: boolean;
    isUploadingImage: boolean;
    saveSuccess: boolean;
    stats: UserStats;
    stages: Stage[];
    achievements: Achievement[];
    recentActivity: ActivityItem[];
    formData: ProfileFormData;
    userLevel: number;
    levelProgress: number;
    setFormData: (data: ProfileFormData | ((prev: ProfileFormData) => ProfileFormData)) => void;
    setIsUploadingImage: (value: boolean) => void;
    handleSave: () => Promise<void>;
    handleLogout: () => Promise<void>;
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    formatRelativeDate: (dateString: string) => string;
}

export function useProfile(): UseProfileReturn {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [stages, setStages] = useState<Stage[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState<UserStats>(initialStats);
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [formData, setFormData] = useState<ProfileFormData>(initialFormData);

    // Calculate level
    const userLevel = Math.floor((stats.completedLessons + stats.examsTaken * 2) / 5) + 1;
    const levelProgress = ((stats.completedLessons + stats.examsTaken * 2) % 5) * 20;

    // Format relative date
    const formatRelativeDate = useCallback((dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    }, []);

    // Generate achievements
    const generateAchievements = useCallback((currentStats: UserStats) => {
        const achievementsList: Achievement[] = [
            {
                id: '1',
                title: 'البداية',
                description: 'أكمل أول درس',
                icon: <Play className="h-5 w-5" />,
                unlocked: currentStats.completedLessons >= 1,
                color: 'from-green-500 to-emerald-500',
            },
            {
                id: '2',
                title: 'متعلم نشيط',
                description: 'أكمل 5 دروس',
                icon: <BookOpen className="h-5 w-5" />,
                unlocked: currentStats.completedLessons >= 5,
                progress: Math.min((currentStats.completedLessons / 5) * 100, 100),
                color: 'from-blue-500 to-cyan-500',
            },
            {
                id: '3',
                title: 'محترف الدروس',
                description: 'أكمل 20 درس',
                icon: <GraduationCap className="h-5 w-5" />,
                unlocked: currentStats.completedLessons >= 20,
                progress: Math.min((currentStats.completedLessons / 20) * 100, 100),
                color: 'from-purple-500 to-violet-500',
            },
            {
                id: '4',
                title: 'خائض الامتحانات',
                description: 'أكمل أول امتحان',
                icon: <FileText className="h-5 w-5" />,
                unlocked: currentStats.examsTaken >= 1,
                color: 'from-amber-500 to-orange-500',
            },
            {
                id: '5',
                title: 'متفوق',
                description: 'احصل على 80% أو أكثر في امتحان',
                icon: <Star className="h-5 w-5" />,
                unlocked: currentStats.averageScore >= 80,
                color: 'from-yellow-500 to-amber-500',
            },
            {
                id: '6',
                title: 'سريع النار',
                description: 'حافظ على سلسلة 7 أيام متتالية',
                icon: <Flame className="h-5 w-5" />,
                unlocked: currentStats.currentStreak >= 7,
                progress: Math.min((currentStats.currentStreak / 7) * 100, 100),
                color: 'from-red-500 to-rose-500',
            },
            {
                id: '7',
                title: 'مثابر',
                description: 'كن نشطاً لمدة 30 يوم',
                icon: <Zap className="h-5 w-5" />,
                unlocked: currentStats.activeDays >= 30,
                progress: Math.min((currentStats.activeDays / 30) * 100, 100),
                color: 'from-indigo-500 to-purple-500',
            },
            {
                id: '8',
                title: 'بطل الامتحانات',
                description: 'انجح في 10 امتحانات',
                icon: <Trophy className="h-5 w-5" />,
                unlocked: currentStats.passedExams >= 10,
                progress: Math.min((currentStats.passedExams / 10) * 100, 100),
                color: 'from-fuchsia-500 to-pink-500',
            },
        ];
        setAchievements(achievementsList);
    }, []);

    // Fetch user stats
    const fetchUserStats = useCallback(async (userId: string) => {
        try {
            const { data: lessonProgress } = await supabase
                .from('user_lesson_progress')
                .select('*')
                .eq('user_id', userId);

            const { count: totalLessons } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('is_published', true);

            const { data: examAttempts } = await supabase
                .from('comprehensive_exam_attempts')
                .select('*')
                .eq('student_id', userId);

            const completedLessons = lessonProgress?.filter((p) => p.is_completed)?.length || 0;
            const examsTaken = examAttempts?.length || 0;
            const passedExams = examAttempts?.filter(
                (e) => e.status === 'completed' || e.status === 'graded'
            )?.length || 0;

            let totalScore = 0;
            let averageScore = 0;
            if (examAttempts && examAttempts.length > 0) {
                totalScore = examAttempts.reduce((acc, e) => acc + (e.total_score || 0), 0);
                const avgScores = examAttempts.map((e) =>
                    (e.max_score ?? 0) > 0 ? ((e.total_score ?? 0) / e.max_score!) * 100 : 0
                );
                averageScore = avgScores.reduce((a, b) => a + b, 0) / avgScores.length;
            }

            const activityDates = new Set<string>();
            lessonProgress?.forEach((p: any) => {
                if (p.last_accessed_at || p.updated_at) {
                    activityDates.add(new Date(p.last_accessed_at || p.updated_at).toDateString());
                }
            });
            examAttempts?.forEach((e) => {
                if (e.started_at) {
                    activityDates.add(new Date(e.started_at).toDateString());
                }
            });

            let currentStreak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                if (activityDates.has(checkDate.toDateString())) {
                    currentStreak++;
                } else if (i > 0) {
                    break;
                }
            }

            const newStats: UserStats = {
                completedLessons,
                totalLessons: totalLessons || 0,
                examsTaken,
                passedExams,
                totalScore,
                activeDays: Math.max(activityDates.size, 1),
                currentStreak,
                averageScore: Math.round(averageScore),
            };

            setStats(newStats);
            generateAchievements(newStats);
        } catch (error) {
            logger.error('Error fetching user stats', { context: 'useProfile', data: error });
        }
    }, [generateAchievements]);

    // Fetch recent activity
    const fetchRecentActivity = useCallback(async (userId: string) => {
        try {
            const activities: ActivityItem[] = [];

            const { data: lessonProgress } = await supabase
                .from('user_lesson_progress')
                .select(`
                    id,
                    lesson_id,
                    is_completed,
                    last_accessed_at,
                    lessons:lesson_id (title, subject_id)
                `)
                .eq('user_id', userId)
                .order('last_accessed_at', { ascending: false })
                .limit(5);

            if (lessonProgress) {
                lessonProgress.forEach((p: unknown) => {
                    const item = p as { id: string; lessons: { title: string } | null; last_accessed_at: string; is_completed: boolean };
                    if (item.lessons) {
                        activities.push({
                            id: item.id,
                            type: 'lesson',
                            title: item.lessons.title || 'درس',
                            date: item.last_accessed_at,
                            status: item.is_completed ? 'مكتمل' : 'قيد التقدم',
                        });
                    }
                });
            }

            const { data: examAttempts } = await supabase
                .from('comprehensive_exam_attempts')
                .select(`
                    id,
                    exam_id,
                    started_at,
                    total_score,
                    max_score,
                    status,
                    comprehensive_exams:exam_id (exam_title)
                `)
                .eq('student_id', userId)
                .order('started_at', { ascending: false })
                .limit(5);

            if (examAttempts) {
                examAttempts.forEach((e: unknown) => {
                    const exam = e as { id: string; comprehensive_exams: { exam_title: string } | null; started_at: string; total_score: number; max_score: number; status: string };
                    const score = exam.max_score > 0
                        ? Math.round((exam.total_score / exam.max_score) * 100)
                        : 0;
                    activities.push({
                        id: exam.id,
                        type: 'exam',
                        title: exam.comprehensive_exams?.exam_title || 'امتحان',
                        date: exam.started_at,
                        score,
                        status:
                            exam.status === 'completed' || exam.status === 'graded'
                                ? 'مكتمل'
                                : exam.status === 'in_progress'
                                    ? 'قيد التنفيذ'
                                    : exam.status,
                    });
                });
            }

            activities.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            setRecentActivity(activities.slice(0, 8));
        } catch (error) {
            logger.error('Error fetching recent activity', { context: 'useProfile', data: error });
        }
    }, []);

    // Fetch user data via API for Vercel compatibility
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Use API instead of direct supabase.auth.getUser()
                const authRes = await fetch('/api/auth/user?includeProfile=true');
                const authResult = await authRes.json();

                if (!authResult.success || !authResult.data?.user) {
                    router.push('/login');
                    return;
                }

                const authUser = authResult.data.user;
                const userProfile = authResult.data.profile;

                // Create a user-like object for compatibility
                setUser({
                    id: authUser.id,
                    email: authUser.email,
                    phone: authUser.phone,
                    created_at: authUser.created_at,
                } as User);

                if (userProfile) {
                    setProfile(userProfile as UserProfile);
                    setFormData({
                        name: userProfile.name || '',
                        avatar_url: userProfile.avatar_url || '',
                        bio: userProfile.bio || '',
                        educational_stage_id: userProfile.educational_stage_id || '',
                    });
                }

                const { data: stagesData } = await supabase
                    .from('educational_stages')
                    .select('id, name')
                    .order('order_index', { ascending: true });
                setStages(stagesData || []);

                await fetchUserStats(authUser.id);
                await fetchRecentActivity(authUser.id);
            } catch (error) {
                logger.error('Error fetching user', { context: 'useProfile', data: error });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router, fetchUserStats, fetchRecentActivity]);

    // Handle save
    const handleSave = useCallback(async () => {
        if (!user) return;

        try {
            setIsSaving(true);
            await updateUserProfile(user.id, {
                name: formData.name,
                avatar_url: formData.avatar_url,
                bio: formData.bio,
            } as any);

            const updatedProfile = await getProfile(user.id) as any;
            setProfile(updatedProfile as UserProfile);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            logger.error('Error updating profile', { context: 'useProfile', data: error });
            alert('حدث خطأ أثناء حفظ البيانات');
        } finally {
            setIsSaving(false);
        }
    }, [user, formData]);

    // Handle logout
    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        router.push('/');
    }, [router]);

    // Handle image upload
    const handleImageUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file || !user) return;

            if (!file.type.startsWith('image/')) {
                alert('يرجى اختيار ملف صورة صالح');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
                return;
            }

            try {
                setIsUploadingImage(true);

                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const dataUrl = e.target?.result as string;
                        setFormData((prev) => ({ ...prev, avatar_url: dataUrl }));
                    };
                    reader.readAsDataURL(file);
                } else {
                    const {
                        data: { publicUrl },
                    } = supabase.storage.from('avatars').getPublicUrl(filePath);
                    setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
                }
            } catch (error) {
                logger.error('Error uploading image', { context: 'useProfile', data: error });
                alert('حدث خطأ أثناء رفع الصورة');
            } finally {
                setIsUploadingImage(false);
            }
        },
        [user]
    );

    return {
        user,
        profile,
        isLoading,
        isSaving,
        isUploadingImage,
        saveSuccess,
        stats,
        stages,
        achievements,
        recentActivity,
        formData,
        userLevel,
        levelProgress,
        setFormData,
        setIsUploadingImage,
        handleSave,
        handleLogout,
        handleImageUpload,
        formatRelativeDate,
    };
}

export default useProfile;
