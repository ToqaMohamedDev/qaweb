"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useStudentExam, useExamAttempt } from "@/lib/queries/useExamQueries";
import { LoadingSpinner } from "@/components/shared";
import { CheckCircle2, XCircle, ArrowRight, Award, AlertTriangle, BookOpen } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";

export default function ExamResultsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const examId = params?.examId as string;
    const attemptId = searchParams.get("attemptId");

    const { data: exam, isLoading: isExamLoading } = useStudentExam(examId);
    const { data: attempt, isLoading: isAttemptLoading } = useExamAttempt(attemptId);

    const isLoading = isExamLoading || isAttemptLoading;

    // Calculate Results
    const results = useMemo(() => {
        if (!exam || !attempt) return null;

        let totalPoints = 0;
        let earnedPoints = 0;
        let correctCount = 0;
        let wrongCount = 0;

        const details = exam.blocks.flatMap(block =>
            block.questions.map(q => {
                const answers = attempt.answers as Record<string, any>;
                const userAnswer = answers?.[q.id];

                // Determine grading type
                const isMCQ = q.type === 'mcq' || q.type === 'true_false';
                let isCorrect = false;

                if (isMCQ) {
                    // Index based grading for MCQ and True/False
                    // We assume userAnswer is the index relative to the options array
                    if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
                        isCorrect = Number(userAnswer) === Number(q.correctIndex);
                    }
                } else {
                    // Text based grading for others
                    const normalize = (s: unknown) => String(s || '').trim().toLowerCase();
                    const uAns = normalize(userAnswer);
                    // Check against direct correct answer or option text (if options exist but it's not index based, though usually non-MCQ are text)
                    // Our transformer puts text answer in q.correctAnswer
                    const cAns = normalize(q.correctAnswer);

                    if (uAns && cAns) {
                        isCorrect = uAns === cAns;
                    }
                }

                if (isCorrect) {
                    earnedPoints += q.points;
                    correctCount++;
                } else {
                    wrongCount++;
                }
                totalPoints += q.points;

                return {
                    question: q,
                    userAnswer,
                    isCorrect,
                    blockTitle: block.title,
                    isIndexBased: isMCQ
                };
            })
        );

        return {
            totalPoints,
            earnedPoints,
            correctCount,
            wrongCount,
            percentage: totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0,
            details
        };

    }, [exam, attempt]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f]">
                <LoadingSpinner size="lg" text="جاري حساب النتيجة..." />
            </div>
        );
    }

    if (!exam || !results) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0f] p-4 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">عذراً، لم يتم العثور على النتيجة</h2>
                <Link href="/arabic" className="text-violet-600 hover:underline">العودة للرئيسية</Link>
            </div>
        );
    }

    const gradeColor = results.percentage >= 90 ? 'text-emerald-500' :
        results.percentage >= 75 ? 'text-blue-500' :
            results.percentage >= 50 ? 'text-yellow-500' : 'text-red-500';

    const gradeText = results.percentage >= 90 ? 'ممتاز' :
        results.percentage >= 75 ? 'جيد جداً' :
            results.percentage >= 50 ? 'جيد' : 'يحتاج للتحسن';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] py-12 px-4" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1c1c24] rounded-3xl shadow-xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8 text-white text-center">
                        <h1 className="text-2xl font-bold mb-2">{exam.examTitle}</h1>
                        <p className="opacity-90">نتيجة الاختبار</p>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-gray-800 flex items-center justify-center mb-4 bg-gray-50 dark:bg-[#252530]">
                            <div className="text-center">
                                <span className={`block text-3xl font-bold ${gradeColor}`}>
                                    {Math.round(results.percentage)}%
                                </span>
                                <span className="text-xs text-gray-400 font-medium">{results.earnedPoints} من {results.totalPoints}</span>
                            </div>
                        </div>

                        <h2 className={`text-2xl font-bold mb-2 ${gradeColor}`}>{gradeText}</h2>

                        <div className="flex gap-8 mt-6 w-full justify-center text-center">
                            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 w-32">
                                <span className="block text-2xl font-bold text-green-600 dark:text-green-400">{results.correctCount}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">إجابة صحيحة</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 w-32">
                                <span className="block text-2xl font-bold text-red-600 dark:text-red-400">{results.wrongCount}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">إجابة خاطئة</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Detailed Breakdown */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white px-2">تفاصيل الإجابات</h3>

                    {results.details.map((detail, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={detail.question.id}
                            className={`bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border-r-4 shadow-sm ${detail.isCorrect ? 'border-green-500' : 'border-red-500'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${detail.isCorrect ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="mb-3">
                                        <p className="text-gray-800 dark:text-gray-200 font-medium text-lg leading-relaxed">
                                            {detail.question.stem}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {/* User Answer */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500 w-24">إجابتك:</span>
                                            {detail.isIndexBased ? (
                                                <span className={`font-semibold ${detail.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                    {detail.question.options[Number(detail.userAnswer)] || <span className="text-gray-400 italic">لم يتم الإجابة</span>}
                                                </span>
                                            ) : (
                                                <span className={`font-semibold ${detail.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                    {String(detail.userAnswer || '') || <span className="text-gray-400 italic">لا توجد إجابة</span>}
                                                </span>
                                            )}
                                        </div>

                                        {/* Reference Text (e.g. for parsing or extraction) */}
                                        {detail.question.underlinedWord && (
                                            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg -mx-2">
                                                <span className="text-gray-500 w-24">الكلمة:</span>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{detail.question.underlinedWord}</span>
                                            </div>
                                        )}

                                        {/* Correct Answer (Show if wrong) */}
                                        {!detail.isCorrect && (
                                            <div className="flex flex-col gap-2 bg-green-50 dark:bg-green-900/10 p-3 rounded-lg -mx-2 mt-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <span className="text-gray-500 w-24">الإجابة الصحيحة:</span>
                                                    <span className="font-semibold text-green-700 dark:text-green-400">
                                                        {detail.isIndexBased && detail.question.correctIndex !== undefined
                                                            ? detail.question.options[detail.question.correctIndex]
                                                            : detail.question.correctAnswer
                                                        }
                                                    </span>
                                                </div>
                                                {detail.question.explanation && (
                                                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 border-t border-green-100 dark:border-green-800/30 pt-2">
                                                        <BookOpen className="h-4 w-4 mt-0.5" />
                                                        <span>{detail.question.explanation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center min-w-[3rem]">
                                    {detail.isCorrect ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                                    )}
                                    <span className="text-xs text-gray-400 font-medium">
                                        {detail.isCorrect ? detail.question.points : 0} / {detail.question.points}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex justify-center pt-8">
                    <Link
                        href="/arabic"
                        className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                    >
                        <span>العودة للرئيسية</span>
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
