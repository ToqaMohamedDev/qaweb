"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import {
    ArrowRight, Star, Users, FileText, CheckCircle2, Clock,
    Play, Bell, BellOff, Video, Share2, MoreVertical,
    UserPlus, UserCheck, Home, Compass, PlaySquare, History,
    ListVideo, ThumbsUp, Flag, ChevronDown, Search, Loader2, Flame,
    GraduationCap, BookOpen, Award
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Teacher {
    id: string;
    name: string;
    specialty: string;
    bio: string;
    photoURL: string | null;
    coverImageURL: string | null;
    verified: boolean;
    subscriberCount: number;
    teacherTitle: string | null;
    stats: { exams: number; lessons: number; rating: number };
}

interface Exam {
    id: string;
    title: string;
    description: string;
    duration: number;
    created_at: string;
}

const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)} مليون`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)} ألف`;
    return count.toString();
};

const formatDate = (date: string): string => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "اليوم";
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} أيام`;
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
    if (days < 365) return `منذ ${Math.floor(days / 30)} أشهر`;
    return `منذ ${Math.floor(days / 365)} سنوات`;
};

const handleShare = async (teacher: { name: string; id: string }) => {
    const url = `${window.location.origin}/teachers/${teacher.id}`;
    if (navigator.share) {
        try { await navigator.share({ title: teacher.name, url }); } catch { }
    } else {
        await navigator.clipboard.writeText(url);
        alert('تم نسخ الرابط!');
    }
};

export default function TeacherPage() {
    const params = useParams();
    const teacherId = params.teacherId as string;

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"home" | "exams" | "about">("home");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [teacherId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            const { data: teacherData, error: teacherError } = await supabase
                .from("profiles").select("*").eq("id", teacherId).single();

            if (teacherError || !teacherData) {
                setError("الملف الشخصي غير موجود");
            } else {
                // Get real exams count
                const { count: examsCount } = await supabase
                    .from("exam_templates")
                    .select("*", { count: "exact", head: true })
                    .eq("created_by", teacherId)
                    .eq("is_active", true);

                // Get real subscribers count
                const { count: subscribersCount } = await supabase
                    .from("teacher_subscriptions")
                    .select("*", { count: "exact", head: true })
                    .eq("teacher_id", teacherId);

                setTeacher({
                    id: teacherData.id,
                    name: teacherData.name || "معلم",
                    specialty: teacherData.specialization || "عام",
                    bio: teacherData.bio || "",
                    photoURL: teacherData.avatar_url,
                    coverImageURL: teacherData.cover_image_url,
                    verified: teacherData.is_verified || false,
                    subscriberCount: subscribersCount || 0,
                    teacherTitle: teacherData.teacher_title,
                    stats: { exams: examsCount || 0, lessons: 0, rating: 4.8 }
                });

                const { data: examsData } = await supabase
                    .from("exam_templates")
                    .select("id, title, description, duration_minutes, created_at")
                    .eq("created_by", teacherId).eq("is_active", true)
                    .order("created_at", { ascending: false });

                if (examsData) {
                    setExams(examsData.map(e => ({
                        id: e.id,
                        title: typeof e.title === 'object' ? String((e.title as any).ar || '') : String(e.title || ''),
                        description: typeof e.description === 'object' ? String((e.description as any).ar || '') : String(e.description || ''),
                        duration: e.duration_minutes || 30,
                        created_at: e.created_at
                    })));
                }
            }

            if (user) {
                const { data: subData } = await supabase
                    .from("teacher_subscriptions")
                    .select("notifications_enabled")
                    .eq("user_id", user.id).eq("teacher_id", teacherId).single();
                if (subData) {
                    setIsSubscribed(true);
                    setNotificationsEnabled(subData.notifications_enabled);
                }
            }
        } catch (err) {
            setError("حدث خطأ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!currentUserId) { window.location.href = "/login"; return; }
        const supabase = createClient();
        try {
            if (isSubscribed) {
                await supabase.from("teacher_subscriptions").delete().eq("user_id", currentUserId).eq("teacher_id", teacherId);
                setIsSubscribed(false);
                if (teacher) setTeacher({ ...teacher, subscriberCount: Math.max(0, teacher.subscriberCount - 1) });
            } else {
                await supabase.from("teacher_subscriptions").insert({ user_id: currentUserId, teacher_id: teacherId });
                setIsSubscribed(true);
                if (teacher) setTeacher({ ...teacher, subscriberCount: teacher.subscriberCount + 1 });
            }
        } catch { }
    };

    const handleToggleNotifications = async () => {
        if (!currentUserId || !isSubscribed) return;
        const supabase = createClient();
        const newValue = !notificationsEnabled;
        await supabase.from("teacher_subscriptions").update({ notifications_enabled: newValue })
            .eq("user_id", currentUserId).eq("teacher_id", teacherId);
        setNotificationsEnabled(newValue);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#121218] transition-colors duration-300" dir="rtl">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-[#2e2e3a]" />
                        <div className="absolute inset-0">
                            <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <GraduationCap className="h-8 w-8 text-violet-500" />
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-6 text-lg font-medium">جاري تحميل الملف الشخصي...</p>
                </div>
            </div>
        );
    }

    if (error || !teacher) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#121218] transition-colors duration-300" dir="rtl">
                <Navbar />
                <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1c1c24] dark:to-[#252530] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Search className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{error || "الملف الشخصي غير موجود"}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">عذراً، لم نتمكن من العثور على هذا المعلم</p>
                    <Link
                        href="/teachers"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors shadow-lg shadow-violet-500/20"
                    >
                        <ArrowRight className="h-4 w-4" />
                        العودة للتصفح
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#121218] transition-colors duration-300" dir="rtl">
            <Navbar />

            {/* Simple Header Bar */}
            <div className="h-[60px] sm:h-[80px] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-800 dark:via-purple-900 dark:to-indigo-900" />

            {/* Profile Header */}
            <div className="relative bg-white dark:bg-[#121218]">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
                        {/* Avatar */}
                        <div className="shrink-0 -mt-12 sm:-mt-14 relative z-10">
                            <div className="relative">
                                {teacher.photoURL ? (
                                    <img
                                        src={teacher.photoURL}
                                        alt=""
                                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-[#121218] shadow-xl"
                                    />
                                ) : (
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-white dark:border-[#121218] shadow-xl">
                                        {teacher.name.charAt(0)}
                                    </div>
                                )}
                                {teacher.verified && (
                                    <div className="absolute bottom-1 right-1 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#121218] shadow-lg">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-0 sm:pt-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1">
                                    {/* Name & Handle */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                            {teacher.name}
                                        </h1>
                                        {teacher.verified && (
                                            <CheckCircle2 className="h-5 w-5 text-violet-500" />
                                        )}
                                    </div>

                                    {/* Stats - Inline */}
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-4 w-4 text-violet-500" />
                                            <strong className="text-gray-900 dark:text-white">{formatCount(teacher.subscriberCount)}</strong>
                                            مشترك
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-4 w-4 text-amber-500" />
                                            <strong className="text-gray-900 dark:text-white">{teacher.stats.exams}</strong>
                                            امتحان
                                        </span>
                                        {teacher.specialty && (
                                            <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                                                <BookOpen className="h-4 w-4" />
                                                {teacher.specialty}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {isSubscribed ? (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleToggleNotifications}
                                                className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 border ${notificationsEnabled
                                                    ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/30 text-violet-600 dark:text-violet-400"
                                                    : "bg-gray-50 dark:bg-[#1c1c24] border-gray-200 dark:border-[#2e2e3a] text-gray-400 dark:text-gray-500"
                                                    }`}
                                            >
                                                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSubscribe}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-[#1c1c24] hover:bg-gray-200 dark:hover:bg-[#252530] text-gray-900 dark:text-white rounded-full text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-[#2e2e3a]"
                                            >
                                                <UserCheck className="h-4 w-4 text-green-500" />
                                                متابَع
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            </motion.button>
                                        </>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSubscribe}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-lg shadow-violet-500/25"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            متابعة
                                        </motion.button>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleShare(teacher)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-[#1c1c24] hover:bg-gray-200 dark:hover:bg-[#252530] text-gray-700 dark:text-white rounded-full text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-[#2e2e3a]"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        مشاركة
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 border-b border-gray-200 dark:border-[#2e2e3a] overflow-x-auto scrollbar-hide">
                        <TabButton active={activeTab === "home"} onClick={() => setActiveTab("home")} label="الرئيسية" icon={Home} />
                        <TabButton active={activeTab === "exams"} onClick={() => setActiveTab("exams")} label="الامتحانات" icon={FileText} />
                        <TabButton active={activeTab === "about"} onClick={() => setActiveTab("about")} label="حول" icon={Users} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-gray-50 dark:bg-[#0f0f14] min-h-[400px]">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
                    <AnimatePresence mode="wait">
                        {activeTab === "home" && (
                            <motion.div
                                key="home"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Featured Section */}
                                {exams.length > 0 && (
                                    <div className="mb-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 dark:from-violet-500/10 dark:to-purple-500/10">
                                                <Flame className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">أحدث الامتحانات</h2>
                                            <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-semibold">{Math.min(exams.length, 4)}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                            {exams.slice(0, 4).map((exam, i) => (
                                                <VideoCard key={exam.id} exam={exam} teacher={teacher} index={i} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* All Exams */}
                                {exams.length > 4 && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c24]">
                                                <FileText className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">جميع الامتحانات</h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                            {exams.slice(4).map((exam, i) => (
                                                <VideoCard key={exam.id} exam={exam} teacher={teacher} index={i} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {exams.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-20"
                                    >
                                        <div className="relative inline-block">
                                            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1c1c24] dark:to-[#252530] flex items-center justify-center shadow-inner">
                                                <Video className="h-14 w-14 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-violet-500/30 rounded-full animate-ping" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">لا يوجد محتوى بعد</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">هذا المعلم لم ينشر أي امتحانات حتى الآن. تابعه ليصلك إشعار عند إضافة محتوى جديد!</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === "exams" && (
                            <motion.div
                                key="exams"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {exams.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-20"
                                    >
                                        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1c1c24] dark:to-[#252530] flex items-center justify-center shadow-inner">
                                            <FileText className="h-14 w-14 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">لا توجد امتحانات</h3>
                                        <p className="text-gray-500 dark:text-gray-400">لم يتم نشر أي امتحانات بعد</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c24]">
                                                    <FileText className="h-5 w-5 text-amber-500" />
                                                </div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">جميع الامتحانات</h2>
                                                <span className="px-2.5 py-1 bg-gray-100 dark:bg-[#1c1c24] rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300">{exams.length}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                            {exams.map((exam, i) => (
                                                <VideoCard key={exam.id} exam={exam} teacher={teacher} index={i} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {activeTab === "about" && (
                            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="max-w-3xl">
                                    {/* Description */}
                                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-100 dark:border-[#2e2e3a] mb-6">
                                        <h2 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-violet-500" />
                                            الوصف
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {teacher.bio || "لا يوجد وصف متاح."}
                                        </p>
                                    </div>

                                    {/* Stats Card */}
                                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-100 dark:border-[#2e2e3a] mb-6">
                                        <h2 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                                            <Award className="h-5 w-5 text-amber-500" />
                                            الإحصائيات
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                                                <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCount(teacher.subscriberCount)}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">مشترك</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                                <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.stats.exams}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">امتحان</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button
                                            onClick={() => handleShare(teacher)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252530] rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <Share2 className="h-4 w-4" />
                                            مشاركة الملف الشخصي
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252530] rounded-xl text-sm font-medium transition-colors">
                                            <Flag className="h-4 w-4" />
                                            الإبلاغ
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon?: any }) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 ${active
                ? "text-violet-600 dark:text-violet-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
        >
            {Icon && <Icon className={`h-4 w-4 ${active ? "text-violet-500" : ""}`} />}
            {label}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
        </button>
    );
}

function VideoCard({ exam, teacher, index }: { exam: Exam; teacher: Teacher; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ y: -4 }}
            className="group"
        >
            <Link href={`/arabic/exam/${exam.id}`} className="block">
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#2e2e3a] hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-300 shadow-sm hover:shadow-lg dark:shadow-none">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 dark:from-violet-950/50 dark:via-purple-950/30 dark:to-indigo-950/50 flex items-center justify-center">
                            {/* Pattern */}
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
                            }} />
                            <FileText className="h-12 w-12 text-violet-400/40 dark:text-violet-300/20" />
                        </div>

                        {/* Hover Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
                            <div className="w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="h-6 w-6 text-violet-600 mr-[-2px]" fill="currentColor" />
                            </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {exam.duration} دقيقة
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                        <h3 className="text-gray-900 dark:text-white font-semibold text-sm leading-5 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-3">
                            {exam.title || "امتحان"}
                        </h3>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {teacher.photoURL ? (
                                    <img src={teacher.photoURL} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#2e2e3a]" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 dark:ring-[#2e2e3a]">
                                        {teacher.name.charAt(0)}
                                    </div>
                                )}
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{teacher.name}</span>
                            </div>
                            <span className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(exam.created_at)}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
