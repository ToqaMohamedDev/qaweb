"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    ArrowRight, Star, Users, FileText, CheckCircle2, Clock, Play,
    BookOpen, Trophy, Heart, Share2, MessageSquare, ChevronLeft,
    Loader2, Bell, BellOff, Video, Grid3X3, MoreVertical, Flag,
    UserPlus, UserCheck, Home, Compass, Flame, Settings, HelpCircle,
    ChevronDown, Zap, Sparkles, AlertCircle
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
    yearsOfExperience: number;
    education: string | null;
    website: string | null;
    teachingStyle: string | null;
    stats: { exams: number; lessons: number; students: number; rating: number };
}

interface Exam {
    id: string;
    title: string;
    description: string;
    questions_count: number;
    duration: number;
    created_at: string;
}

interface SubscribedTeacher {
    id: string;
    name: string;
    photoURL: string | null;
}

const formatSubscribers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
};

const handleShare = async (teacher: { name: string; id: string }) => {
    const url = `${window.location.origin}/teachers/${teacher.id}`;
    const title = `معلم: ${teacher.name}`;

    if (navigator.share) {
        try {
            await navigator.share({ title, url });
        } catch (err) {
            // User cancelled
        }
    } else {
        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(url);
            alert('تم نسخ الرابط!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
};

export default function TeacherPage() {
    const params = useParams();
    const teacherId = params.teacherId as string;

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [exams, setExams] = useState<Exam[]>([]);
    const [subscribedTeachers, setSubscribedTeachers] = useState<SubscribedTeacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"exams" | "about">("exams");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [teacherId]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // جلب بيانات المعلم من Supabase فقط
            const { data: teacherData, error: teacherError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", teacherId)
                .single();

            if (teacherError) {
                console.error("Teacher error:", teacherError);
                setError("لم يتم العثور على المعلم");
                setTeacher(null);
            } else if (!teacherData) {
                setError("المعلم غير موجود");
                setTeacher(null);
            } else {
                // جلب عدد الامتحانات والدروس
                const { count: examsCount } = await supabase
                    .from("exam_templates")
                    .select("*", { count: "exact", head: true })
                    .eq("created_by", teacherId);

                const { count: lessonsCount } = await supabase
                    .from("lessons")
                    .select("*", { count: "exact", head: true });

                setTeacher({
                    id: teacherData.id,
                    name: teacherData.name || "معلم",
                    specialty: teacherData.specialization || "عام",
                    bio: teacherData.bio || "",
                    photoURL: teacherData.avatar_url,
                    coverImageURL: teacherData.cover_image_url || null,
                    verified: teacherData.is_verified || false,
                    subscriberCount: teacherData.subscriber_count || 0,
                    teacherTitle: teacherData.teacher_title,
                    yearsOfExperience: teacherData.years_of_experience || 0,
                    education: teacherData.education,
                    website: teacherData.website,
                    teachingStyle: teacherData.teaching_style,
                    stats: {
                        exams: examsCount || 0,
                        lessons: lessonsCount || 0,
                        students: teacherData.subscriber_count || 0,
                        rating: 4.8
                    }
                });

                // جلب امتحانات المعلم
                const { data: examsData, error: examsError } = await supabase
                    .from("exam_templates")
                    .select("id, title, description, duration_minutes, created_at")
                    .eq("created_by", teacherId)
                    .eq("is_active", true)
                    .order("created_at", { ascending: false });

                if (!examsError && examsData) {
                    setExams(examsData.map(e => {
                        // Handle title that might be JSON or string
                        let title = '';
                        if (typeof e.title === 'object' && e.title !== null) {
                            title = String((e.title as any).ar || (e.title as any).en || '');
                        } else {
                            title = String(e.title || '');
                        }

                        let description = '';
                        if (typeof e.description === 'object' && e.description !== null) {
                            description = String((e.description as any).ar || (e.description as any).en || '');
                        } else {
                            description = String(e.description || '');
                        }

                        return {
                            id: e.id,
                            title,
                            description,
                            questions_count: 0,
                            duration: e.duration_minutes || 30,
                            created_at: e.created_at
                        };
                    }));
                } else {
                    setExams([]);
                }
            }

            // جلب حالة الاشتراك
            if (user) {
                const { data: subData } = await supabase
                    .from("teacher_subscriptions")
                    .select("notifications_enabled")
                    .eq("user_id", user.id)
                    .eq("teacher_id", teacherId)
                    .single();

                if (subData) {
                    setIsSubscribed(true);
                    setNotificationsEnabled(subData.notifications_enabled);
                } else {
                    setIsSubscribed(false);
                }

                // جلب كل الاشتراكات للـ sidebar
                const { data: allSubs } = await supabase
                    .from("teacher_subscriptions")
                    .select(`
                        teacher_id,
                        profiles!teacher_subscriptions_teacher_id_fkey (id, name, avatar_url)
                    `)
                    .eq("user_id", user.id);

                if (allSubs) {
                    setSubscribedTeachers(allSubs.map(s => ({
                        id: s.teacher_id,
                        name: (s.profiles as any)?.name || "معلم",
                        photoURL: (s.profiles as any)?.avatar_url
                    })));
                }
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError("حدث خطأ في جلب البيانات");
            setTeacher(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!currentUserId) {
            window.location.href = "/login";
            return;
        }

        const supabase = createClient();

        try {
            if (isSubscribed) {
                const { error } = await supabase
                    .from("teacher_subscriptions")
                    .delete()
                    .eq("user_id", currentUserId)
                    .eq("teacher_id", teacherId);

                if (!error) {
                    setIsSubscribed(false);
                    if (teacher) {
                        setTeacher({ ...teacher, subscriberCount: Math.max(0, teacher.subscriberCount - 1) });
                    }
                    setSubscribedTeachers(prev => prev.filter(t => t.id !== teacherId));
                }
            } else {
                const { error } = await supabase
                    .from("teacher_subscriptions")
                    .insert({ user_id: currentUserId, teacher_id: teacherId });

                if (!error) {
                    setIsSubscribed(true);
                    setNotificationsEnabled(true);
                    if (teacher) {
                        setTeacher({ ...teacher, subscriberCount: teacher.subscriberCount + 1 });
                        setSubscribedTeachers(prev => [...prev, {
                            id: teacher.id,
                            name: teacher.name,
                            photoURL: teacher.photoURL
                        }]);
                    }
                }
            }
        } catch (err) {
            console.error("Subscribe error:", err);
        }
    };

    const handleToggleNotifications = async () => {
        if (!currentUserId || !isSubscribed) return;

        const supabase = createClient();
        const newValue = !notificationsEnabled;

        try {
            const { error } = await supabase
                .from("teacher_subscriptions")
                .update({ notifications_enabled: newValue })
                .eq("user_id", currentUserId)
                .eq("teacher_id", teacherId);

            if (!error) {
                setNotificationsEnabled(newValue);
            }
        } catch (err) {
            console.error("Notification toggle error:", err);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0f0f0f]" dir="rtl">
                <Navbar />
                <div className="flex items-center justify-center py-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
            </div>
        );
    }

    // Error or not found state
    if (error || !teacher) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0f0f0f]" dir="rtl">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {error || "المعلم غير موجود"}
                    </h1>
                    <p className="text-gray-500 mb-6">تأكد من صحة الرابط أو جرب البحث عن معلم آخر</p>
                    <Link
                        href="/teachers"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                    >
                        <ArrowRight className="h-4 w-4" />
                        العودة للمعلمين
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f]" dir="rtl">
            <Navbar />

            <div className="flex">
                {/* Sidebar */}
                <aside className="fixed right-0 top-[64px] h-[calc(100vh-64px)] w-[240px] bg-white dark:bg-[#0f0f0f] border-l border-gray-200 dark:border-[#272727] z-30 overflow-y-auto py-3 hidden lg:block scrollbar-hide">
                    <div className="px-3 mb-3">
                        <SidebarItem icon={Home} label="الرئيسية" href="/" />
                        <SidebarItem icon={Compass} label="استكشاف" href="/teachers" />
                        <SidebarItem icon={Flame} label="الأكثر شعبية" href="/teachers?filter=trending" />
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-[#272727] mx-3 my-2" />

                    <div className="px-3">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                            الاشتراكات ({subscribedTeachers.length})
                        </h3>
                        {subscribedTeachers.length === 0 ? (
                            <p className="text-xs text-gray-400 px-3 py-2">
                                {currentUserId ? "لا توجد اشتراكات" : "سجل دخول"}
                            </p>
                        ) : (
                            subscribedTeachers.map(t => (
                                <Link
                                    key={t.id}
                                    href={`/teachers/${t.id}`}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${t.id === teacherId ? "bg-gray-100 dark:bg-[#272727]" : "hover:bg-gray-100 dark:hover:bg-[#272727]"
                                        }`}
                                >
                                    {t.photoURL ? (
                                        <img src={t.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                                            {t.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{t.name}</span>
                                </Link>
                            ))
                        )}
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-[#272727] mx-3 my-2" />

                    <div className="px-3">
                        <SidebarItem icon={Settings} label="الإعدادات" href="/profile" />
                        <SidebarItem icon={HelpCircle} label="المساعدة" href="#" />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:mr-[240px]">
                    {/* Channel Banner */}
                    <div className="relative h-32 sm:h-48 overflow-hidden bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600">
                        {teacher.coverImageURL ? (
                            <img src={teacher.coverImageURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 bg-black/10" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    {/* Channel Info */}
                    <div className="bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#272727]">
                        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
                            <div className="flex flex-col sm:flex-row gap-4 py-4 sm:py-6">
                                {/* Avatar */}
                                <div className="shrink-0 -mt-12 sm:-mt-16 z-10">
                                    {teacher.photoURL ? (
                                        <img
                                            src={teacher.photoURL}
                                            alt=""
                                            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-[#0f0f0f] object-cover ring-1 ring-gray-100 dark:ring-gray-800"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-white dark:border-[#0f0f0f] ring-1 ring-gray-100 dark:ring-gray-800">
                                            {teacher.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                                {teacher.name}
                                            </h1>
                                            {teacher.verified && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                        </div>
                                        {teacher.teacherTitle && (
                                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                                {teacher.teacherTitle}
                                            </p>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-mono" dir="ltr">
                                        @{teacher.name.replace(/\s/g, '_').toLowerCase()}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 flex-wrap">
                                        <span>{formatSubscribers(teacher.subscriberCount)} مشترك</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-1"></span>
                                        <span>{teacher.stats.exams} امتحان</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-1"></span>
                                        <span>{teacher.stats.lessons} درس</span>
                                        {teacher.yearsOfExperience > 0 && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-1"></span>
                                                <span>خبرة {teacher.yearsOfExperience} سنوات</span>
                                            </>
                                        )}
                                    </div>
                                    {teacher.bio && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 max-w-2xl">
                                            {teacher.bio}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSubscribe}
                                            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${isSubscribed
                                                ? "bg-gray-100 dark:bg-[#272727] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#323232]"
                                                : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200"
                                                }`}
                                        >
                                            {isSubscribed ? (
                                                <><UserCheck className="h-4 w-4" />مشترك</>
                                            ) : (
                                                <><UserPlus className="h-4 w-4" />اشتراك</>
                                            )}
                                        </button>
                                        {isSubscribed && (
                                            <button
                                                onClick={handleToggleNotifications}
                                                className={`p-2.5 rounded-full transition-all border ${notificationsEnabled
                                                    ? "bg-gray-100 dark:bg-[#272727] border-gray-200 dark:border-gray-800"
                                                    : "bg-transparent border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                                                    }`}
                                            >
                                                {notificationsEnabled
                                                    ? <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                                    : <BellOff className="h-5 w-5 text-gray-400" />
                                                }
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleShare(teacher)}
                                            className="p-2.5 rounded-full bg-transparent border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                                        >
                                            <Share2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                        </button>
                                        {teacher.website && (
                                            <a
                                                href={teacher.website.startsWith('http') ? teacher.website : `https://${teacher.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-full bg-transparent border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                                            >
                                                <Compass className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-8 border-t border-gray-200 dark:border-[#272727] -mx-4 px-4 sm:-mx-6 sm:px-6 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setActiveTab("exams")}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "exams"
                                        ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    الامتحانات ({exams.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("about")}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "about"
                                        ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    حول المعلم
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-6">
                        <AnimatePresence mode="wait">
                            {activeTab === "exams" ? (
                                <motion.div
                                    key="exams"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {exams.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-[#272727] rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">لا توجد امتحانات</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto">لم يقم المعلم بنشر أي امتحانات عامة حتى الآن</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {exams.map((exam, i) => (
                                                <motion.div
                                                    key={exam.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                >
                                                    <Link href={`/arabic/exam/${exam.id}`} className="block group">
                                                        <div className="flex gap-4 p-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#272727] hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                                                            <div className="w-16 sm:w-24 h-16 sm:h-20 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                                                                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
                                                                    {exam.title}
                                                                </h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                                                                    {exam.description || "امتحان تفاعلي لاختبار مستواك وتطوير مهاراتك"}
                                                                </p>
                                                                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                                                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#272727] px-2 py-1 rounded">
                                                                        <Clock className="h-3 w-3" /> {exam.duration} دقيقة
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#272727] px-2 py-1 rounded">
                                                                        <Trophy className="h-3 w-3" /> شهادة إتمام
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="self-center hidden sm:block">
                                                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#272727] flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="about"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#272727] rounded-2xl p-6 sm:p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                                            <div className="md:col-span-2 space-y-8">
                                                <section>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">نبذة عن المعلم</h3>
                                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                                                        {teacher.bio || "لا توجد نبذة متاحة حالياً."}
                                                    </p>
                                                </section>

                                                {teacher.teachingStyle && (
                                                    <section>
                                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">أسلوب التدريس</h3>
                                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                                                            {teacher.teachingStyle}
                                                        </p>
                                                    </section>
                                                )}

                                                <section>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">التفاصيل</h3>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#272727]">
                                                            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                                                                <Star className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">التخصص</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teacher.specialty}</div>
                                                            </div>
                                                        </div>

                                                        {teacher.education && (
                                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#272727]">
                                                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                                    <BookOpen className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">المؤهل العلمي</div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teacher.education}</div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#272727]">
                                                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                                                <Clock className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">سنوات الخبرة</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teacher.yearsOfExperience} سنوات</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>

                                            <div className="md:col-span-1 border-t md:border-t-0 md:border-r border-gray-100 dark:border-[#323232] pt-8 md:pt-0 md:pr-8">
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-6">إحصائيات</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                                                    <div className="bg-gray-50 dark:bg-[#272727] p-4 rounded-xl text-center">
                                                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                                            {formatSubscribers(teacher.subscriberCount)}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">مشترك</div>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-[#272727] p-4 rounded-xl text-center">
                                                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                                            {teacher.stats.exams}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">امتحان منشور</div>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-[#272727] p-4 rounded-xl text-center">
                                                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                                            {teacher.stats.lessons}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">درس تعليمي</div>
                                                    </div>
                                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl text-center">
                                                        <div className="flex items-center justify-center gap-1.5 text-3xl font-bold text-amber-500 mb-1">
                                                            {teacher.stats.rating} <Star className="h-6 w-6 fill-amber-500" />
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">تقييم عام</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-6 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors"
        >
            <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        </Link>
    );
}
