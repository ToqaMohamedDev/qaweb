"use client";

// =============================================
// Question Bank Practice Results Page
// صفحة نتائج تدريب بنك الأسئلة
// =============================================

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    XCircle,
    ArrowLeft,
    ArrowRight,
    RotateCcw,
    Home,
    Loader2,
    CheckCircle,
    BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PracticeResult {
    id: string;
    correct_count: number;
    total_questions: number;
    score_percentage: number;
    completed_at: string | null;
    bank: {
        id: string;
        title: { ar: string; en: string };
    };
}

export default function QuestionBankResultsPage() {
    const params = useParams();
    const router = useRouter();
    const bankId = params.bankId as string;
    const subjectSlug = params.subjectSlug as string;
    const isRTL = subjectSlug !== "english";

    const [result, setResult] = useState<PracticeResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const labels = {
        results: isRTL ? "نتائج التدريب" : "Practice Results",
        score: isRTL ? "الدرجة" : "Score",
        correct: isRTL ? "إجابات صحيحة" : "Correct Answers",
        total: isRTL ? "الإجمالي" : "Total",
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
        practiceComplete: isRTL ? "انتهى التدريب" : "Practice Complete",
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

                const { data, error: fetchError } = await supabase
                    .from("question_bank_attempts" as any)
                    .select(`
                        id,
                        correct_count,
                        total_questions,
                        score_percentage,
                        completed_at,
                        question_banks:question_bank_id (
                            id,
                            title
                        )
                    `)
                    .eq("question_bank_id", bankId)
                    .eq("student_id", user.id)
                    .eq("status", "completed")
                    .order("completed_at", { ascending: false })
                    .limit(1)
                    .single();

                if (fetchError) throw fetchError;

                if (data) {
                    const bank = (data as any).question_banks;
                    setResult({
                        id: (data as any).id,
                        correct_count: (data as any).correct_count || 0,
                        total_questions: (data as any).total_questions || 0,
                        score_percentage: (data as any).score_percentage || 0,
                        completed_at: (data as any).completed_at,
                        bank: {
                            id: bank?.id,
                            title: bank?.title || { ar: "بنك الأسئلة", en: "Question Bank" },
                        },
                    });
                }
            } catch (err) {
                console.error("Error fetching results:", err);
                setError(err instanceof Error ? err.message : "Failed to load results");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [bankId]);

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

    const bankTitle = isRTL ? result.bank.title.ar : result.bank.title.en;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f12] py-8" dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {labels.practiceComplete}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {bankTitle}
                    </p>
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
                                    strokeDasharray={`${result.score_percentage * 4.4} 440`}
                                    className={getPerformanceColor(result.score_percentage)}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-bold ${getPerformanceColor(result.score_percentage)}`}>
                                    {Math.round(result.score_percentage)}%
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {result.correct_count}/{result.total_questions}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Message */}
                    <p className={`text-center text-xl font-semibold mb-6 ${getPerformanceColor(result.score_percentage)}`}>
                        {getPerformanceMessage(result.score_percentage)}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-[#0f0f12] rounded-xl p-4 text-center">
                            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">{labels.correct}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {result.correct_count}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#0f0f12] rounded-xl p-4 text-center">
                            <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">{labels.total}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {result.total_questions}
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
                        onClick={() => router.push(`/${subjectSlug}/question-bank/${bankId}`)}
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
