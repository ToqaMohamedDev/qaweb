'use client';

// =============================================
// useProfile Hook - جلب بيانات الملف الشخصي
// =============================================
// يستخدم /api/profile للحصول على البيانات
// يعمل على Vercel و Local بشكل موحد

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
import { supabase, updateProfile as updateUserProfile } from '@/lib/supabase';
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

    // Calculate level based on total points (gamification)
    const totalPoints = stats.completedLessons + stats.examsTaken * 2;
    const userLevel = totalPoints > 0 ? Math.floor(totalPoints / 5) + 1 : 1;

    // Calculate overall learning progress (lesson completion percentage)
    const levelProgress = stats.totalLessons > 0
        ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
        : 0;

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

    // Generate achievements based on stats
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

    // Fetch all profile data from unified API
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                console.log('[useProfile] Fetching profile data from API...');

                const res = await fetch('/api/profile', { credentials: 'include' });
                const result = await res.json();

                if (!result.success || !result.data?.user) {
                    console.log('[useProfile] No user found, redirecting to login');
                    router.push('/login');
                    return;
                }

                const { user: authUser, profile: userProfile, stages: stagesData, stats: userStats, recentActivity: activity } = result.data;

                console.log('[useProfile] Data received:', {
                    hasUser: !!authUser,
                    hasProfile: !!userProfile,
                    stagesCount: stagesData?.length,
                    stats: userStats,
                    activityCount: activity?.length
                });

                // Set user
                setUser({
                    id: authUser.id,
                    email: authUser.email,
                    phone: authUser.phone,
                    created_at: authUser.created_at,
                } as User);

                // Set profile and form data
                if (userProfile) {
                    setProfile(userProfile as UserProfile);
                    setFormData({
                        name: userProfile.name || '',
                        avatar_url: userProfile.avatar_url || '',
                        bio: userProfile.bio || '',
                        educational_stage_id: userProfile.educational_stage_id || '',
                    });
                }

                // Set stages
                setStages(stagesData || []);

                // Set stats and generate achievements
                if (userStats) {
                    setStats(userStats);
                    generateAchievements(userStats);
                }

                // Set recent activity
                setRecentActivity(activity || []);

            } catch (error) {
                logger.error('Error fetching profile data', { context: 'useProfile', data: error });
                console.error('[useProfile] Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [router, generateAchievements]);

    // Handle save - uses /api/profile PATCH
    const handleSave = useCallback(async () => {
        if (!user) return;

        try {
            setIsSaving(true);

            // Update profile via API with educational_stage_id
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    avatar_url: formData.avatar_url,
                    bio: formData.bio,
                    educational_stage_id: formData.educational_stage_id || null,
                })
            });

            const result = await res.json();

            if (result.success && result.data) {
                setProfile(result.data as UserProfile);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                // Fallback to direct update
                await updateUserProfile(user.id, {
                    name: formData.name,
                    avatar_url: formData.avatar_url,
                    bio: formData.bio,
                    educational_stage_id: formData.educational_stage_id || null,
                } as any);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
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
                    // Fallback to base64
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
