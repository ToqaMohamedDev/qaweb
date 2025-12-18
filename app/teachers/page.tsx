"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    GraduationCap, Users, FileText, Star, CheckCircle2, Search,
    Bell, BellOff, TrendingUp, ChevronDown, Sparkles, Clock,
    Flame, BookOpen, Zap, Home, Compass, Loader2, UserPlus,
    UserCheck, Heart, Play, Video, Grid3X3, List, Filter,
    Menu, X, ChevronLeft, Settings, HelpCircle, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Teacher {
    id: string;
    displayName: string;
    specialty: string;
    photoURL: string | null;
    coverImageURL: string | null;
    isVerified: boolean;
    bio: string;
    subscriberCount: number;
    isFeatured: boolean;
    isPublic: boolean;
    teacherTitle: string | null;
    yearsOfExperience: number;
    subjects: string[];
    stages: string[];
    ratingAverage: number;
    ratingCount: number;
    stats: { totalExams: number; totalLessons: number; totalStudents: number; averageRating: number };
}

interface SubscribedTeacher {
    id: string;
    name: string;
    photoURL: string | null;
    specialty: string;
    isFeatured?: boolean;
    hasNewContent?: boolean;
}

const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'arabic', label: 'لغة عربية' },
    { id: 'english', label: 'English' },
    { id: 'math', label: 'رياضيات' },
    { id: 'science', label: 'علوم' },
    { id: 'trending', label: 'رائج' },
];

const formatSubscribers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
};

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subscribedTeachers, setSubscribedTeachers] = useState<SubscribedTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // جلب المعلمين من Supabase
            const { data: teachersData, error: teachersError } = await supabase
                .from("profiles")
                .select("*")
                .eq("role", "teacher")
                .order("created_at", { ascending: false });
            // Debug: log what we got
            console.log("Teachers query result:", {
                hasData: !!teachersData,
                dataLength: teachersData?.length,
                error: teachersError
            });

            // Check if there's actually a meaningful error
            // Sometimes Supabase returns an empty object {} which should be ignored
            const hasError = teachersError &&
                typeof teachersError === 'object' &&
                (teachersError.message || teachersError.code || teachersError.details);

            if (hasError) {
                console.error("Actual error from Supabase:", JSON.stringify(teachersError, null, 2));
                setError("حدث خطأ في جلب البيانات: " + (teachersError.message || teachersError.code || "خطأ غير معروف"));
                setTeachers([]);
            } else if (!teachersData || teachersData.length === 0) {
                setTeachers([]);
            } else {
                const examCounts: Record<string, number> = {};
                const lessonCounts: Record<string, number> = {};

                // تحويل البيانات (use any to handle new fields not yet in Supabase types)
                const teachersList: Teacher[] = (teachersData as any[]).map((t: any) => ({
                    id: t.id,
                    displayName: t.name || "معلم",
                    specialty: t.specialization || "عام",
                    photoURL: t.avatar_url,
                    coverImageURL: t.cover_image_url || null,
                    isVerified: t.is_verified || false,
                    bio: t.bio || "",
                    subscriberCount: t.subscriber_count || 0,
                    isFeatured: t.is_featured || false,
                    isPublic: t.is_teacher_profile_public || false,
                    teacherTitle: t.teacher_title || null,
                    yearsOfExperience: t.years_of_experience || 0,
                    subjects: t.subjects || [],
                    stages: t.stages || [],
                    ratingAverage: parseFloat(t.rating_average) || 0,
                    ratingCount: t.rating_count || 0,
                    stats: {
                        totalExams: examCounts[t.id] || 0,
                        totalLessons: lessonCounts[t.id] || 0,
                        totalStudents: t.subscriber_count || 0,
                        averageRating: parseFloat(t.rating_average) || 4.5
                    }
                }));

                setTeachers(teachersList);
            }

            // جلب اشتراكات المستخدم الحالي
            if (user) {
                const { data: subsData } = await supabase
                    .from("teacher_subscriptions")
                    .select(`
                        teacher_id,
                        notifications_enabled,
                        profiles!teacher_subscriptions_teacher_id_fkey (
                            id, name, avatar_url, specialization
                        )
                    `)
                    .eq("user_id", user.id);

                if (subsData) {
                    const subsSet = new Set(subsData.map(s => s.teacher_id));
                    setSubscriptions(subsSet);

                    const subTeachers: SubscribedTeacher[] = (subsData as any[]).map(s => ({
                        id: s.teacher_id,
                        name: s.profiles?.name || "معلم",
                        photoURL: s.profiles?.avatar_url,
                        specialty: s.profiles?.specialization || "",
                        isFeatured: false, // Will be populated after migration is run
                    }));
                    setSubscribedTeachers(subTeachers);
                }
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError("حدث خطأ في الاتصال بقاعدة البيانات");
            setTeachers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (teacherId: string) => {
        if (!currentUserId) {
            window.location.href = "/login";
            return;
        }

        const supabase = createClient();
        const isSubscribed = subscriptions.has(teacherId);

        try {
            if (isSubscribed) {
                const { error } = await supabase
                    .from("teacher_subscriptions")
                    .delete()
                    .eq("user_id", currentUserId)
                    .eq("teacher_id", teacherId);

                if (!error) {
                    setSubscriptions(prev => {
                        const n = new Set(prev);
                        n.delete(teacherId);
                        return n;
                    });
                    setSubscribedTeachers(prev => prev.filter(t => t.id !== teacherId));
                    setTeachers(prev => prev.map(t =>
                        t.id === teacherId ? { ...t, subscriberCount: Math.max(0, t.subscriberCount - 1) } : t
                    ));
                }
            } else {
                const { error } = await supabase
                    .from("teacher_subscriptions")
                    .insert({ user_id: currentUserId, teacher_id: teacherId });

                if (!error) {
                    setSubscriptions(prev => new Set(prev).add(teacherId));
                    const teacher = teachers.find(t => t.id === teacherId);
                    if (teacher) {
                        setSubscribedTeachers(prev => [...prev, {
                            id: teacher.id,
                            name: teacher.displayName,
                            photoURL: teacher.photoURL,
                            specialty: teacher.specialty
                        }]);
                    }
                    setTeachers(prev => prev.map(t =>
                        t.id === teacherId ? { ...t, subscriberCount: t.subscriberCount + 1 } : t
                    ));
                }
            }
        } catch (err) {
            console.error("Subscribe error:", err);
        }
    };

    const filteredTeachers = teachers.filter((teacher) => {
        const matchesSearch = teacher.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.specialty?.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedCategory === 'all') return matchesSearch;
        if (selectedCategory === 'trending') return matchesSearch;

        const categoryMap: Record<string, string[]> = {
            arabic: ['عربي', 'عربية', 'arabic'],
            english: ['english', 'إنجليزي', 'انجليزي'],
            math: ['رياضيات', 'رياضة', 'math'],
            science: ['علوم', 'فيزياء', 'كيمياء', 'أحياء', 'science']
        };

        const keywords = categoryMap[selectedCategory] || [];
        return matchesSearch && keywords.some(k => teacher.specialty?.toLowerCase().includes(k));
    }).sort((a, b) => {
        if (selectedCategory === 'trending') return b.subscriberCount - a.subscriberCount;
        return b.stats.averageRating - a.stats.averageRating;
    });

    // Sort subscribed teachers - featured first
    const sortedSubscribedTeachers = [...subscribedTeachers].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
    });

    // Get featured teachers from all teachers
    const featuredTeachers = teachers.filter(t => t.isFeatured).slice(0, 5);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f0f0f]" dir="rtl">
            <Navbar />

            <div className="flex">
                {/* YouTube-style Sidebar */}
                <aside className={`fixed right-0 top-[64px] h-[calc(100vh-64px)] bg-white dark:bg-[#0f0f0f] border-l border-gray-200 dark:border-[#272727] z-30 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'} hidden lg:block`}>
                    <div className="h-full overflow-y-auto py-3 scrollbar-hide">
                        {/* Navigation */}
                        <div className="px-3 mb-3">
                            <SidebarItem icon={Home} label="الرئيسية" href="/" collapsed={sidebarCollapsed} />
                            <SidebarItem icon={Compass} label="استكشاف" href="/teachers" active collapsed={sidebarCollapsed} />
                            <SidebarItem icon={Flame} label="الأكثر شعبية" href="/teachers?filter=trending" collapsed={sidebarCollapsed} />
                        </div>

                        {!sidebarCollapsed && (
                            <>
                                {/* Featured Teachers Section */}
                                {featuredTeachers.length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-200 dark:bg-[#272727] mx-3 my-2" />
                                        <div className="px-3">
                                            <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400 px-3 py-2 flex items-center gap-2">
                                                <Star className="h-4 w-4 fill-amber-500" />
                                                معلمون مميزون
                                            </h3>
                                            {featuredTeachers.map(teacher => (
                                                <Link
                                                    key={teacher.id}
                                                    href={`/teachers/${teacher.id}`}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group"
                                                >
                                                    <div className="relative">
                                                        {teacher.photoURL ? (
                                                            <img src={teacher.photoURL} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-500" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-amber-500">
                                                                {teacher.displayName.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                                                            <Star className="h-2 w-2 text-white fill-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{teacher.displayName}</span>
                                                        {teacher.teacherTitle && (
                                                            <span className="text-xs text-gray-400 truncate block">{teacher.teacherTitle}</span>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="h-px bg-gray-200 dark:bg-[#272727] mx-3 my-2" />

                                {/* Subscriptions */}
                                <div className="px-3">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                                        الاشتراكات ({subscribedTeachers.length})
                                    </h3>
                                    {subscribedTeachers.length === 0 ? (
                                        <p className="text-xs text-gray-400 px-3 py-2">
                                            {currentUserId ? "لا توجد اشتراكات بعد" : "سجل دخول لعرض اشتراكاتك"}
                                        </p>
                                    ) : (
                                        sortedSubscribedTeachers.map(teacher => (
                                            <Link
                                                key={teacher.id}
                                                href={`/teachers/${teacher.id}`}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors group ${teacher.isFeatured ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                                            >
                                                <div className="relative">
                                                    {teacher.photoURL ? (
                                                        <img src={teacher.photoURL} alt="" className={`w-6 h-6 rounded-full object-cover ${teacher.isFeatured ? 'ring-2 ring-amber-400' : ''}`} />
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full ${teacher.isFeatured ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary-400 to-primary-600'} flex items-center justify-center text-white text-xs font-bold`}>
                                                            {teacher.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    {teacher.isFeatured && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{teacher.name}</span>
                                            </Link>
                                        ))
                                    )}
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-[#272727] mx-3 my-2" />

                                <div className="px-3">
                                    <SidebarItem icon={Settings} label="الإعدادات" href="/profile" collapsed={false} />
                                    <SidebarItem icon={HelpCircle} label="المساعدة" href="#" collapsed={false} />
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-[72px]' : 'lg:mr-[240px]'}`}>
                    {/* Categories */}
                    <div className="sticky top-[64px] z-20 bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#272727]">
                        <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                                        : "bg-gray-100 dark:bg-[#272727] text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-4 py-4">
                        <div className="relative max-w-2xl">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث عن معلم..."
                                className="w-full pr-12 pl-4 py-2.5 rounded-full bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-[#303030] outline-none text-sm focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 pb-8">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {/* Skeleton Cards */}
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="animate-pulse">
                                        {/* Cover Skeleton */}
                                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/50 dark:via-gray-700/50 to-transparent skeleton-shimmer" />
                                            {/* Stats badges skeleton */}
                                            <div className="absolute bottom-2 right-2 flex gap-1.5">
                                                <div className="w-12 h-5 rounded bg-gray-300 dark:bg-gray-700" />
                                                <div className="w-12 h-5 rounded bg-gray-300 dark:bg-gray-700" />
                                            </div>
                                        </div>
                                        {/* Info Skeleton */}
                                        <div className="flex gap-3">
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                {/* Name */}
                                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                                {/* Specialty */}
                                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                                                {/* Subscribers */}
                                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                            </div>
                                            {/* Subscribe Button */}
                                            <div className="w-16 h-8 rounded-full bg-gray-200 dark:bg-gray-800 self-start mt-1" />
                                        </div>
                                    </div>
                                ))}
                                {/* Add shimmer animation styles */}
                                <style jsx>{`
                                    @keyframes shimmer {
                                        0% { transform: translateX(-100%); }
                                        100% { transform: translateX(100%); }
                                    }
                                    .skeleton-shimmer {
                                        animation: shimmer 1.5s infinite;
                                    }
                                `}</style>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20">
                                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">خطأ</h3>
                                <p className="text-gray-500 mb-4">{error}</p>
                                <button onClick={fetchData} className="px-4 py-2 bg-primary-500 text-white rounded-lg">
                                    إعادة المحاولة
                                </button>
                            </div>
                        ) : teachers.length === 0 ? (
                            <div className="text-center py-20">
                                <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    لا يوجد معلمين مسجلين
                                </h3>
                                <p className="text-gray-500">
                                    لم يتم تسجيل أي معلمين في قاعدة البيانات بعد
                                </p>
                            </div>
                        ) : filteredTeachers.length === 0 ? (
                            <div className="text-center py-20">
                                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    لا توجد نتائج
                                </h3>
                                <p className="text-gray-500">جرب البحث بكلمات مختلفة</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredTeachers.map((teacher, index) => (
                                    <TeacherCard
                                        key={teacher.id}
                                        teacher={teacher}
                                        index={index}
                                        isSubscribed={subscriptions.has(teacher.id)}
                                        onSubscribe={() => handleSubscribe(teacher.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, href, active, collapsed }: {
    icon: any; label: string; href: string; active?: boolean; collapsed: boolean
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-6 px-3 py-2 rounded-lg transition-colors ${active ? "bg-gray-100 dark:bg-[#272727] font-medium" : "hover:bg-gray-100 dark:hover:bg-[#272727]"
                } ${collapsed ? "justify-center" : ""}`}
        >
            <Icon className={`h-5 w-5 ${active ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`} />
            {!collapsed && (
                <span className={`text-sm ${active ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {label}
                </span>
            )}
        </Link>
    );
}

function TeacherCard({ teacher, index, isSubscribed, onSubscribe }: {
    teacher: Teacher; index: number; isSubscribed: boolean; onSubscribe: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
        >
            <div className="group">
                <Link href={`/teachers/${teacher.id}`}>
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 mb-3">
                        {teacher.coverImageURL ? (
                            <img src={teacher.coverImageURL} alt={teacher.displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600" />
                        )}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-2 right-2 flex gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-black/70 text-white text-xs flex items-center gap-1">
                                <Video className="h-3 w-3" /> {teacher.stats.totalLessons}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-black/70 text-white text-xs flex items-center gap-1">
                                <FileText className="h-3 w-3" /> {teacher.stats.totalExams}
                            </span>
                        </div>
                    </div>
                </Link>

                <div className="flex gap-3">
                    <Link href={`/teachers/${teacher.id}`}>
                        <div className="relative shrink-0">
                            {teacher.photoURL ? (
                                <img src={teacher.photoURL} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-[#0f0f0f]" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white dark:ring-[#0f0f0f]">
                                    {teacher.displayName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={`/teachers/${teacher.id}`}>
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-0.5 group-hover:text-primary-600">
                                {teacher.displayName}
                                {teacher.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 inline mr-1" />}
                            </h3>
                        </Link>
                        {teacher.teacherTitle && (
                            <p className="text-xs text-primary-600 dark:text-primary-400 mb-0.5 font-medium">{teacher.teacherTitle}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{teacher.specialty}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatSubscribers(teacher.subscriberCount)} مشترك</p>
                    </div>
                    <button
                        onClick={onSubscribe}
                        className={`h-8 px-3 rounded-full text-xs font-medium transition-all self-start mt-1 ${isSubscribed
                            ? "bg-gray-100 dark:bg-[#272727] text-gray-700 dark:text-gray-300"
                            : "bg-black dark:bg-white text-white dark:text-black"
                            }`}
                    >
                        {isSubscribed ? "مشترك" : "اشتراك"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
