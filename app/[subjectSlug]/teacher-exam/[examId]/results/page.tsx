"use client";

// =============================================
// Teacher Exam Results Page - صفحة نتائج امتحان المدرس
// =============================================

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    XCircle,
    Clock,
    Trophy,
    ArrowLeft,
    ArrowRight,
    RotateCcw,
    Home,
    Target,
    Loader2,
    User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AttemptResult {
    id: string;
    score: number;
    max_score: number;
    percentage: number;
    time_spent_seconds: number;
    submitted_at: string;
    answers: Record<string, any>;
    exam: {
        id: string;
        title: string;
        blocks: any[];
        teacher_name?: string;
    };
}

export default function TeacherExamResultsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;
    const subjectSlug = params.subjectSlug as string;
    const isRTL = subjectSlug !== "english";

    const [result, setResult] = useState<AttemptResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const labels = {
        results: isRTL ? "نتائج الامتحان" : "Exam Results",
        score: isRTL ? "الدرجة" : "Score",
        percentage: isRTL ? "النسبة المئوية" : "Percentage",
        timeSpent: isRTL ? "الوقت المستغرق" : "Time Spent",
        correct: isRTL ? "إجابات صحيحة" : "Correct Answers",
        incorrect: isRTL ? "إجابات خاطئة" : "Incorrect Answers",
        reviewAnswers: isRTL ? "مراجعة الإجابات" : "Review Answers",
        tryAgain: isRTL ? "حاول مرة أخرى" : "Try Again",
        backToSubject: isRTL ? "العودة للمادة" : "Back to Subject",
        backHome: isRTL ? "الرئيسية" : "Home",
        excellent: isRTL ? "ممتاز!" : "Excellent!",
        veryGood: isRTL ? "جيد جداً" : "Very Good",
        good: isRTL ? "جيد" : "Good",
        needsImprovement: isRTL ? "يحتاج تحسين" : "Needs Improvement",
        loading: isRTL ? "جاري التحميل..." : "Loading...",
        error: isRTL ? "حدث خطأ" : "An error occurred",
        noResults: isRTL ? "لا توجد نتائج" : "No results found",
        teacher: isRTL ? "المدرس" : "Teacher",
        pendingGrading: isRTL ? "في انتظار التصحيح" : "Pending Grading",
    };

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError("Not authenticated");
                    return;
                }

                // Fetch attempt first
                const { data: attemptData, error: attemptError } = await supabase
                    .from("teacher_exam_attempts")
                    .select(`
                        id,
                        total_score,
                        max_score,
                        completed_at,
                        answers,
                        status
                    `)
                    .eq("exam_id", examId)
                    .eq("student_id", user.id)
                    .in("status", ["submitted", "graded"])
                    .order("completed_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (attemptError) throw attemptError;

                if (!attemptData) {
                    setError(isRTL ? "لا توجد نتائج" : "No results found");
                    return;
                }

                // Fetch exam separately
                const { data: examData, error: examError } = await supabase
                    .from("teacher_exams")
                    .select(`
                        id,
                        exam_title,
                        blocks,
                        sections,
                        created_by
                    `)
                    .eq("id", examId)
                    .single();

                if (examError) throw examError;

                // Fetch teacher profile if available
                let teacherName = "";
                if (examData?.created_by) {
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("name")
                        .eq("id", examData.created_by)
                        .single();
                    teacherName = (profileData as any)?.name || (profileData as any)?.full_name || "";
                }

                const totalScore = attemptData.total_score || 0;
                const maxScore = attemptData.max_score || 0;

                setResult({
                    id: attemptData.id,
                    score: totalScore,
                    max_score: maxScore,
                    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                    time_spent_seconds: 0,
                    submitted_at: attemptData.completed_at || "",
                    answers: (attemptData.answers as Record<string, unknown>) || {},
                    exam: {
                        id: examData?.id || examId,
                        title: examData?.exam_title || "Exam",
                        blocks: (examData?.blocks || examData?.sections || []) as unknown[],
                        teacher_name: teacherName,
                    },
                });
            } catch (err) {
                console.error("Error fetching results:", err);
                setError(err instanceof Error ? err.message : "Failed to load results");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [examId]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getPerformanceMessage = (percentage: number) => {
        if (percentage >= 90) return labels.excellent;
        if (percentage >= 75) return labels.veryGood;
        if (percentage >= 60) return labels.good;
        return labels.needsImprovement;
    };

    const getPerformanceColor = (percentage: number) => {
        if (percentage >= 90) return "text-green-500";
        if (percentage >= 75) return "text-blue-500";
        if (percentage >= 60) return "text-yellow-500";
        return "text-red-500";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">{labels.loading}</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">
                <div className="text-center">
                    <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600 mb-4">{error || labels.noResults}</p>
                    <button
                        onClick={() => router.push(`/${subjectSlug}`)}
                        className="px-6 py-3 bg-primary-500 text-white rounded-xl"
                    >
                        {labels.backToSubject}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f12] py-8" dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 mb-4">
                        <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {labels.results}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {result.exam.title}
                    </p>
                    {result.exam.teacher_name && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                            <User className="w-4 h-4" />
                            <span>{labels.teacher}: {result.exam.teacher_name}</span>
                        </div>
                    )}
                </motion.div>

                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-8 mb-6"
                >
                    {/* Percentage Circle */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    className="text-gray-200 dark:text-[#2e2e3a]"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={`${result.percentage * 4.4} 440`}
                                    className={getPerformanceColor(result.percentage)}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-bold ${getPerformanceColor(result.percentage)}`}>
                                    {result.percentage}%
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {result.score}/{result.max_score}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Message */}
                    <p className={`text-center text-xl font-semibold mb-6 ${getPerformanceColor(result.percentage)}`}>
                        {getPerformanceMessage(result.percentage)}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-[#0f0f12] rounded-xl p-4 text-center">
                            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">{labels.timeSpent}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatTime(result.time_spent_seconds)}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#0f0f12] rounded-xl p-4 text-center">
                            <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">{labels.score}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {result.score} / {result.max_score}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    <button
                        onClick={() => router.push(`/${subjectSlug}/teacher-exam/${examId}`)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                        {labels.tryAgain}
                    </button>

                    <button
                        onClick={() => router.push(`/${subjectSlug}`)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#3e3e4a] transition-colors"
                    >
                        {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                        {labels.backToSubject}
                    </button>

                    <button
                        onClick={() => router.push("/")}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        {labels.backHome}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
