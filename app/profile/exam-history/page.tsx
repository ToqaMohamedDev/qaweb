"use client";

/**
 * Exam History Page - تاريخ الامتحانات
 * 
 * Shows all exam attempts for the logged-in student.
 * Uses teacher_exam_attempts and comprehensive_exam_attempts tables.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Trophy,
    Calendar,
    TrendingUp,
    Filter,
    Search,
    Loader2,
    ArrowLeft,
    Eye,
    BarChart3,
    BookOpen,
    GraduationCap,
    Timer,
    Award,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// ==========================================
// Types
// ==========================================
interface ExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    status: string;
    total_score: number | null;
    max_score: number | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string | null;
    exam_title?: string;
    exam_type?: string;
    teacher_name?: string;
    teacher_id?: string;
    source: "teacher" | "comprehensive";
}

interface Stats {
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    bestScore: number;
    passedExams: number;
}

type FilterType = "all" | "completed" | "in_progress" | "passed" | "failed";

// ==========================================
// Animation Variants
// ==========================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

// ==========================================
// Stat Card Component
// ==========================================
function StatCard({
    icon: Icon,
    label,
    value,
    color,
    subValue,
}: {
    icon: typeof Trophy;
    label: string;
    value: string | number;
    color: string;
    subValue?: string;
}) {
    return (
        <motion.div
            variants={itemVariants}
            className="p-4 rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-100 dark:border-gray-800"
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subValue && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</p>
            )}
        </motion.div>
    );
}

// ==========================================
// Exam Attempt Card Component
// ==========================================
function ExamAttemptCard({ attempt }: { attempt: ExamAttempt }) {
    const router = useRouter();
    const isCompleted = attempt.status === "completed";
    const scorePercent = attempt.total_score && attempt.max_score
        ? Math.round((attempt.total_score / attempt.max_score) * 100)
        : null;
    const isPassed = scorePercent !== null && scorePercent >= 60;

    const getScoreColor = (percent: number) => {
        if (percent >= 80) return "text-green-500";
        if (percent >= 60) return "text-blue-500";
        if (percent >= 40) return "text-amber-500";
        return "text-red-500";
    };

    const getScoreBg = (percent: number) => {
        if (percent >= 80) return "bg-green-500";
        if (percent >= 60) return "bg-blue-500";
        if (percent >= 40) return "bg-amber-500";
        return "bg-red-500";
    };

    const formatDate = (date: string | null) => {
        if (!date) return "غير محدد";
        return new Date(date).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getDuration = () => {
        if (!attempt.started_at || !attempt.completed_at) return null;
        const start = new Date(attempt.started_at).getTime();
        const end = new Date(attempt.completed_at).getTime();
        const diff = Math.round((end - start) / 60000);
        return `${diff} دقيقة`;
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-100 dark:border-gray-800 hover:border-primary-500/30 dark:hover:border-primary-500/30 hover:shadow-lg transition-all"
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCompleted
                    ? isPassed
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    : "bg-amber-100 dark:bg-amber-900/30"
                    }`}>
                    {isCompleted ? (
                        isPassed ? (
                            <CheckCircle2 className="w-7 h-7 text-green-500" />
                        ) : (
                            <XCircle className="w-7 h-7 text-red-500" />
                        )
                    ) : (
                        <Clock className="w-7 h-7 text-amber-500" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                                {attempt.exam_title || "امتحان بدون عنوان"}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${attempt.source === "teacher"
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    }`}>
                                    {attempt.source === "teacher" ? (
                                        <GraduationCap className="w-3 h-3" />
                                    ) : (
                                        <BookOpen className="w-3 h-3" />
                                    )}
                                    {attempt.source === "teacher" ? "امتحان معلم" : "امتحان شامل"}
                                </span>
                                {attempt.teacher_name && (
                                    <Link
                                        href={`/teachers/${attempt.teacher_id}`}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-500"
                                    >
                                        {attempt.teacher_name}
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Score */}
                        {isCompleted && scorePercent !== null && (
                            <div className="text-left">
                                <div className={`text-2xl font-bold ${getScoreColor(scorePercent)}`}>
                                    {scorePercent}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {attempt.total_score}/{attempt.max_score}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar for completed */}
                    {isCompleted && scorePercent !== null && (
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${scorePercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${getScoreBg(scorePercent)}`}
                            />
                        </div>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(attempt.completed_at || attempt.started_at)}
                        </span>
                        {getDuration() && (
                            <span className="flex items-center gap-1">
                                <Timer className="w-4 h-4" />
                                {getDuration()}
                            </span>
                        )}
                        {!isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                قيد التنفيذ
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => {
                        if (attempt.source === "teacher") {
                            router.push(`/arabic/teacher-exam/${attempt.exam_id}`);
                        } else {
                            router.push(`/arabic/exam/${attempt.exam_id}`);
                        }
                    }}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-primary-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <Eye className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
}

// ==========================================
// Main Component
// ==========================================
export default function ExamHistoryPage() {
    const { user } = useAuth();
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "score">("date");

    // Fetch attempts
    useEffect(() => {
        if (!user) return;

        const fetchAttempts = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();

                // Fetch teacher exam attempts - استخدام query منفصل لتجنب مشاكل العلاقات
                const { data: teacherAttempts, error: teacherError } = await supabase
                    .from("teacher_exam_attempts")
                    .select("id, exam_id, student_id, status, total_score, max_score, started_at, completed_at, created_at")
                    .eq("student_id", user.id)
                    .order("created_at", { ascending: false });

                if (teacherError) {
                    console.error("Error fetching teacher attempts:", teacherError);
                }

                // جلب بيانات الامتحانات المرتبطة
                const teacherExamIds = (teacherAttempts || []).map(a => a.exam_id);
                let teacherExamsData: Record<string, any> = {};

                if (teacherExamIds.length > 0) {
                    const { data: exams } = await supabase
                        .from("teacher_exams")
                        .select("id, exam_title, type, created_by")
                        .in("id", teacherExamIds);

                    if (exams) {
                        // جلب بيانات المدرسين
                        const teacherIds = [...new Set(exams.map(e => e.created_by).filter(Boolean))];
                        let teachersData: Record<string, any> = {};

                        if (teacherIds.length > 0) {
                            const { data: teachers } = await supabase
                                .from("profiles")
                                .select("id, name")
                                .in("id", teacherIds);

                            if (teachers) {
                                teachersData = Object.fromEntries(teachers.map(t => [t.id, t]));
                            }
                        }

                        teacherExamsData = Object.fromEntries(
                            exams.map(e => [e.id, { ...e, teacher: teachersData[e.created_by] }])
                        );
                    }
                }

                // Fetch comprehensive exam attempts
                const { data: compAttempts, error: compError } = await supabase
                    .from("comprehensive_exam_attempts")
                    .select("id, exam_id, student_id, status, total_score, max_score, started_at, completed_at, created_at")
                    .eq("student_id", user.id)
                    .order("created_at", { ascending: false });

                if (compError) {
                    console.error("Error fetching comprehensive attempts:", JSON.stringify(compError, null, 2));
                }

                // Fetch comprehensive exam details separately
                const compExamIds = (compAttempts || []).map(a => a.exam_id);
                let compExamsData: Record<string, any> = {};

                if (compExamIds.length > 0) {
                    const { data: exams } = await supabase
                        .from("comprehensive_exams")
                        .select("id, exam_title, type")
                        .in("id", compExamIds);

                    if (exams) {
                        compExamsData = Object.fromEntries(exams.map(e => [e.id, e]));
                    }
                }

                // Combine and normalize data
                const normalizedTeacher: ExamAttempt[] = (teacherAttempts || []).map((a: any) => {
                    const examData = teacherExamsData[a.exam_id];
                    return {
                        id: a.id,
                        exam_id: a.exam_id,
                        student_id: a.student_id,
                        status: a.status,
                        total_score: a.total_score,
                        max_score: a.max_score,
                        started_at: a.started_at,
                        completed_at: a.completed_at,
                        created_at: a.created_at,
                        exam_title: examData?.exam_title,
                        exam_type: examData?.type,
                        teacher_name: examData?.teacher?.name,
                        teacher_id: examData?.teacher?.id,
                        source: "teacher" as const,
                    };
                });

                const normalizedComp: ExamAttempt[] = (compAttempts || []).map((a: any) => {
                    const examData = compExamsData[a.exam_id];
                    return {
                        id: a.id,
                        exam_id: a.exam_id,
                        student_id: a.student_id,
                        status: a.status,
                        total_score: a.total_score,
                        max_score: a.max_score,
                        started_at: a.started_at,
                        completed_at: a.completed_at,
                        created_at: a.created_at,
                        exam_title: examData?.exam_title,
                        exam_type: examData?.type,
                        source: "comprehensive" as const,
                    };
                });

                setAttempts([...normalizedTeacher, ...normalizedComp]);
            } catch (error) {
                console.error("Error fetching attempts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttempts();
    }, [user]);

    // Calculate stats
    const stats: Stats = {
        totalAttempts: attempts.length,
        completedAttempts: attempts.filter((a) => a.status === "completed").length,
        averageScore: (() => {
            const completed = attempts.filter((a) => a.total_score !== null && a.max_score !== null);
            if (completed.length === 0) return 0;
            const avg = completed.reduce((sum, a) => sum + ((a.total_score! / a.max_score!) * 100), 0) / completed.length;
            return Math.round(avg);
        })(),
        bestScore: (() => {
            const completed = attempts.filter((a) => a.total_score !== null && a.max_score !== null);
            if (completed.length === 0) return 0;
            return Math.max(...completed.map((a) => Math.round((a.total_score! / a.max_score!) * 100)));
        })(),
        passedExams: attempts.filter((a) => {
            if (a.total_score === null || a.max_score === null) return false;
            return (a.total_score / a.max_score) >= 0.6;
        }).length,
    };

    // Filter and sort
    const filteredAttempts = attempts
        .filter((a) => {
            if (filter === "completed") return a.status === "completed";
            if (filter === "in_progress") return a.status === "in_progress";
            if (filter === "passed") {
                return a.total_score !== null && a.max_score !== null && (a.total_score / a.max_score) >= 0.6;
            }
            if (filter === "failed") {
                return a.total_score !== null && a.max_score !== null && (a.total_score / a.max_score) < 0.6;
            }
            return true;
        })
        .filter((a) => {
            if (!searchQuery) return true;
            return a.exam_title?.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
            if (sortBy === "date") {
                return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
            }
            const scoreA = a.total_score && a.max_score ? (a.total_score / a.max_score) : 0;
            const scoreB = b.total_score && b.max_score ? (b.total_score / b.max_score) : 0;
            return scoreB - scoreA;
        });

    const filterButtons: { key: FilterType; label: string }[] = [
        { key: "all", label: "الكل" },
        { key: "completed", label: "مكتمل" },
        { key: "in_progress", label: "قيد التنفيذ" },
        { key: "passed", label: "ناجح" },
        { key: "failed", label: "راسب" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0f1a] dark:via-[#0f172a] dark:to-[#0a0f1a]" dir="rtl">
            <Navbar />

            <section className="pt-28 pb-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
                            <BarChart3 className="w-4 h-4" />
                            <span>إحصائياتك التعليمية</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            تاريخ <span className="gradient-text">الامتحانات</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            تابع جميع محاولاتك ونتائجك في الامتحانات
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
                    >
                        <StatCard
                            icon={FileText}
                            label="إجمالي المحاولات"
                            value={stats.totalAttempts}
                            color="from-blue-500 to-cyan-500"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="امتحانات مكتملة"
                            value={stats.completedAttempts}
                            color="from-green-500 to-emerald-500"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="متوسط الدرجات"
                            value={`${stats.averageScore}%`}
                            color="from-purple-500 to-pink-500"
                        />
                        <StatCard
                            icon={Trophy}
                            label="أفضل درجة"
                            value={`${stats.bestScore}%`}
                            color="from-amber-500 to-orange-500"
                        />
                        <StatCard
                            icon={Award}
                            label="امتحانات ناجحة"
                            value={stats.passedExams}
                            color="from-teal-500 to-green-500"
                            subValue={`من ${stats.completedAttempts}`}
                        />
                    </motion.div>

                    {/* Filters & Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-[#0f172a]/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6"
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ابحث عن امتحان..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                                {filterButtons.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === key
                                            ? "bg-primary-500 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as "date" | "score")}
                                className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none"
                            >
                                <option value="date">الأحدث</option>
                                <option value="score">أعلى درجة</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Attempts List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </div>
                    ) : filteredAttempts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {searchQuery || filter !== "all"
                                    ? "لا توجد نتائج"
                                    : "لم تقم بأي امتحان بعد"
                                }
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {searchQuery || filter !== "all"
                                    ? "جرب البحث بكلمات مختلفة أو غير الفلتر"
                                    : "ابدأ رحلتك التعليمية الآن وخذ أول امتحان"
                                }
                            </p>
                            <Link
                                href="/teachers"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                            >
                                <GraduationCap className="w-5 h-5" />
                                استكشف المعلمين
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            {filteredAttempts.map((attempt) => (
                                <ExamAttemptCard key={attempt.id} attempt={attempt} />
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
