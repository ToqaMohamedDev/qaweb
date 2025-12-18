"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Home, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ExamResultsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const attemptId = searchParams?.get("attemptId");

    const [attempt, setAttempt] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) return;
            try {
                const { data, error } = await supabase
                    .from("comprehensive_exam_attempts")
                    .select("*, exam:comprehensive_exams(exam_title, total_marks)")
                    .eq("id", attemptId)
                    .single();

                if (error) throw error;
                setAttempt(data);
            } catch (err) {
                console.error("Error fetching result", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!attempt) return null;

    // Simple grading status check
    const isGraded = attempt.status === "graded";
    const score = attempt.total_score || 0;
    const total = attempt.exam?.total_marks || 100; // Fallback
    const percentage = Math.round((score / total) * 100);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center p-4 font-arabic" dir="rtl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-[#1c1c24] rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="p-8 text-center space-y-6">
                    <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            تم تسليم الامتحان بنجاح!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {attempt.exam?.exam_title}
                        </p>
                    </div>

                    <div className="py-6 border-t border-b border-gray-100 dark:border-[#2e2e3a]">
                        {isGraded ? (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">النتيجة النهائية</p>
                                <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {score}<span className="text-2xl text-gray-400">/{total}</span>
                                </p>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {percentage}%
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                    بانتظار التصحيح
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    تم حفظ إجاباتك بنجاح. سيتم تصحيح الأسئلة المقالية من قبل المعلم وستظهر النتيجة هنا لاحقاً.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push("/")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#2e2e3a] rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#353545] transition-colors"
                        >
                            <Home className="h-5 w-5" />
                            الرئيسية
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
