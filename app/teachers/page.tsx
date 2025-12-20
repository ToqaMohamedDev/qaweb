"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import {
    Users, FileText, Star, CheckCircle2, Search,
    Loader2, UserPlus, UserCheck, Flame, Video,
    Home, Compass, Clock, ThumbsUp, PlaySquare,
    History, ListVideo, ChevronDown, Menu, TrendingUp,
    GraduationCap, Award, Sparkles, BookOpen, X, Zap,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Teacher {
    id: string;
    displayName: string;
    specialty: string;
    photoURL: string | null;
    coverImageURL: string | null;
    isVerified: boolean;
    subscriberCount: number;
    examsCount: number;
    isFeatured: boolean;
}

interface Subject {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
}

const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)} مليون`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
};

// Enhanced animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" as const }
    }
};

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [subscribingTo, setSubscribingTo] = useState<string | null>(null);
    const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                console.error('Auth error:', authError);
            }

            setCurrentUserId(user?.id || null);

            // Fetch subjects from database
            const { data: subjectsData, error: subjectsError } = await supabase
                .from("subjects")
                .select("id, name, slug, image_url")
                .eq("is_active", true)
                .order("order_index", { ascending: true });

            if (subjectsError) {
                console.error('Subjects fetch error:', subjectsError);
            } else if (subjectsData) {
                setSubjects(subjectsData);
            }

            // Fetch teachers with their exam counts
            const { data: teachersData, error: teachersError } = await supabase
                .from("profiles")
                .select("id, name, specialization, avatar_url, cover_image_url, is_verified, is_featured")
                .eq("role", "teacher");

            if (teachersError) {
                console.error('Teachers fetch error:', teachersError);
            }

            if (teachersData) {
                const teacherIds = teachersData.map(t => t.id);

                // Fetch REAL subscriber counts from teacher_subscriptions table
                const { data: subscriptionCounts, error: subCountError } = await supabase
                    .from("teacher_subscriptions")
                    .select("teacher_id")
                    .in("teacher_id", teacherIds);

                if (subCountError) {
                    console.error('Subscription counts fetch error:', subCountError);
                }

                // Create a map of teacher_id -> subscriber count
                const subscriberCountMap: Record<string, number> = {};
                if (subscriptionCounts) {
                    subscriptionCounts.forEach((sub: { teacher_id: string }) => {
                        subscriberCountMap[sub.teacher_id] = (subscriberCountMap[sub.teacher_id] || 0) + 1;
                    });
                }

                // Fetch exam counts
                const { data: examCounts, error: examError } = await supabase
                    .from("exam_templates")
                    .select("created_by")
                    .in("created_by", teacherIds)
                    .eq("is_published", true);

                if (examError) {
                    console.error('Exam counts fetch error:', examError);
                }

                // Create a map of teacher_id -> exam count
                const examCountMap: Record<string, number> = {};
                if (examCounts) {
                    examCounts.forEach((exam: { created_by: string }) => {
                        examCountMap[exam.created_by] = (examCountMap[exam.created_by] || 0) + 1;
                    });
                }

                const list: Teacher[] = teachersData.map((t: any) => ({
                    id: t.id,
                    displayName: t.name || "معلم",
                    specialty: t.specialization || "عام",
                    photoURL: t.avatar_url,
                    coverImageURL: t.cover_image_url,
                    isVerified: t.is_verified || false,
                    subscriberCount: subscriberCountMap[t.id] || 0, // Real count from subscriptions!
                    examsCount: examCountMap[t.id] || 0,
                    isFeatured: t.is_featured || false,
                }));

                // Sort by subscriber count
                list.sort((a, b) => b.subscriberCount - a.subscriberCount);
                setTeachers(list);
            }

            // Fetch subscriptions if user is logged in
            if (user) {
                const { data: subsData, error: subsError } = await supabase
                    .from("teacher_subscriptions")
                    .select("teacher_id")
                    .eq("user_id", user.id);

                if (subsError) {
                    console.error('Subscriptions fetch error:', subsError);
                }

                if (subsData && subsData.length > 0) {
                    const subSet = new Set(subsData.map(s => s.teacher_id));
                    setSubscriptions(subSet);
                } else {
                    setSubscriptions(new Set());
                }
            }
        } catch (err) {
            console.error('Fetch data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (teacherId: string) => {
        if (!currentUserId) {
            window.location.href = "/login";
            return;
        }

        // Prevent self-subscription
        if (currentUserId === teacherId) {
            console.log('Cannot subscribe to yourself');
            return;
        }

        // Prevent double clicks
        if (subscribingTo === teacherId) return;
        setSubscribingTo(teacherId);

        const supabase = createClient();
        const isSubscribed = subscriptions.has(teacherId);

        try {
            if (isSubscribed) {
                // Unsubscribe
                const { error } = await supabase
                    .from("teacher_subscriptions")
                    .delete()
                    .eq("user_id", currentUserId)
                    .eq("teacher_id", teacherId);

                if (error) {
                    console.error('Unsubscribe error:', error);
                    throw error;
                }

                // Update local state
                setSubscriptions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(teacherId);
                    return newSet;
                });

                // Fetch updated subscriber count from database
                const { data: teacherData } = await supabase
                    .from("profiles")
                    .select("subscriber_count")
                    .eq("id", teacherId)
                    .single();

                if (teacherData) {
                    setTeachers(prev => prev.map(t =>
                        t.id === teacherId
                            ? { ...t, subscriberCount: teacherData.subscriber_count || 0 }
                            : t
                    ));
                }
            } else {
                // Subscribe
                const { error, data } = await supabase
                    .from("teacher_subscriptions")
                    .insert({
                        user_id: currentUserId,
                        teacher_id: teacherId
                    })
                    .select();

                // Handle errors
                if (error) {
                    // Ignore duplicate key error (user already subscribed)
                    if (error.message?.includes('duplicate') || error.code === '23505') {
                        console.log('Already subscribed, updating local state');
                        setSubscriptions(prev => new Set(prev).add(teacherId));
                    } else {
                        // Log full error details
                        console.error('Subscribe error details:', {
                            message: error.message,
                            code: error.code,
                            details: error.details,
                            hint: error.hint,
                            fullError: JSON.stringify(error, null, 2)
                        });
                        throw error;
                    }
                } else {
                    console.log('Subscription successful:', data);
                    // Update local state
                    setSubscriptions(prev => new Set(prev).add(teacherId));

                    // Update subscriber count locally (+1)
                    setTeachers(prev => prev.map(t =>
                        t.id === teacherId
                            ? { ...t, subscriberCount: t.subscriberCount + 1 }
                            : t
                    ));
                }
            }
        } catch (err: any) {
            console.error('Subscription error:', {
                message: err?.message,
                code: err?.code,
                details: err?.details,
                fullError: JSON.stringify(err, null, 2)
            });
            // Refetch data on error to sync state
            await fetchData();
        } finally {
            setSubscribingTo(null);
        }
    };

    const filteredTeachers = teachers.filter((t) => {
        const matchesSearch = t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
        if (selectedCategory === 'all') return matchesSearch;

        // Find the selected subject from subjects array
        const selectedSubject = subjects.find(s => s.id === selectedCategory);
        if (!selectedSubject) return matchesSearch;

        // Match teacher specialty with subject name
        const subjectName = selectedSubject.name.toLowerCase();
        return matchesSearch && t.specialty?.toLowerCase().includes(subjectName);
    });

    const featuredTeachers = filteredTeachers.filter(t => t.isFeatured);
    const regularTeachers = filteredTeachers.filter(t => !t.isFeatured);
    const subscribedTeachers = teachers.filter(t => subscriptions.has(t.id));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] transition-colors duration-300 overflow-x-hidden" dir="rtl">
            <Navbar />

            <div className="flex w-full">
                {/* YouTube-style Sidebar - Hidden on mobile */}
                <aside
                    className={`hidden md:flex flex-col fixed top-16 right-0 h-[calc(100vh-64px)] bg-white dark:bg-[#0f0f0f] border-l border-gray-200 dark:border-[#272727] transition-all duration-300 ease-out z-40 ${sidebarOpen ? 'w-64' : 'w-[72px]'}`}
                >
                    {/* Navigation Section */}
                    <nav className="flex-shrink-0 p-3 space-y-1">
                        <SidebarLink icon={Home} label="الرئيسية" href="/" collapsed={!sidebarOpen} />
                        <SidebarLink icon={Compass} label="استكشاف" href="/teachers" collapsed={!sidebarOpen} active />
                        <SidebarLink icon={PlaySquare} label="الامتحانات" href="/arabic" collapsed={!sidebarOpen} />
                        <SidebarLink icon={History} label="السجل" href="/history" collapsed={!sidebarOpen} />
                    </nav>

                    {/* Divider */}
                    {sidebarOpen && (
                        <div className="mx-4 my-2">
                            <div className="h-px bg-gray-200 dark:bg-[#333]" />
                        </div>
                    )}

                    {/* Subscriptions Section - Scrollable Area */}
                    {sidebarOpen ? (
                        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                            {/* Section Title */}
                            <div className="px-4 py-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    الاشتراكات
                                </h3>
                            </div>

                            {/* Subscribed Teachers List */}
                            {subscribedTeachers.length > 0 ? (
                                <div className="px-2 pb-2 space-y-1">
                                    {subscribedTeachers.map((teacher) => (
                                        <Link
                                            key={teacher.id}
                                            href={`/teachers/${teacher.id}`}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors group"
                                        >
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {teacher.photoURL ? (
                                                    <img
                                                        src={teacher.photoURL}
                                                        alt={teacher.displayName}
                                                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#333]"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {teacher.displayName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Teacher Name */}
                                            <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100 truncate group-hover:text-gray-900 dark:group-hover:text-white">
                                                {teacher.displayName}
                                            </span>

                                            {/* Verified Badge */}
                                            {teacher.isVerified && (
                                                <CheckCircle2 className="flex-shrink-0 h-4 w-4 text-blue-500" />
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                                        <Users className="h-7 w-7 text-gray-400 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        لا توجد اشتراكات
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        تابع المعلمين لتظهر هنا
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Mini Subscriptions (when collapsed) */
                        subscribedTeachers.length > 0 && (
                            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-2">
                                <div className="px-2 space-y-2">
                                    {subscribedTeachers.slice(0, 6).map((teacher) => (
                                        <Link
                                            key={teacher.id}
                                            href={`/teachers/${teacher.id}`}
                                            className="flex justify-center py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors"
                                            title={teacher.displayName}
                                        >
                                            {teacher.photoURL ? (
                                                <img
                                                    src={teacher.photoURL}
                                                    alt={teacher.displayName}
                                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#333]"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                                                    {teacher.displayName.charAt(0)}
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    {/* Toggle Button - Fixed at Bottom */}
                    <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-[#272727]">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#272727] transition-colors text-gray-700 dark:text-gray-300"
                        >
                            <Menu className="h-5 w-5" />
                            {sidebarOpen && <span className="text-sm font-medium">تصغير</span>}
                        </button>
                    </div>
                </aside>


                {/* Main Content */}
                <main className={`flex-1 w-full min-w-0 transition-all duration-300 ease-out ${sidebarOpen ? 'md:mr-64' : 'md:mr-[72px]'}`}>
                    {/* Search Bar with Subject Filter */}
                    <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#0f0f0f]/98 backdrop-blur-xl border-b border-gray-100/80 dark:border-[#272727]/60">
                        <div className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3 max-w-3xl mx-auto">
                                {/* Subject Filter Dropdown */}
                                <div className="relative flex-shrink-0">
                                    <motion.button
                                        onClick={() => setShowSubjectsDropdown(!showSubjectsDropdown)}
                                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-white font-medium text-xs sm:text-sm transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            {selectedCategory === 'all'
                                                ? 'كل المواد'
                                                : subjects.find(s => s.id === selectedCategory)?.name || 'المادة'
                                            }
                                        </span>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showSubjectsDropdown ? 'rotate-180' : ''}`} />
                                    </motion.button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {showSubjectsDropdown && (
                                            <>
                                                {/* Backdrop */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setShowSubjectsDropdown(false)}
                                                />
                                                {/* Dropdown */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-full mt-2 right-0 w-64 max-h-80 overflow-y-auto bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#333] z-50"
                                                >
                                                    <div className="p-2">
                                                        {/* All option */}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCategory('all');
                                                                setShowSubjectsDropdown(false);
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${selectedCategory === 'all'
                                                                ? 'bg-gradient-to-l from-primary-500/20 to-primary-500/5 dark:from-red-500/20 dark:to-red-500/5 text-primary-600 dark:text-red-400'
                                                                : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-200'
                                                                }`}
                                                        >
                                                            <Sparkles className="h-5 w-5" />
                                                            <span className="font-medium">كل المواد</span>
                                                            {selectedCategory === 'all' && (
                                                                <CheckCircle2 className="h-4 w-4 mr-auto text-primary-500 dark:text-red-500" />
                                                            )}
                                                        </button>

                                                        {/* Divider */}
                                                        <div className="my-2 h-px bg-gray-200 dark:bg-[#333]" />

                                                        {/* Subjects list */}
                                                        {subjects.map((subject) => (
                                                            <button
                                                                key={subject.id}
                                                                onClick={() => {
                                                                    setSelectedCategory(subject.id);
                                                                    setShowSubjectsDropdown(false);
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${selectedCategory === subject.id
                                                                    ? 'bg-gradient-to-l from-primary-500/20 to-primary-500/5 dark:from-red-500/20 dark:to-red-500/5 text-primary-600 dark:text-red-400'
                                                                    : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-200'
                                                                    }`}
                                                            >
                                                                <BookOpen className="h-5 w-5" />
                                                                <span className="font-medium">{subject.name}</span>
                                                                {selectedCategory === subject.id && (
                                                                    <CheckCircle2 className="h-4 w-4 mr-auto text-primary-500 dark:text-red-500" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Search Input */}
                                <div className="flex-1 relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-blue-500/20 dark:from-red-500/20 dark:via-orange-500/20 dark:to-yellow-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-md transition-all duration-500" />
                                    <div className="relative flex items-center bg-gray-100/90 dark:bg-[#121212]/90 border-2 border-transparent focus-within:border-primary-500/50 dark:focus-within:border-red-500/50 rounded-xl overflow-hidden shadow-sm focus-within:shadow-lg transition-all duration-300">
                                        <Search className="h-5 w-5 text-gray-400 dark:text-[#717171] mr-3" />
                                        <input
                                            type="text"
                                            placeholder="ابحث عن معلم..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="flex-1 bg-transparent py-2.5 sm:py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#717171] focus:outline-none text-sm"
                                        />
                                        {searchQuery && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                onClick={() => setSearchQuery('')}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-[#272727] rounded-full transition-colors ml-1"
                                            >
                                                <X className="h-4 w-4 text-gray-500" />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Info */}
                    <motion.div
                        className="px-3 sm:px-6 pb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                <motion.span
                                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-100/80 dark:bg-[#1a1a1a]/80 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-[#ccc] font-medium"
                                    key={filteredTeachers.length}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-500 dark:text-red-500" />
                                    {filteredTeachers.length} نتيجة
                                </motion.span>
                                {featuredTeachers.length > 0 && (
                                    <motion.span
                                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 rounded-lg text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 font-medium"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-500 text-yellow-500" />
                                        {featuredTeachers.length} مميز
                                    </motion.span>
                                )}
                            </div>
                            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                                ترتيب حسب الأكثر متابعة
                            </button>
                        </div>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="px-3 sm:px-6 pb-28 md:pb-10">
                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Skeleton Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 rounded-2xl bg-gray-200 dark:bg-[#272727] animate-pulse">
                                        <div className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-6 w-32 rounded-lg bg-gray-200 dark:bg-[#272727] animate-pulse" />
                                        <div className="h-4 w-48 rounded-lg bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
                                    </div>
                                </div>

                                {/* Skeleton Grid */}
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                                    {[...Array(8)].map((_, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            className="group"
                                        >
                                            <div className="relative">
                                                {/* Thumbnail Skeleton - 16:9 */}
                                                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-[#272727]">
                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
                                                    <div className="absolute bottom-2 left-2">
                                                        <div className="w-16 h-5 rounded-md bg-gray-300/50 dark:bg-[#3a3a3a]" />
                                                    </div>
                                                </div>

                                                {/* Info Section Skeleton */}
                                                <div className="flex gap-3 mt-3 px-1">
                                                    {/* Avatar */}
                                                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#272727] animate-pulse flex-shrink-0 relative overflow-hidden">
                                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent" />
                                                    </div>

                                                    {/* Title & Meta */}
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-[#272727] animate-pulse relative overflow-hidden">
                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-3 w-16 rounded-md bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
                                                            <div className="h-3 w-3 rounded-full bg-gray-100 dark:bg-[#1f1f1f]" />
                                                            <div className="h-3 w-20 rounded-md bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
                                                        </div>
                                                        <div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-[#272727] animate-pulse relative overflow-hidden">
                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : filteredTeachers.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-center py-24"
                            >
                                <motion.div
                                    className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:via-[#222] dark:to-[#1a1a1a] flex items-center justify-center shadow-xl shadow-gray-200/50 dark:shadow-black/30"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                >
                                    <Search className="h-12 w-12 text-gray-300 dark:text-[#444]" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">لا توجد نتائج</h3>
                                <p className="text-gray-500 dark:text-[#888] max-w-md mx-auto">جرب البحث بكلمات مختلفة أو تصفح جميع الفئات</p>
                                <motion.button
                                    onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="mt-6 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-red-600 dark:to-red-700 hover:from-primary-500 hover:to-primary-600 dark:hover:from-red-500 dark:hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/20 dark:shadow-red-500/20"
                                >
                                    عرض الكل
                                </motion.button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Featured Teachers */}
                                {featuredTeachers.length > 0 && (
                                    <motion.div
                                        className="mb-12"
                                        initial="hidden"
                                        animate="visible"
                                        variants={fadeInUp}
                                    >
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-red-500/10 shadow-lg shadow-yellow-500/10">
                                                <Award className="h-6 w-6 text-yellow-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المعلمون المميزون</h2>
                                                <p className="text-sm text-gray-500 dark:text-[#888] mt-0.5">أفضل المعلمين المُوصى بهم</p>
                                            </div>
                                        </div>
                                        <motion.div
                                            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            {featuredTeachers.map((teacher, i) => (
                                                <ChannelCard
                                                    key={teacher.id}
                                                    teacher={teacher}
                                                    index={i}
                                                    isSubscribed={subscriptions.has(teacher.id)}
                                                    onSubscribe={() => handleSubscribe(teacher.id)}
                                                    isLoading={subscribingTo === teacher.id}
                                                    featured
                                                    currentUserId={currentUserId}
                                                />
                                            ))}
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* All Teachers */}
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={fadeInUp}
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/20 via-purple-500/15 to-blue-500/10 dark:from-red-500/20 dark:via-orange-500/15 dark:to-yellow-500/10 shadow-lg shadow-primary-500/10 dark:shadow-red-500/10">
                                            <Users className="h-6 w-6 text-primary-500 dark:text-red-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">جميع المعلمين</h2>
                                            <p className="text-sm text-gray-500 dark:text-[#888] mt-0.5">تصفح واكتشف المعلمين</p>
                                        </div>
                                    </div>
                                    <motion.div
                                        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {(featuredTeachers.length > 0 ? regularTeachers : filteredTeachers).map((teacher, i) => (
                                            <ChannelCard
                                                key={teacher.id}
                                                teacher={teacher}
                                                index={i}
                                                isSubscribed={subscriptions.has(teacher.id)}
                                                onSubscribe={() => handleSubscribe(teacher.id)}
                                                isLoading={subscribingTo === teacher.id}
                                                currentUserId={currentUserId}
                                            />
                                        ))}
                                    </motion.div>
                                </motion.div>
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation - YouTube App Style */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#212121]/98 backdrop-blur-xl border-t border-gray-200/80 dark:border-[#3d3d3d]/60 px-1 py-1.5 safe-area-bottom">
                <div className="flex items-center justify-evenly w-full max-w-md mx-auto">
                    <Link href="/" className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-lg text-gray-500 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#3d3d3d] transition-colors">
                        <Home className="h-5 w-5" />
                        <span className="text-[10px] font-medium">الرئيسية</span>
                    </Link>
                    <Link href="/teachers" className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-lg text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10">
                        <Compass className="h-5 w-5" />
                        <span className="text-[10px] font-bold">استكشاف</span>
                    </Link>
                    <Link href="/arabic" className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-lg text-gray-500 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#3d3d3d] transition-colors">
                        <PlaySquare className="h-5 w-5" />
                        <span className="text-[10px] font-medium">الامتحانات</span>
                    </Link>
                    <Link href="/history" className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-lg text-gray-500 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#3d3d3d] transition-colors">
                        <History className="h-5 w-5" />
                        <span className="text-[10px] font-medium">السجل</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}

// Sidebar Link Component
function SidebarLink({ icon: Icon, label, href, active, collapsed }: {
    icon: any; label: string; href: string; active?: boolean; collapsed: boolean
}) {
    return (
        <Link
            href={href}
            className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${active
                ? "bg-gradient-to-l from-gray-100 via-gray-50 to-transparent dark:from-[#272727] dark:via-[#1f1f1f] dark:to-transparent text-gray-900 dark:text-white font-semibold"
                : "text-gray-600 dark:text-[#f1f1f1] hover:bg-gray-100/70 dark:hover:bg-[#272727]/70"
                } ${collapsed ? "justify-center" : ""}`}
        >
            {active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-primary-600 dark:from-red-500 dark:to-red-600 rounded-l-full" />
            )}
            <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${active
                ? "bg-primary-500/10 dark:bg-red-500/10"
                : "group-hover:bg-gray-200/50 dark:group-hover:bg-[#333]/50"
                }`}>
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-primary-600 dark:text-red-500" : "text-gray-500 dark:text-[#aaa] group-hover:text-gray-700 dark:group-hover:text-white"}`} />
            </div>
            {!collapsed && <span className="text-sm">{label}</span>}
        </Link>
    );
}

// YouTube Video-Style Teacher Card Component
function ChannelCard({ teacher, index, isSubscribed, onSubscribe, isLoading, featured, currentUserId }: {
    teacher: Teacher; index: number; isSubscribed: boolean; onSubscribe: () => void; isLoading?: boolean; featured?: boolean; currentUserId?: string | null
}) {
    // Check if this is the user's own profile
    const isOwnProfile = currentUserId === teacher.id;
    return (
        <motion.div
            variants={itemVariants}
            className="group cursor-pointer"
        >
            {/* Card Layout */}
            <div className="relative">
                {/* Thumbnail Container - 16:9 Aspect Ratio */}
                <Link href={`/teachers/${teacher.id}`}>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1c1c24]">
                        {/* Cover Image as Thumbnail */}
                        {teacher.coverImageURL ? (
                            <img
                                src={teacher.coverImageURL}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className={`absolute inset-0 ${featured
                                ? "bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500"
                                : "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700"
                                }`}>
                                {/* Decorative Pattern */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
                                </div>
                                {/* Center Initial */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl sm:text-5xl font-bold text-white/95 drop-shadow-lg">
                                        {teacher.displayName.charAt(0)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                        {/* Featured Badge - Top Right */}
                        {featured && (
                            <div className="absolute top-2 right-2 z-10">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] sm:text-xs font-bold text-black shadow-lg">
                                    <Award className="h-3 w-3" />
                                    <span>مميز</span>
                                </div>
                            </div>
                        )}

                        {/* Exam Count Badge - Bottom Left */}
                        <div className="absolute bottom-2 left-2 z-10">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                                <FileText className="h-3 w-3" />
                                <span>{teacher.examsCount} اختبار</span>
                            </div>
                        </div>

                        {/* Verified Badge - Bottom Right */}
                        {teacher.isVerified && (
                            <div className="absolute bottom-2 right-2 z-10">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 text-white text-[10px] sm:text-xs font-medium shadow-md">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>موثق</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Info Section */}
                <div className="flex gap-3 mt-3 px-1">
                    {/* Avatar */}
                    <Link href={`/teachers/${teacher.id}`} className="flex-shrink-0">
                        <div className="relative">
                            {teacher.photoURL ? (
                                <img
                                    src={teacher.photoURL}
                                    alt={teacher.displayName}
                                    className={`w-9 h-9 rounded-full object-cover transition-transform duration-200 group-hover:scale-105 ${featured ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#0f0f0f]' : ''}`}
                                />
                            ) : (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform duration-200 group-hover:scale-105 ${featured
                                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                                    : "bg-gradient-to-br from-violet-500 to-purple-600"
                                    }`}>
                                    {teacher.displayName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* Title & Meta Info */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <Link href={`/teachers/${teacher.id}`}>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-1">
                                {teacher.displayName}
                                {teacher.isVerified && (
                                    <CheckCircle2 className="inline-block h-3.5 w-3.5 text-violet-500 dark:text-violet-400 mr-1" />
                                )}
                            </h3>
                        </Link>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="hover:text-gray-900 dark:hover:text-white transition-colors">
                                {teacher.specialty || 'معلم'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span>{formatCount(teacher.subscriberCount)} مشترك</span>
                        </div>

                        {/* Subscribe Button - Hidden for own profile */}
                        {!isOwnProfile && (
                            <motion.button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSubscribe(); }}
                                whileHover={{ scale: isLoading ? 1 : 1.03 }}
                                whileTap={{ scale: isLoading ? 1 : 0.97 }}
                                disabled={isLoading}
                                className={`mt-2 px-4 py-1.5 rounded-full font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 ${isLoading
                                    ? "bg-gray-100 dark:bg-[#2a2a30] text-gray-400 dark:text-gray-500 cursor-wait"
                                    : isSubscribed
                                        ? "bg-gray-100 dark:bg-[#2a2a30] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#3a3a40]"
                                        : "bg-violet-600 dark:bg-violet-500 text-white hover:bg-violet-700 dark:hover:bg-violet-600 shadow-md shadow-violet-500/20"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isSubscribed ? (
                                    <>
                                        <UserCheck className="h-3.5 w-3.5" />
                                        <span>مُشترك</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </>
                                ) : (
                                    <span>اشتراك</span>
                                )}
                            </motion.button>
                        )}
                        {/* Show "أنت" badge for own profile */}
                        {isOwnProfile && (
                            <div className="mt-2 px-4 py-1.5 rounded-full font-semibold text-xs bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20 text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                                <span>أنت</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

