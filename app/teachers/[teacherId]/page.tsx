"use client";

// =============================================
// Teacher Profile Page - صفحة الملف الشخصي للمعلم
// تصميم محسن ومتجدد
// =============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Loader2,
    FileText,
    Users,
    GraduationCap,
    CheckCircle2,
    Star,
    Eye,
    Calendar,
    BookOpen,
    Award,
    Clock,
    Play,
    Share2,
    Bell,
    BellOff,
    UserPlus,
    UserCheck,
    ChevronDown,
    Globe,
    Phone,
    TrendingUp,
    X,
} from "lucide-react";

// Components
import { Navbar } from "@/components/Navbar";
import { Avatar } from "@/components/common";
import TeacherRating from "@/components/teachers/TeacherRating";

// Hooks
import { useSubscriptions } from "@/hooks/useSubscriptions";

// Utils
import { formatCount, formatRelativeDate, formatExamDate } from "@/lib/utils/formatters";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TeacherProfile {
    id: string;
    name: string;
    specialty: string;
    bio: string;
    photoURL: string | null;
    coverImageURL: string | null;
    verified: boolean;
    subscriberCount: number;
    teacherTitle: string | null;
    stats: {
        exams: number;
        lessons: number;
        rating: number;
        views: number;
    };
    yearsOfExperience: number;
    education: string | null;
    teachingStyle: string | null;
    subjects: string[];
    stages: string[];
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    socialLinks: {
        tiktok?: string;
        youtube?: string;
        facebook?: string;
        instagram?: string;
    };
    ratingCount: number;
}

interface TeacherExam {
    id: string;
    title: string;
    description: string;
    duration: number;
    created_at: string;
    type: string;
    isPublished: boolean;
    questionsCount?: number;
    language?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const handleShare = async (teacher: { name: string; id: string }) => {
    const url = `${window.location.origin}/teachers/${teacher.id}`;
    if (navigator.share) {
        try {
            await navigator.share({ title: teacher.name, url });
        } catch {
            /* ignore */
        }
    } else {
        await navigator.clipboard.writeText(url);
        alert("تم نسخ الرابط!");
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// LOADING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TeacherProfileLoading() {
    return (
        <div
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0f1a] dark:to-[#0f172a]"
            dir="rtl"
        >
            <Navbar />

            {/* Cover Skeleton */}
            <div className="h-48 sm:h-56 md:h-64 skeleton-shimmer" />

            {/* Profile Section Skeleton */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Avatar Skeleton */}
                        <div className="w-28 h-28 rounded-full skeleton-shimmer ring-4 ring-white dark:ring-slate-900" />

                        {/* Info Skeleton */}
                        <div className="flex-1 text-center sm:text-right space-y-3">
                            <div className="h-7 w-48 mx-auto sm:mx-0 rounded skeleton-shimmer" />
                            <div className="h-4 w-32 mx-auto sm:mx-0 rounded skeleton-shimmer" />
                            <div className="h-4 w-64 mx-auto sm:mx-0 rounded skeleton-shimmer" />
                        </div>

                        {/* Actions Skeleton */}
                        <div className="flex gap-3">
                            <div className="h-10 w-28 rounded-xl skeleton-shimmer" />
                            <div className="h-10 w-10 rounded-xl skeleton-shimmer" />
                        </div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="text-center">
                                <div className="h-6 w-12 mx-auto rounded skeleton-shimmer mb-2" />
                                <div className="h-4 w-16 mx-auto rounded skeleton-shimmer" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="mt-6 flex gap-4">
                    <div className="h-10 w-24 rounded-xl skeleton-shimmer" />
                    <div className="h-10 w-24 rounded-xl skeleton-shimmer" />
                </div>

                {/* Content Skeleton */}
                <div className="mt-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                        <div className="h-6 w-32 rounded skeleton-shimmer" />
                        <div className="h-6 w-8 rounded-full skeleton-shimmer" />
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                                <div className="flex justify-end mb-3">
                                    <div className="h-7 w-24 rounded-lg skeleton-shimmer" />
                                </div>
                                <div className="space-y-2 mb-5">
                                    <div className="h-5 w-3/4 mx-auto rounded skeleton-shimmer" />
                                    <div className="h-5 w-1/2 mx-auto rounded skeleton-shimmer" />
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-5">
                                    <div className="flex items-center justify-center gap-8">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full skeleton-shimmer" />
                                            <div className="h-4 w-16 rounded skeleton-shimmer" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full skeleton-shimmer" />
                                            <div className="h-4 w-16 rounded skeleton-shimmer" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="h-10 w-32 rounded-xl skeleton-shimmer" />
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-16 rounded skeleton-shimmer" />
                                        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TeacherProfileError({ message }: { message: string }) {
    return (
        <div
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[[#0a0f1a]] dark:to-[[#0f172a]]"
            dir="rtl"
        >
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {message}
                </h1>
                <Link
                    href="/teachers"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
                >
                    <ArrowRight className="h-4 w-4" />
                    العودة للتصفح
                </Link>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TeacherPage() {
    const params = useParams();
    const teacherId = params.teacherId as string;

    // State
    const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
    const [exams, setExams] = useState<TeacherExam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"exams" | "about">("exams");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Unified subscription hook - يستخدم نفس النظام في كل الصفحات
    const {
        isSubscribed: checkIsSubscribed,
        toggle: toggleSubscription,
        subscribingTo,
    } = useSubscriptions(currentUserId);

    // Check if subscribed to this specific teacher
    const isSubscribed = checkIsSubscribed(teacherId);

    // ═══════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => {
        fetchData();
    }, [teacherId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch teacher profile via API
            const profileRes = await fetch(`/api/public/data?entity=teacher_profile&id=${teacherId}`);
            const profileResult = await profileRes.json();

            if (!profileResult.success || !profileResult.data?.[0]) {
                setError("الملف الشخصي غير موجود");
                return;
            }

            const teacherData = profileResult.data[0];

            // Fetch teacher exams via API
            const examsRes = await fetch(`/api/public/data?entity=teacher_exams&teacherId=${teacherId}`);
            const examsResult = await examsRes.json();
            const examsData = examsResult.data || [];

            // Format teacher profile
            setTeacher({
                id: teacherData.id,
                name: teacherData.name || "معلم",
                specialty: teacherData.specialization || teacherData.bio || "",
                bio: teacherData.bio || "",
                photoURL: teacherData.avatar_url,
                coverImageURL: teacherData.cover_image_url,
                verified: teacherData.is_verified || false,
                subscriberCount: teacherData.subscriber_count || 0,
                teacherTitle: teacherData.teacher_title,
                stats: {
                    exams: teacherData.examsCount || examsData.length,
                    lessons: 0,
                    rating: teacherData.rating_average || 0,
                    views: 0,
                },
                yearsOfExperience: teacherData.years_of_experience || 0,
                education: teacherData.education || null,
                teachingStyle: teacherData.teaching_style || null,
                subjects: teacherData.subjects || [],
                stages: teacherData.stages || [],
                phone: teacherData.phone || null,
                whatsapp: teacherData.whatsapp || null,
                website: teacherData.website || null,
                socialLinks: teacherData.social_links || {},
                ratingCount: teacherData.rating_count || 0,
            });

            setExams(examsData);

        } catch (err) {
            console.error("Error fetching teacher data:", err);
            setError("حدث خطأ أثناء تحميل البيانات");
        } finally {
            setIsLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    // Unified subscribe handler using the centralized hook
    const handleSubscribe = useCallback(async () => {
        if (!currentUserId) {
            window.location.href = "/login";
            return;
        }

        // Use the centralized toggle from useSubscriptions hook
        const result = await toggleSubscription(teacherId);

        // Update local subscriber count based on result
        if (result.success && result.newCount !== undefined && teacher) {
            setTeacher(prev => prev ? {
                ...prev,
                subscriberCount: result.newCount!,
            } : null);
        }
    }, [currentUserId, teacherId, toggleSubscription, teacher]);

    const handleToggleNotifications = async () => {
        if (!currentUserId || !isSubscribed) return;

        // TODO: Enable after adding notifications_enabled column to teacher_subscriptions
        // const supabase = createClient();
        // const newValue = !notificationsEnabled;
        // await supabase
        //     .from("teacher_subscriptions")
        //     .update({ notifications_enabled: newValue })
        //     .eq("user_id", currentUserId)
        //     .eq("teacher_id", teacherId);
        // setNotificationsEnabled(newValue);

        // For now, just toggle local state
        setNotificationsEnabled(!notificationsEnabled);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading) return <TeacherProfileLoading />;
    if (error || !teacher)
        return <TeacherProfileError message={error || "الملف الشخصي غير موجود"} />;

    const isOwnProfile = currentUserId === teacherId;
    const hasSocials = teacher.phone || teacher.whatsapp || teacher.website || Object.values(teacher.socialLinks || {}).some((v) => v);

    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a]"
            dir="rtl"
        >
            <Navbar />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* COMPACT PROFILE HEADER                                          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="relative">
                <div className="max-w-4xl mx-auto">
                    {/* Cover Image - Clickable */}
                    <div
                        className="relative w-full overflow-hidden bg-gray-200 dark:bg-slate-800 cursor-pointer group"
                        style={{ aspectRatio: '3/1', maxHeight: '280px' }}
                        onClick={() => teacher.coverImageURL && setLightboxImage(teacher.coverImageURL)}
                    >
                        {teacher.coverImageURL ? (
                            <>
                                <img
                                    src={teacher.coverImageURL}
                                    alt="صورة الغلاف"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-800 dark:via-purple-900 dark:to-indigo-950">
                                <div className="absolute inset-0">
                                    <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
                                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Info - Compact Layout */}
                    <div className="relative px-4 sm:px-6 py-4 bg-white/80 dark:bg-transparent backdrop-blur-sm">
                        <div className="flex gap-4">
                            {/* Avatar - أصغر وعلى الجانب - Clickable */}
                            <div className="shrink-0 -mt-12">
                                <div
                                    className="relative cursor-pointer group"
                                    onClick={() => teacher.photoURL && setLightboxImage(teacher.photoURL)}
                                >
                                    <div className="rounded-full p-1 bg-white dark:bg-[#0a0f1a] shadow-lg">
                                        <div className="relative overflow-hidden rounded-full">
                                            <Avatar
                                                src={teacher.photoURL}
                                                name={teacher.name}
                                                size="xl"
                                                containerClassName="!w-20 !h-20 sm:!w-24 sm:!h-24"
                                                customGradient="from-violet-500 via-purple-600 to-indigo-700"
                                            />
                                            {teacher.photoURL && (
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-full">
                                                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {teacher.verified && (
                                        <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0f1a] shadow">
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Block */}
                            <div className="flex-1 min-w-0 pt-1">
                                {/* Row 1: Name + Actions */}
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                                {teacher.name}
                                            </h1>
                                            {teacher.verified && (
                                                <CheckCircle2 className="h-5 w-5 text-violet-500 fill-violet-500 shrink-0" />
                                            )}
                                        </div>
                                        {(teacher.teacherTitle || teacher.specialty) && (
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                {teacher.teacherTitle || teacher.specialty}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {!isOwnProfile && (
                                            <motion.button
                                                whileHover={{ scale: subscribingTo.has(teacherId) ? 1 : 1.03 }}
                                                whileTap={{ scale: subscribingTo.has(teacherId) ? 1 : 0.97 }}
                                                onClick={handleSubscribe}
                                                disabled={subscribingTo.has(teacherId)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${subscribingTo.has(teacherId)
                                                    ? "bg-gray-200 dark:bg-slate-800 text-gray-500 cursor-wait"
                                                    : isSubscribed
                                                        ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
                                                        : "bg-violet-600 text-white hover:bg-violet-700"
                                                    }`}
                                            >
                                                {subscribingTo.has(teacherId) ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : isSubscribed ? (
                                                    <>
                                                        <UserCheck className="h-4 w-4" />
                                                        <span className="hidden sm:inline">متابَع</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="h-4 w-4" />
                                                        <span>متابعة</span>
                                                    </>
                                                )}
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleShare(teacher)}
                                            className="p-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Row 2: Stats + Social - على سطر واحد */}
                                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <FileText className="h-4 w-4" />
                                            <span className="font-bold text-gray-900 dark:text-white">{teacher.stats.exams}</span>
                                            <span>امتحان</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Users className="h-4 w-4" />
                                            <span className="font-bold text-gray-900 dark:text-white">{formatCount(teacher.subscriberCount)}</span>
                                            <span>متابع</span>
                                        </div>
                                        {teacher.stats.rating > 0 && (
                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                <span className="font-bold text-gray-900 dark:text-white">{teacher.stats.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Social Icons - Compact */}
                                    {hasSocials && (
                                        <div className="flex items-center gap-1.5">
                                            {teacher.whatsapp && (
                                                <a
                                                    href={`https://wa.me/${teacher.whatsapp.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                    title="واتساب"
                                                >
                                                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {teacher.phone && (
                                                <a href={`tel:${teacher.phone}`} className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors" title="اتصال">
                                                    <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                </a>
                                            )}
                                            {teacher.website && (
                                                <a href={teacher.website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" title="الموقع">
                                                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </a>
                                            )}
                                            {teacher.socialLinks?.youtube && (
                                                <a href={teacher.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" title="يوتيوب">
                                                    <svg className="h-4 w-4 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {teacher.socialLinks?.facebook && (
                                                <a href={teacher.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors" title="فيسبوك">
                                                    <svg className="h-4 w-4 text-blue-700 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {teacher.socialLinks?.tiktok && (
                                                <a href={teacher.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="تيك توك">
                                                    <svg className="h-4 w-4 text-gray-800 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                                    </svg>
                                                </a>
                                            )}
                                            {teacher.socialLinks?.instagram && (
                                                <a href={teacher.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors" title="انستجرام">
                                                    <svg className="h-4 w-4 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Row 3: Bio - مختصر */}
                                {teacher.bio && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                                        {teacher.bio}
                                    </p>
                                )}

                                {/* Row 4: Tags - صغيرة */}
                                {(teacher.subjects?.length > 0 || teacher.stages?.length > 0) && (
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        {teacher.subjects?.slice(0, 2).map((subject, i) => (
                                            <span key={`subject-${i}`} className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs">
                                                {subject}
                                            </span>
                                        ))}
                                        {teacher.stages?.slice(0, 3).map((stage, i) => (
                                            <span key={`stage-${i}`} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                                {stage}
                                            </span>
                                        ))}
                                        {(teacher.stages?.length > 3 || teacher.subjects?.length > 2) && (
                                            <span className="text-xs text-gray-500">+{(teacher.stages?.length || 0) - 3 + (teacher.subjects?.length || 0) - 2}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exams Section - مباشرة */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <ExamsSection exams={exams} teacher={teacher} />
            </div>

            {/* Rating Section - قسم التقييمات */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
                <TeacherRating
                    teacherId={teacherId}
                    teacherName={teacher.name}
                    initialRating={teacher.stats.rating}
                    initialRatingCount={teacher.ratingCount}
                    currentUserId={currentUserId}
                    isOwnProfile={isOwnProfile}
                    onRatingChange={(newAverage, newCount) => {
                        setTeacher(prev => prev ? {
                            ...prev,
                            stats: { ...prev.stats, rating: newAverage },
                            ratingCount: newCount,
                        } : null);
                    }}
                />
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setLightboxImage(null)}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            onClick={() => setLightboxImage(null)}
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Image Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="relative max-w-5xl max-h-[90vh] w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={lightboxImage}
                                alt="صورة مكبرة"
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TWITTER-STYLE TAB BUTTON
// ═══════════════════════════════════════════════════════════════════════════

function TabButtonTwitter({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative flex-1 py-4 text-sm font-bold transition-colors hover:bg-gray-100 dark:hover:bg-slate-900 ${active
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
                }`}
        >
            {label}
            {/* Active indicator - خط تحت التاب النشط */}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-violet-500 rounded-full"
                />
            )}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function ExamCardSkeleton() {
    return (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            {/* Badge skeleton */}
            <div className="flex justify-end mb-3">
                <div className="h-7 w-24 rounded-lg skeleton-shimmer" />
            </div>

            {/* Title skeleton */}
            <div className="space-y-2 mb-5">
                <div className="h-5 w-3/4 mx-auto rounded skeleton-shimmer" />
                <div className="h-5 w-1/2 mx-auto rounded skeleton-shimmer" />
            </div>

            {/* Stats box skeleton */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full skeleton-shimmer" />
                        <div className="h-4 w-16 rounded skeleton-shimmer" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full skeleton-shimmer" />
                        <div className="h-4 w-16 rounded skeleton-shimmer" />
                    </div>
                </div>
            </div>

            {/* Footer skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-10 w-32 rounded-xl skeleton-shimmer" />
                <div className="flex items-center gap-2">
                    <div className="h-4 w-16 rounded skeleton-shimmer" />
                    <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                </div>
            </div>
        </div>
    );
}

function ExamsSection({ exams, teacher, isLoading = false }: { exams: TeacherExam[]; teacher: TeacherProfile; isLoading?: boolean }) {
    // Show skeletons while loading
    if (isLoading) {
        return (
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                            <FileText className="h-5 w-5 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            جميع الامتحانات
                        </h2>
                        <div className="h-6 w-8 rounded-full skeleton-shimmer" />
                    </div>
                </div>

                {/* Skeleton Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <ExamCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (exams.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
            >
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner">
                    <FileText className="h-14 w-14 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    لا توجد امتحانات
                </h3>
                <p className="text-gray-500 dark:text-gray-400">لم يتم نشر أي امتحانات بعد</p>
            </motion.div>
        );
    }

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                        <FileText className="h-5 w-5 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        جميع الامتحانات
                    </h2>
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-sm font-bold text-amber-600 dark:text-amber-400">
                        {exams.length}
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exams.map((exam, i) => (
                    <ExamCard key={exam.id} exam={exam} teacher={teacher} index={i} />
                ))}
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAM CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ExamCard({
    exam,
    index,
}: {
    exam: TeacherExam;
    teacher: TeacherProfile;
    index: number;
}) {
    const getExamLink = () => {
        if (exam.type === "english_comprehensive_exam" || exam.language === "english") {
            return `/english/teacher-exam/${exam.id}`;
        }
        return `/arabic/teacher-exam/${exam.id}`;
    };

    const getExamTypeLabel = () => {
        switch (exam.type) {
            case 'quiz': return 'اختبار قصير';
            case 'midterm': return 'اختبار نصفي';
            case 'final': return 'اختبار نهائي';
            case 'practice': return 'تدريب';
            case 'english_comprehensive_exam': return 'Exam';
            default: return 'امتحان';
        }
    };

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            className="group"
        >
            <Link href={getExamLink()} className="block">
                {/* Card - Light & Dark Mode Support */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-transparent dark:p-[1px] dark:bg-gradient-to-br dark:from-cyan-400/30 dark:via-purple-500/20 dark:to-fuchsia-500/30 bg-white dark:bg-transparent shadow-lg dark:shadow-none hover:shadow-xl transition-all duration-300">

                    {/* Inner Container */}
                    <div className="relative rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/95 dark:to-slate-900/90 dark:backdrop-blur-xl p-5 overflow-hidden">

                        {/* Dark mode decorative effects */}
                        <div className="hidden dark:block absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                        <div className="hidden dark:block absolute bottom-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

                        {/* Content */}
                        <div className="relative z-10">


                            {/* Title - Centered */}
                            <h3 className="text-gray-900 dark:text-white font-bold text-lg text-center leading-relaxed line-clamp-2 mb-5">
                                {exam.title}
                            </h3>

                            {/* Stats Grid - More Spacious */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                {/* Duration */}
                                <div className="bg-gray-50 dark:bg-white/10 rounded-xl p-3 text-center border border-gray-100 dark:border-white/10">
                                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{exam.duration || '—'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">دقيقة</p>
                                </div>

                                {/* Date */}
                                <div className="bg-gray-50 dark:bg-white/10 rounded-xl p-3 text-center border border-gray-100 dark:border-white/10">
                                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-sm">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatExamDate(exam.created_at)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ النشر</p>
                                </div>
                            </div>

                            {/* Start Button - Full Width */}
                            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300">
                                <GraduationCap className="h-5 w-5" />
                                <span>ابدأ الامتحان</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT SECTION
// ═══════════════════════════════════════════════════════════════════════════

function AboutSection({ teacher }: { teacher: TeacherProfile }) {
    const hasSocials =
        teacher.phone || teacher.website || Object.values(teacher.socialLinks || {}).some((v) => v);

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Description */}
            <motion.div
                variants={fadeInUp}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-700"
            >
                <h2 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet-500" />
                    الوصف
                </h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {teacher.bio || "لا يوجد وصف متاح."}
                </p>
            </motion.div>

            {/* Professional Info */}
            <motion.div
                variants={fadeInUp}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-700"
            >
                <h2 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    المعلومات المهنية
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teacher.teacherTitle && (
                        <InfoCard icon={Award} label="اللقب" value={teacher.teacherTitle} />
                    )}
                    {teacher.yearsOfExperience > 0 && (
                        <InfoCard
                            icon={TrendingUp}
                            label="الخبرة"
                            value={`${teacher.yearsOfExperience} سنة`}
                        />
                    )}
                    {teacher.education && (
                        <InfoCard
                            icon={GraduationCap}
                            label="المؤهل"
                            value={teacher.education}
                            fullWidth
                        />
                    )}
                    {teacher.teachingStyle && (
                        <InfoCard
                            icon={BookOpen}
                            label="أسلوب التدريس"
                            value={teacher.teachingStyle}
                            fullWidth
                        />
                    )}
                </div>
            </motion.div>

            {/* Contact */}
            {hasSocials && (
                <motion.div
                    variants={fadeInUp}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-700"
                >
                    <h2 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-cyan-500" />
                        التواصل
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {teacher.phone && (
                            <a
                                href={`tel:${teacher.phone}`}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Phone className="h-5 w-5 text-green-500" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                    {teacher.phone}
                                </span>
                            </a>
                        )}
                        {teacher.website && (
                            <a
                                href={teacher.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Globe className="h-5 w-5 text-blue-500" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    الموقع الإلكتروني
                                </span>
                            </a>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// INFO CARD HELPER
// ═══════════════════════════════════════════════════════════════════════════

function InfoCard({
    icon: Icon,
    label,
    value,
    fullWidth = false,
}: {
    icon: any;
    label: string;
    value: string;
    fullWidth?: boolean;
}) {
    return (
        <div
            className={`p-4 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-start gap-3 ${fullWidth ? "col-span-full" : ""
                }`}
        >
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-violet-500" />
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                <p className="font-medium text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
