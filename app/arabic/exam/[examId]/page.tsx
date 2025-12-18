"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Save,
    Loader2,
    BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
    ArabicComprehensiveExam,
    ExamBlock,
    ArabicExamQuestion,
} from "@/lib/types/exam-templates";

export default function ArabicExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.examId as string;

    const [exam, setExam] = useState<ArabicComprehensiveExam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // Fetch exam
    useEffect(() => {
        const fetchExam = async () => {
            if (!examId) return;
            try {
                // 1. Fetch Exam
                const { data: examData, error: examError } = await supabase
                    .from("comprehensive_exams")
                    .select("*")
                    .eq("type", "arabic_comprehensive_exam")
                    .eq("id", examId)
                    .single();

                if (examError || !examData) throw examError || new Error("Exam not found");

                // Transform snake_case to camelCase
                const transformedExam = {
                    type: examData.type,
                    language: examData.language,
                    usageScope: examData.usage_scope,
                    lessonId: examData.lesson_id,
                    examTitle: examData.exam_title,
                    examDescription: examData.exam_description,
                    totalMarks: examData.total_marks,
                    durationMinutes: examData.duration_minutes,
                    gradingMode: examData.grading_mode,
                    branchTags: examData.branch_tags || [],
                    blocks: (examData.blocks as unknown as ExamBlock[]) || [],
                    isPublished: examData.is_published,
                    createdBy: examData.created_by,
                    createdAt: examData.created_at,
                    updatedAt: examData.updated_at,
                } as unknown as ArabicComprehensiveExam;

                setExam(transformedExam);

                // 2. Start Attempt
                const { data: attemptData, error: attemptError } = await supabase
                    .from("comprehensive_exam_attempts")
                    .insert({
                        exam_id: examData.id,
                        student_id: "anonymous", // Placeholder for auth
                        status: "in_progress",
                        started_at: new Date().toISOString(),
                    } as any)
                    .select("id")
                    .single();

                if (attemptData) setAttemptId(attemptData.id);

                // 3. Set Timer
                if (examData.duration_minutes) {
                    setTimeLeft(examData.duration_minutes * 60);
                }
            } catch (err) {
                console.error("Error loading exam:", err);
                alert("حدث خطأ أثناء تحميل الامتحان");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExam();
    }, [examId]);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Auto-submit when time is up
    useEffect(() => {
        if (timeLeft === 0) {
            handleSubmit();
        }
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const handleSubmit = async () => {
        if (isSubmitting || !attemptId) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from("comprehensive_exam_attempts")
                .update({
                    answers,
                    completed_at: new Date().toISOString(),
                    status: "completed",
                })
                .eq("id", attemptId);

            if (error) throw error;

            router.push(`/arabic/exam/${examId}/results?attemptId=${attemptId}`);
        } catch (err) {
            console.error("Error submitting exam:", err);
            alert("حدث خطأ أثناء تسليم الامتحان");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!exam) return null;

    const currentBlock = exam.blocks[currentBlockIndex];
    const isLastBlock = currentBlockIndex === exam.blocks.length - 1;
    const progress = ((currentBlockIndex + 1) / exam.blocks.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 font-arabic" dir="rtl">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#2e2e3a]">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-md">
                            {exam.examTitle}
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            سؤال {currentBlockIndex + 1} من {exam.blocks.length} (كتل)
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {timeLeft !== null && (
                            <div
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-medium ${timeLeft < 300
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                    }`}
                            >
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(timeLeft)}</span>
                            </div>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            تسليم الامتحان
                        </button>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 dark:bg-[#2e2e3a] w-full">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-emerald-500"
                    />
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-24 space-y-8">
                {/* Block Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentBlock.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Block Text/Context */}
                        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2e2e3a] overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530]">
                                <h2 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-emerald-500" />
                                    {currentBlock.title || "نص السؤال"}
                                </h2>
                            </div>
                            <div className="p-6 text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                                {currentBlock.type === "reading_passage" && (
                                    <div className="whitespace-pre-wrap">{(currentBlock as any).bodyText}</div>
                                )}
                                {currentBlock.type === "poetry_text" && (
                                    <div className="space-y-4 text-center font-amiri">
                                        <h3 className="font-bold text-xl mb-4 text-emerald-700 dark:text-emerald-400">
                                            {(currentBlock as any).poemTitle}
                                        </h3>
                                        {(currentBlock as any).verses.map((v: any, idx: number) => (
                                            <div key={idx} className="flex justify-center gap-8 md:gap-16">
                                                <p>{v.shatrA}</p>
                                                <p>{v.shatrB}</p>
                                            </div>
                                        ))}
                                        <p className="text-sm text-gray-500 mt-4">
                                            - {(currentBlock as any).poet}
                                        </p>
                                    </div>
                                )}
                                {currentBlock.type === "grammar_block" && (
                                    <div className="whitespace-pre-wrap">
                                        {(currentBlock as any).contextText}
                                    </div>
                                )}
                                {currentBlock.type === "expression_block" && (
                                    <div>
                                        <p className="font-bold mb-2 text-emerald-600">المطلوب:</p>
                                        <p>{(currentBlock as any).prompt}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-4">
                            {currentBlock.questions.map((q, qIndex) => (
                                <div
                                    key={q.id}
                                    className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-sm border border-gray-200 dark:border-[#2e2e3a] p-6"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                            {qIndex + 1}
                                        </div>
                                        <div className="flex-1">
                                            {q.type === "mcq" && (
                                                <div className="space-y-4">
                                                    <p className="font-medium text-lg text-gray-900 dark:text-white">
                                                        {(q as any).stem}
                                                    </p>
                                                    <div className="space-y-2">
                                                        {(q as any).options.map((opt: string, optIdx: number) => (
                                                            <label
                                                                key={optIdx}
                                                                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id] === optIdx
                                                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                                    : "border-gray-100 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530]"
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`q-${q.id}`}
                                                                    value={optIdx}
                                                                    checked={answers[q.id] === optIdx}
                                                                    onChange={() => handleAnswerChange(q.id, optIdx)}
                                                                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                                                                />
                                                                <span className="text-gray-800 dark:text-gray-200">
                                                                    {opt}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {(q.type === "maqali" ||
                                                q.type === "comparison_story" ||
                                                q.type === "rhetoric" ||
                                                q.type === "grammar_extraction") && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="font-medium text-lg text-gray-900 dark:text-white mb-2">
                                                                {(q as any).prompt}
                                                            </p>
                                                            {q.type === "comparison_story" && (
                                                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 text-amber-900 dark:text-amber-200 text-sm mb-4">
                                                                    <span className="font-bold block mb-1">
                                                                        من كتاب الأيام:
                                                                    </span>
                                                                    {(q as any).externalSnippet}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <textarea
                                                            rows={6}
                                                            value={answers[q.id] || ""}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                            placeholder="اكتب إجابتك هنا..."
                                                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                                                        />
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-t border-gray-200 dark:border-[#2e2e3a]">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={() => setCurrentBlockIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentBlockIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#353545] transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                        السابق
                    </button>

                    {isLastBlock ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5" />
                            )}
                            إنهاء الامتحان
                        </button>
                    ) : (
                        <button
                            onClick={() =>
                                setCurrentBlockIndex((prev) => Math.min(exam.blocks.length - 1, prev + 1))
                            }
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium hover:shadow-lg transition-all"
                        >
                            التالي
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
