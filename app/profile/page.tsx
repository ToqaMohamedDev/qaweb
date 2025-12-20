"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    User,
    Mail,
    Camera,
    Loader2,
    Save,
    LogOut,
    Shield,
    Award,
    BookOpen,
    Trophy,
    Calendar,
    Edit3,
    Settings,
    Lock,
    ChevronLeft,
    Clock,
    Target,
    Zap,
    Star,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    GraduationCap,
    Sparkles,
    BarChart3,
    FileText,
    Play,
    Crown,
    Upload,
    Image as ImageIcon,
    Medal,
    Flame,
    Gift
} from "lucide-react";
import { supabase, getUserProfile, updateUserProfile } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/definitions";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Stage {
    id: string;
    name: string;
}

interface UserStats {
    completedLessons: number;
    totalLessons: number;
    examsTaken: number;
    passedExams: number;
    totalScore: number;
    activeDays: number;
    currentStreak: number;
    averageScore: number;
}

interface ActivityItem {
    id: string;
    type: 'lesson' | 'exam';
    title: string;
    date: string;
    score?: number;
    status?: string;
    subject?: string;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    progress?: number;
    color: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity' | 'settings'>('overview');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [stages, setStages] = useState<Stage[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState<UserStats>({
        completedLessons: 0,
        totalLessons: 0,
        examsTaken: 0,
        passedExams: 0,
        totalScore: 0,
        activeDays: 1,
        currentStreak: 0,
        averageScore: 0
    });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        avatar_url: "",
        bio: "",
        educational_stage_id: ""
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/login");
                    return;
                }

                setUser(user);

                const userProfile = await getUserProfile(user.id);
                if (userProfile) {
                    setProfile(userProfile);
                    setFormData({
                        name: userProfile.name || "",
                        avatar_url: userProfile.avatar_url || "",
                        bio: userProfile.bio || "",
                        educational_stage_id: userProfile.educational_stage_id || ""
                    });
                }

                // Fetch stages
                const { data: stagesData } = await supabase
                    .from("educational_stages")
                    .select("id, name")
                    .order("order_index", { ascending: true });
                setStages(stagesData || []);

                // Fetch real user stats
                await fetchUserStats(user.id);

                // Fetch recent activity
                await fetchRecentActivity(user.id);

                // Generate achievements based on stats
                generateAchievements();
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    // Generate achievements based on user stats
    const generateAchievements = () => {
        const achievementsList: Achievement[] = [
            {
                id: '1',
                title: 'البداية',
                description: 'أكمل أول درس',
                icon: <Play className="h-5 w-5" />,
                unlocked: stats.completedLessons >= 1,
                color: 'from-green-500 to-emerald-500'
            },
            {
                id: '2',
                title: 'متعلم نشيط',
                description: 'أكمل 5 دروس',
                icon: <BookOpen className="h-5 w-5" />,
                unlocked: stats.completedLessons >= 5,
                progress: Math.min((stats.completedLessons / 5) * 100, 100),
                color: 'from-blue-500 to-cyan-500'
            },
            {
                id: '3',
                title: 'محترف الدروس',
                description: 'أكمل 20 درس',
                icon: <GraduationCap className="h-5 w-5" />,
                unlocked: stats.completedLessons >= 20,
                progress: Math.min((stats.completedLessons / 20) * 100, 100),
                color: 'from-purple-500 to-violet-500'
            },
            {
                id: '4',
                title: 'خائض الامتحانات',
                description: 'أكمل أول امتحان',
                icon: <FileText className="h-5 w-5" />,
                unlocked: stats.examsTaken >= 1,
                color: 'from-amber-500 to-orange-500'
            },
            {
                id: '5',
                title: 'متفوق',
                description: 'احصل على 80% أو أكثر في امتحان',
                icon: <Star className="h-5 w-5" />,
                unlocked: stats.averageScore >= 80,
                color: 'from-yellow-500 to-amber-500'
            },
            {
                id: '6',
                title: 'سريع النار',
                description: 'حافظ على سلسلة 7 أيام متتالية',
                icon: <Flame className="h-5 w-5" />,
                unlocked: stats.currentStreak >= 7,
                progress: Math.min((stats.currentStreak / 7) * 100, 100),
                color: 'from-red-500 to-rose-500'
            },
            {
                id: '7',
                title: 'مثابر',
                description: 'كن نشطاً لمدة 30 يوم',
                icon: <Zap className="h-5 w-5" />,
                unlocked: stats.activeDays >= 30,
                progress: Math.min((stats.activeDays / 30) * 100, 100),
                color: 'from-indigo-500 to-purple-500'
            },
            {
                id: '8',
                title: 'بطل الامتحانات',
                description: 'انجح في 10 امتحانات',
                icon: <Trophy className="h-5 w-5" />,
                unlocked: stats.passedExams >= 10,
                progress: Math.min((stats.passedExams / 10) * 100, 100),
                color: 'from-fuchsia-500 to-pink-500'
            }
        ];
        setAchievements(achievementsList);
    };

    // Update achievements when stats change
    useEffect(() => {
        if (!isLoading) {
            generateAchievements();
        }
    }, [stats, isLoading]);

    // Handle image upload
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار ملف صورة صالح');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
            return;
        }

        try {
            setIsUploadingImage(true);

            // Create a unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                // Fallback: use a data URL
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    setFormData(prev => ({ ...prev, avatar_url: dataUrl }));
                };
                reader.readAsDataURL(file);
            } else {
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('حدث خطأ أثناء رفع الصورة');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const fetchUserStats = async (userId: string) => {
        try {
            // Fetch completed lessons
            const { data: lessonProgress, error: lessonError } = await supabase
                .from("user_lesson_progress")
                .select("*")
                .eq("user_id", userId);

            // Fetch total lessons count
            const { count: totalLessons } = await supabase
                .from("lessons")
                .select("*", { count: 'exact', head: true })
                .eq("is_published", true);

            // Fetch exam attempts
            const { data: examAttempts, error: examError } = await supabase
                .from("comprehensive_exam_attempts")
                .select("*")
                .eq("student_id", userId);

            // Calculate stats
            const completedLessons = lessonProgress?.filter(p => p.is_completed)?.length || 0;
            const examsTaken = examAttempts?.length || 0;
            const passedExams = examAttempts?.filter(e =>
                e.status === 'completed' || e.status === 'graded'
            )?.length || 0;

            // Calculate total score and average
            let totalScore = 0;
            let averageScore = 0;
            if (examAttempts && examAttempts.length > 0) {
                totalScore = examAttempts.reduce((acc, e) => acc + (e.total_score || 0), 0);
                const avgScores = examAttempts.map(e =>
                    (e.max_score ?? 0) > 0 ? ((e.total_score ?? 0) / e.max_score!) * 100 : 0
                );
                averageScore = avgScores.reduce((a, b) => a + b, 0) / avgScores.length;
            }

            // Calculate active days (unique days with any activity)
            const activityDates = new Set<string>();
            lessonProgress?.forEach(p => {
                if (p.last_accessed_at) {
                    activityDates.add(new Date(p.last_accessed_at).toDateString());
                }
            });
            examAttempts?.forEach(e => {
                if (e.started_at) {
                    activityDates.add(new Date(e.started_at).toDateString());
                }
            });

            // Calculate streak (consecutive days)
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

            setStats({
                completedLessons,
                totalLessons: totalLessons || 0,
                examsTaken,
                passedExams,
                totalScore,
                activeDays: Math.max(activityDates.size, 1),
                currentStreak,
                averageScore: Math.round(averageScore)
            });
        } catch (error) {
            console.error("Error fetching user stats:", error);
        }
    };

    const fetchRecentActivity = async (userId: string) => {
        try {
            const activities: ActivityItem[] = [];

            // Fetch recent lesson progress
            const { data: lessonProgress } = await supabase
                .from("user_lesson_progress")
                .select(`
                    id,
                    lesson_id,
                    is_completed,
                    last_accessed_at,
                    lessons:lesson_id (title, subject_id)
                `)
                .eq("user_id", userId)
                .order("last_accessed_at", { ascending: false })
                .limit(5);

            if (lessonProgress) {
                lessonProgress.forEach((p: any) => {
                    if (p.lessons) {
                        activities.push({
                            id: p.id,
                            type: 'lesson',
                            title: p.lessons.title || 'درس',
                            date: p.last_accessed_at,
                            status: p.is_completed ? 'مكتمل' : 'قيد التقدم'
                        });
                    }
                });
            }

            // Fetch recent exam attempts
            const { data: examAttempts } = await supabase
                .from("comprehensive_exam_attempts")
                .select(`
                    id,
                    exam_id,
                    started_at,
                    total_score,
                    max_score,
                    status,
                    comprehensive_exams:exam_id (exam_title)
                `)
                .eq("student_id", userId)
                .order("started_at", { ascending: false })
                .limit(5);

            if (examAttempts) {
                examAttempts.forEach((e: any) => {
                    const score = e.max_score > 0
                        ? Math.round((e.total_score / e.max_score) * 100)
                        : 0;
                    activities.push({
                        id: e.id,
                        type: 'exam',
                        title: e.comprehensive_exams?.exam_title || 'امتحان',
                        date: e.started_at,
                        score,
                        status: e.status === 'completed' || e.status === 'graded'
                            ? 'مكتمل'
                            : e.status === 'in_progress'
                                ? 'قيد التنفيذ'
                                : e.status
                    });
                });
            }

            // Sort by date
            activities.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setRecentActivity(activities.slice(0, 8));
        } catch (error) {
            console.error("Error fetching recent activity:", error);
        }
    };

    const formatRelativeDate = (dateString: string) => {
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
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            setIsSaving(true);
            await updateUserProfile(user.id, {
                name: formData.name,
                avatar_url: formData.avatar_url,
                bio: formData.bio,
                educational_stage_id: formData.educational_stage_id || null
            });

            // Refresh profile
            const updatedProfile = await getUserProfile(user.id);
            setProfile(updatedProfile);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("حدث خطأ أثناء حفظ البيانات");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    // Skeleton Loading Component
    const SkeletonPulse = ({ className }: { className?: string }) => (
        <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded-lg ${className}`} />
    );

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] pt-4">
                    {/* Decorative Background */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                    </div>

                    <div className="relative max-w-6xl mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Sidebar Skeleton */}
                            <div className="lg:col-span-1">
                                <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-gray-800/60 overflow-hidden shadow-xl">
                                    {/* Cover Skeleton */}
                                    <div className="h-32 bg-gradient-to-br from-violet-400/50 via-purple-400/50 to-fuchsia-400/50 animate-pulse" />

                                    {/* Profile Info Skeleton */}
                                    <div className="relative px-5 pb-5">
                                        {/* Avatar Skeleton */}
                                        <div className="absolute -top-14 right-5">
                                            <div className="w-28 h-28 rounded-3xl bg-white dark:bg-[#1c1c24] p-1.5 shadow-2xl">
                                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="pt-16 space-y-3">
                                            {/* Name Skeleton */}
                                            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                                            {/* Email Skeleton */}
                                            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />

                                            {/* Bio Skeleton */}
                                            <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-2">
                                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </div>

                                            {/* Level Progress Skeleton */}
                                            <div className="mt-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-800/30">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="h-3 w-20 bg-violet-200 dark:bg-violet-800 rounded animate-pulse" />
                                                    <div className="h-3 w-8 bg-violet-200 dark:bg-violet-800 rounded animate-pulse" />
                                                </div>
                                                <div className="h-2 bg-violet-200 dark:bg-violet-900/50 rounded-full overflow-hidden">
                                                    <div className="h-full w-1/2 bg-violet-400/50 rounded-full animate-pulse" />
                                                </div>
                                            </div>

                                            {/* Badges Skeleton */}
                                            <div className="flex gap-2 mt-4">
                                                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                                <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                            </div>

                                            {/* Quick Actions Skeleton */}
                                            <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-gray-800/60 space-y-2">
                                                <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                                                <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                                                <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Skeleton */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Tabs Skeleton */}
                                <div className="flex gap-1 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg overflow-x-auto">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex-1 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                    ))}
                                </div>

                                {/* Stats Grid Skeleton */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-lg"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4 animate-pulse" />
                                            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 animate-pulse" />
                                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        </div>
                                    ))}
                                </div>

                                {/* Progress Summary Skeleton */}
                                <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-5 h-5 bg-violet-200 dark:bg-violet-800 rounded animate-pulse" />
                                        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                                    </div>

                                    <div className="space-y-5">
                                        {/* Progress Bar 1 */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full w-2/3 bg-blue-300/50 dark:bg-blue-700/50 rounded-full animate-pulse" />
                                            </div>
                                        </div>

                                        {/* Progress Bar 2 */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full w-1/2 bg-green-300/50 dark:bg-green-700/50 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Skeleton */}
                                    <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 border border-violet-200/30 dark:border-violet-800/20">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-2xl bg-violet-200 dark:bg-violet-800 mb-4 animate-pulse" />
                                            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 animate-pulse" />
                                            <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                                            <div className="h-10 w-32 bg-violet-200 dark:bg-violet-800 rounded-xl animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return null;
    }

    // Calculate level based on activity
    const userLevel = Math.floor((stats.completedLessons + stats.examsTaken * 2) / 5) + 1;
    const levelProgress = ((stats.completedLessons + stats.examsTaken * 2) % 5) * 20;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] pt-4">

                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                </div>

                {/* Success Toast */}
                <AnimatePresence>
                    {saveSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl shadow-green-500/25"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <span className="font-medium">تم حفظ التغييرات بنجاح</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative max-w-6xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Sidebar - Profile Card */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-gray-800/60 overflow-hidden sticky top-24 shadow-xl shadow-gray-200/50 dark:shadow-black/20"
                            >
                                {/* Cover with Pattern */}
                                <div className="h-32 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-40" />
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent" />

                                    {/* Level Badge */}
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                                        <Crown className="h-3.5 w-3.5" />
                                        <span>المستوى {userLevel}</span>
                                    </div>
                                </div>

                                {/* Avatar */}
                                <div className="relative px-5 pb-5">
                                    <div className="absolute -top-14 right-5">
                                        <div className="relative group">
                                            <div className="w-28 h-28 rounded-3xl bg-white dark:bg-[#1c1c24] p-1.5 shadow-2xl ring-4 ring-white dark:ring-gray-900">
                                                {profile?.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt={profile.name || "User"}
                                                        className="w-full h-full rounded-2xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                                                        <span className="text-4xl font-bold text-white">
                                                            {(profile?.name || user.email || "U")[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {profile?.role === 'admin' && (
                                                <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-white dark:ring-gray-900">
                                                    <Shield className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            {profile?.is_verified && (
                                                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900">
                                                    <CheckCircle className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-16">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {profile?.name || "مستخدم جديد"}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5" />
                                            {user.email}
                                        </p>

                                        {profile?.bio && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                                                {profile.bio}
                                            </p>
                                        )}

                                        {/* Level Progress */}
                                        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-800/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">تقدم المستوى</span>
                                                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{levelProgress}%</span>
                                            </div>
                                            <div className="h-2 bg-violet-200 dark:bg-violet-900/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${levelProgress}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${profile?.role === 'admin'
                                                ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800"
                                                : profile?.role === 'teacher'
                                                    ? "bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800"
                                                    : "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700"
                                                }`}>
                                                {profile?.role === 'admin' ? (
                                                    <><Shield className="h-3 w-3" /> مسؤول</>
                                                ) : profile?.role === 'teacher' ? (
                                                    <><BookOpen className="h-3 w-3" /> معلم</>
                                                ) : (
                                                    <><GraduationCap className="h-3 w-3" /> طالب</>
                                                )}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800">
                                                <Calendar className="h-3 w-3" />
                                                منذ {new Date(profile?.created_at || user.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-gray-800/60 space-y-2">
                                            {/* Teacher Setup Link */}
                                            <Link
                                                href="/profile/teacher-setup"
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30 transition-all text-sm font-medium border border-violet-200/50 dark:border-violet-800/50 group"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <BookOpen className="h-4 w-4" />
                                                    <span>وضع المدرس</span>
                                                </div>
                                                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                            </Link>
                                            <button
                                                onClick={() => setActiveTab('settings')}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium group"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Edit3 className="h-4 w-4" />
                                                    <span>تعديل الملف الشخصي</span>
                                                </div>
                                                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-medium"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <LogOut className="h-4 w-4" />
                                                    <span>تسجيل الخروج</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tabs */}
                            <div className="flex gap-1 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg shadow-gray-200/30 dark:shadow-black/10 overflow-x-auto">
                                {[
                                    { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
                                    { id: 'achievements', label: 'الإنجازات', icon: Trophy },
                                    { id: 'activity', label: 'النشاط', icon: Clock },
                                    { id: 'settings', label: 'الإعدادات', icon: Settings },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            {
                                                label: 'دروس مكتملة',
                                                value: stats.completedLessons,
                                                total: stats.totalLessons,
                                                icon: BookOpen,
                                                gradient: 'from-blue-500 to-cyan-500',
                                                bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                                            },
                                            {
                                                label: 'امتحانات',
                                                value: stats.passedExams,
                                                total: stats.examsTaken,
                                                icon: FileText,
                                                gradient: 'from-green-500 to-emerald-500',
                                                bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                                            },
                                            {
                                                label: 'متوسط النتيجة',
                                                value: `${stats.averageScore}%`,
                                                icon: BarChart3,
                                                gradient: 'from-amber-500 to-orange-500',
                                                bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
                                            },
                                            {
                                                label: 'أيام نشاط',
                                                value: stats.activeDays,
                                                streak: stats.currentStreak,
                                                icon: Zap,
                                                gradient: 'from-violet-500 to-purple-500',
                                                bg: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20'
                                            },
                                        ].map((stat, index) => (
                                            <motion.div
                                                key={stat.label}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-lg`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                                    <stat.icon className="h-6 w-6 text-white" />
                                                </div>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {stat.value}
                                                    {stat.total !== undefined && (
                                                        <span className="text-lg text-gray-400 font-normal">/{stat.total}</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{stat.label}</p>
                                                {stat.streak !== undefined && stat.streak > 0 && (
                                                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-900/80 text-xs font-bold text-violet-600 dark:text-violet-400">
                                                        <Sparkles className="h-3 w-3" />
                                                        {stat.streak} 🔥
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Progress Summary */}
                                    <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-violet-500" />
                                            ملخص التقدم
                                        </h3>

                                        <div className="space-y-5">
                                            {/* Lessons Progress */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                                        الدروس المكتملة
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {stats.completedLessons} / {stats.totalLessons}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: stats.totalLessons > 0 ? `${(stats.completedLessons / stats.totalLessons) * 100}%` : '0%' }}
                                                        transition={{ duration: 1, delay: 0.3 }}
                                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Exams Progress */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-green-500" />
                                                        الامتحانات الناجحة
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {stats.passedExams} / {stats.examsTaken}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: stats.examsTaken > 0 ? `${(stats.passedExams / stats.examsTaken) * 100}%` : '0%' }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Empty State */}
                                        {stats.completedLessons === 0 && stats.examsTaken === 0 && (
                                            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-800/30 text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
                                                    <Play className="h-8 w-8 text-white" />
                                                </div>
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">ابدأ رحلة التعلم!</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                    لم تبدأ أي درس أو امتحان بعد. اختر مادة وابدأ التعلم الآن!
                                                </p>
                                                <Link
                                                    href="/"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    استكشف الدروس
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Achievements Tab */}
                            {activeTab === 'achievements' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Achievement Summary */}
                                    <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Trophy className="h-5 w-5 text-amber-500" />
                                                الإنجازات
                                            </h3>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium">
                                                <Medal className="h-4 w-4" />
                                                {achievements.filter(a => a.unlocked).length} / {achievements.length}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {achievements.map((achievement, index) => (
                                                <motion.div
                                                    key={achievement.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${achievement.unlocked
                                                        ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-lg'
                                                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800/50 opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${achievement.unlocked
                                                            ? `bg-gradient-to-br ${achievement.color} text-white`
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                                            }`}>
                                                            {achievement.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-bold ${achievement.unlocked
                                                                    ? 'text-gray-900 dark:text-white'
                                                                    : 'text-gray-500 dark:text-gray-400'
                                                                    }`}>
                                                                    {achievement.title}
                                                                </h4>
                                                                {achievement.unlocked && (
                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {achievement.description}
                                                            </p>
                                                            {!achievement.unlocked && achievement.progress !== undefined && (
                                                                <div className="mt-2">
                                                                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${achievement.progress}%` }}
                                                                            transition={{ duration: 1, delay: 0.5 }}
                                                                            className={`h-full bg-gradient-to-r ${achievement.color} rounded-full`}
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 mt-1">{Math.round(achievement.progress)}%</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {achievement.unlocked && (
                                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Motivation Message */}
                                        {achievements.filter(a => a.unlocked).length < achievements.length && (
                                            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-800/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                                                        <Gift className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                            استمر في التعلم للحصول على المزيد من الإنجازات!
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            لديك {achievements.length - achievements.filter(a => a.unlocked).length} إنجاز للفتح
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 'activity' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg"
                                >
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-violet-500" />
                                        النشاط الأخير
                                    </h3>

                                    {recentActivity.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentActivity.map((activity, index) => (
                                                <motion.div
                                                    key={activity.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activity.type === 'exam'
                                                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                                        : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                                        } shadow-lg`}>
                                                        {activity.type === 'exam' ? (
                                                            <FileText className="h-5 w-5 text-white" />
                                                        ) : (
                                                            <BookOpen className="h-5 w-5 text-white" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                            {activity.title}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {formatRelativeDate(activity.date)}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activity.status === 'مكتمل'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                                }`}>
                                                                {activity.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {activity.score !== undefined && (
                                                        <div className="text-right">
                                                            <span className={`text-xl font-bold ${activity.score >= 70
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : activity.score >= 50
                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                                }`}>
                                                                {activity.score}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                                <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">لا يوجد نشاط حتى الآن</p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">ابدأ بتصفح الدروس والامتحانات</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Edit Profile */}
                                    <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                            <Edit3 className="h-5 w-5 text-violet-500" />
                                            تعديل الملف الشخصي
                                        </h3>

                                        <div className="space-y-5">
                                            {/* Name */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    الاسم الكامل
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                        className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                                                        placeholder="اسمك الكامل"
                                                    />
                                                </div>
                                            </div>

                                            {/* Bio */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    نبذة عنك
                                                </label>
                                                <textarea
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                                    rows={4}
                                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none text-gray-900 dark:text-white"
                                                    placeholder="اكتب نبذة مختصرة عنك..."
                                                />
                                            </div>

                                            {/* Avatar Upload */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    صورة الملف الشخصي
                                                </label>

                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    {/* Current Avatar Preview */}
                                                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                        {formData.avatar_url ? (
                                                            <img
                                                                src={formData.avatar_url}
                                                                alt="Avatar Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                        {isUploadingImage && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Upload Options */}
                                                    <div className="flex-1 space-y-3">
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={isUploadingImage}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all font-medium disabled:opacity-50"
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                            <span>{isUploadingImage ? 'جاري الرفع...' : 'رفع صورة'}</span>
                                                        </button>

                                                        <div className="relative">
                                                            <div className="absolute inset-0 flex items-center">
                                                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                                            </div>
                                                            <div className="relative flex justify-center text-xs">
                                                                <span className="px-2 bg-white dark:bg-[#1c1c24] text-gray-500">أو</span>
                                                            </div>
                                                        </div>

                                                        <div className="relative">
                                                            <Camera className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <input
                                                                type="url"
                                                                value={formData.avatar_url}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                                                                className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm text-gray-900 dark:text-white"
                                                                placeholder="أدخل رابط الصورة"
                                                                dir="ltr"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-3">الحد الأقصى لحجم الصورة: 5 ميجابايت</p>
                                            </div>

                                            {/* Educational Stage */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    المرحلة التعليمية <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.educational_stage_id}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, educational_stage_id: e.target.value }))}
                                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                                                >
                                                    <option value="">اختر المرحلة التعليمية</option>
                                                    {stages.map((stage) => (
                                                        <option key={stage.id} value={stage.id}>
                                                            {stage.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-2">سيتم عرض دروس هذه المرحلة في الصفحة الرئيسية</p>
                                            </div>

                                            {/* Save Button */}
                                            <div className="flex justify-end pt-4">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                                                >
                                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                                    <span>حفظ التغييرات</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Settings */}
                                    <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                            <Settings className="h-5 w-5 text-gray-500" />
                                            إعدادات الحساب
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        <Mail className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">البريد الإلكتروني</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">لا يمكن تغييره</span>
                                            </div>

                                            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        <Lock className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900 dark:text-white">تغيير كلمة المرور</p>
                                                        <p className="text-sm text-gray-500">آخر تغيير: غير معروف</p>
                                                    </div>
                                                </div>
                                                <ChevronLeft className="h-5 w-5 text-gray-400 group-hover:-translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl border border-red-200 dark:border-red-800/50 p-6">
                                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            منطقة الخطر
                                        </h3>
                                        <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-5">
                                            هذه الإجراءات لا يمكن التراجع عنها. يرجى التأكد قبل المتابعة.
                                        </p>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>تسجيل الخروج من جميع الأجهزة</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
