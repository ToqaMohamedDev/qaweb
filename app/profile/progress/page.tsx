"use client";

/**
 * Learning Progress Page
 * 
 * Shows user's lesson progress and learning statistics
 * Uses the user_lesson_progress table from the database
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    CheckCircle,
    Clock,
    TrendingUp,
    Loader2,
    ArrowRight,
    Play,
    ChevronDown,
    ChevronUp,
    Target,
    Award,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

// ==========================================
// Types
// ==========================================

interface LessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    progress_percentage: number;
    is_completed: boolean;
    last_position: number;
    created_at: string;
    updated_at: string;
    lesson?: {
        id: string;
        title: string;
        description: string | null;
        image_url: string | null;
        subject?: {
            id: string;
            name: string;
            icon: string | null;
            color: string | null;
        };
        stage?: {
            id: string;
            name: string;
        };
    };
}

interface ProgressStats {
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    overallProgress: number;
}

// ==========================================
// Stat Card Component
// ==========================================

function StatCard({
    icon,
    title,
    value,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm"
        >
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </motion.div>
    );
}

// ==========================================
// Progress Bar Component
// ==========================================

function ProgressBar({
    percentage,
    size = "md",
    showLabel = true,
}: {
    percentage: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}) {
    const heights = {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4",
    };

    const getColor = (pct: number) => {
        if (pct >= 100) return "bg-green-500";
        if (pct >= 50) return "bg-violet-500";
        if (pct > 0) return "bg-yellow-500";
        return "bg-gray-300";
    };

    return (
        <div className="w-full">
            <div className={`w-full ${heights[size]} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full ${getColor(percentage)} rounded-full`}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {percentage}% مكتمل
                </p>
            )}
        </div>
    );
}

// ==========================================
// Lesson Progress Card
// ==========================================

function LessonCard({ progress }: { progress: LessonProgress }) {
    const lesson = progress.lesson;
    if (!lesson) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                    {lesson.image_url ? (
                        <img
                            src={lesson.image_url}
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                {lesson.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {lesson.subject && (
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: `${lesson.subject.color}20`,
                                            color: lesson.subject.color || "#8b5cf6",
                                        }}
                                    >
                                        {lesson.subject.name}
                                    </span>
                                )}
                                {lesson.stage && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {lesson.stage.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {progress.is_completed ? (
                            <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        ) : (
                            <Link
                                href={`/lesson/${lesson.id}`}
                                className="shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                            >
                                <Play className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </Link>
                        )}
                    </div>

                    <div className="mt-3">
                        <ProgressBar
                            percentage={progress.progress_percentage}
                            size="sm"
                            showLabel={!progress.is_completed}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ==========================================
// Main Component
// ==========================================

export default function LearningProgressPage() {
    const router = useRouter();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState<LessonProgress[]>([]);
    const [stats, setStats] = useState<ProgressStats>({
        totalLessons: 0,
        completedLessons: 0,
        inProgressLessons: 0,
        overallProgress: 0,
    });

    // Filter state
    const [filter, setFilter] = useState<"all" | "completed" | "in-progress">("all");
    const [showAll, setShowAll] = useState(false);

    // ==========================================
    // Fetch Data
    // ==========================================

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/user/progress', { cache: 'no-store' });
            const result = await res.json();

            if (!result.success) {
                if (result.error === 'Not authenticated') {
                    router.push("/login");
                    return;
                }
                console.error("Error fetching progress:", result.error);
                setIsLoading(false);
                return;
            }

            const { progress: progressData, stats: statsData } = result.data;
            setProgress(progressData || []);

            if (statsData) {
                setStats(statsData);
            }
        } catch (err) {
            console.error("Error fetching progress:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // Filtered Data
    // ==========================================

    const filteredProgress = progress.filter((p) => {
        if (filter === "completed") return p.is_completed;
        if (filter === "in-progress") return !p.is_completed && p.progress_percentage > 0;
        return true;
    });

    const displayedProgress = showAll ? filteredProgress : filteredProgress.slice(0, 6);

    // ==========================================
    // Render
    // ==========================================

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a]" dir="rtl">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <Link href="/profile" className="hover:text-violet-600 transition-colors">
                        الملف الشخصي
                    </Link>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    <span className="text-gray-900 dark:text-white">تقدم التعلم</span>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                            <TrendingUp className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        تقدم التعلم
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        تابع تقدمك في الدروس والمواد المختلفة
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : progress.length === 0 ? (
                    // Empty State
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            لم تبدأ أي درس بعد
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            ابدأ رحلتك التعليمية باستكشاف الدروس المتاحة
                        </p>
                        <Link
                            href="/subjects"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
                        >
                            تصفح الدروس
                            <ArrowRight className="h-4 w-4 rotate-180" />
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={<BarChart3 className="h-5 w-5 text-white" />}
                                title="التقدم الكلي"
                                value={`${stats.overallProgress}%`}
                                color="bg-violet-500"
                            />
                            <StatCard
                                icon={<BookOpen className="h-5 w-5 text-white" />}
                                title="إجمالي الدروس"
                                value={stats.totalLessons}
                                color="bg-blue-500"
                            />
                            <StatCard
                                icon={<CheckCircle className="h-5 w-5 text-white" />}
                                title="مكتملة"
                                value={stats.completedLessons}
                                color="bg-green-500"
                            />
                            <StatCard
                                icon={<Clock className="h-5 w-5 text-white" />}
                                title="قيد التقدم"
                                value={stats.inProgressLessons}
                                color="bg-yellow-500"
                            />
                        </div>

                        {/* Overall Progress Bar */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Target className="h-5 w-5 text-violet-500" />
                                    التقدم الإجمالي
                                </h2>
                                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                    {stats.overallProgress}%
                                </span>
                            </div>
                            <ProgressBar percentage={stats.overallProgress} size="lg" showLabel={false} />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2">
                            {[
                                { key: "all", label: "الكل", count: progress.length },
                                { key: "in-progress", label: "قيد التقدم", count: stats.inProgressLessons },
                                { key: "completed", label: "مكتملة", count: stats.completedLessons },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key as typeof filter)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key
                                        ? "bg-violet-600 text-white"
                                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        {/* Lessons List */}
                        <div className="space-y-3">
                            <AnimatePresence>
                                {displayedProgress.map((p) => (
                                    <LessonCard key={p.id} progress={p} />
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Show More Button */}
                        {filteredProgress.length > 6 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="w-full flex items-center justify-center gap-2 py-3 text-violet-600 dark:text-violet-400 hover:underline"
                            >
                                {showAll ? (
                                    <>
                                        <ChevronUp className="h-4 w-4" />
                                        عرض أقل
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4" />
                                        عرض المزيد ({filteredProgress.length - 6})
                                    </>
                                )}
                            </button>
                        )}

                        {/* Achievement Badge */}
                        {stats.completedLessons >= 5 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center"
                            >
                                <Award className="h-12 w-12 mx-auto mb-3" />
                                <h3 className="text-xl font-bold">إنجاز رائع! 🎉</h3>
                                <p className="mt-1 opacity-90">
                                    أكملت {stats.completedLessons} دروس. استمر في التعلم!
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
