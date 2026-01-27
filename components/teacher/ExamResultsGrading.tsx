"use client";

// =============================================
// Teacher Exam Results Grading Component
// صفحة تصحيح نتائج الامتحانات للمدرس
// =============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    Save,
    Loader2,
    User,
    AlertCircle,
    CheckCircle,
    FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { QuestionAnswer } from "@/lib/types/attempts.types";

interface ExamResultsGradingProps {
    examId: string;
    language?: "arabic" | "english";
}

interface StudentAttempt {
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    answers: Record<string, QuestionAnswer>;
    status: string;
    total_score: number | null;
    max_score: number | null;
    percentage: number | null;
    completed_at: string | null;
}

interface ExamQuestion {
    id: string;
    type: string;
    text: string;
    textAr?: string;
    textEn?: string;
    options?: Array<{ id: string; text: string }>;
    correctAnswer?: string | number;
    points: number;
}

interface ExamData {
    id: string;
    title: string;
    blocks: Array<{
        id: string;
        titleAr?: string;
        titleEn?: string;
        questions: ExamQuestion[];
    }>;
}

export function ExamResultsGrading({ examId, language = "arabic" }: ExamResultsGradingProps) {
    const isRTL = language === "arabic";

    // State
    const [exam, setExam] = useState<ExamData | null>(null);
    const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
    const [selectedAttempt, setSelectedAttempt] = useState<StudentAttempt | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Grading state for essay questions
    const [gradingData, setGradingData] = useState<Record<string, { points: number; comment: string }>>({});

    const labels = {
        title: isRTL ? "تصحيح الامتحان" : "Exam Grading",
        students: isRTL ? "الطلاب" : "Students",
        noStudents: isRTL ? "لا يوجد طلاب" : "No students",
        selectStudent: isRTL ? "اختر طالب للتصحيح" : "Select a student to grade",
        question: isRTL ? "السؤال" : "Question",
        of: isRTL ? "من" : "of",
        studentAnswer: isRTL ? "إجابة الطالب" : "Student Answer",
        correctAnswer: isRTL ? "الإجابة الصحيحة" : "Correct Answer",
        noAnswer: isRTL ? "لم يجب" : "No answer",
        points: isRTL ? "درجة" : "pts",
        score: isRTL ? "الدرجة" : "Score",
        comment: isRTL ? "تعليق" : "Comment",
        save: isRTL ? "حفظ" : "Save",
        saving: isRTL ? "جاري الحفظ..." : "Saving...",
        saved: isRTL ? "تم الحفظ" : "Saved",
        previous: isRTL ? "السابق" : "Previous",
        next: isRTL ? "التالي" : "Next",
        finishGrading: isRTL ? "إنهاء التصحيح" : "Finish Grading",
        loading: isRTL ? "جاري التحميل..." : "Loading...",
        error: isRTL ? "حدث خطأ" : "An error occurred",
        graded: isRTL ? "تم التصحيح" : "Graded",
        pending: isRTL ? "قيد الانتظار" : "Pending",
        submitted: isRTL ? "تم التسليم" : "Submitted",
        autoGraded: isRTL ? "تصحيح تلقائي" : "Auto-graded",
        manualGrading: isRTL ? "يحتاج تصحيح يدوي" : "Needs manual grading",
    };

    // Fetch exam and attempts
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch exam data
                const { data: examData, error: examError } = await supabase
                    .from("teacher_exams")
                    .select("id, exam_title, blocks")
                    .eq("id", examId)
                    .single();

                if (examError) throw examError;

                setExam({
                    id: examData.id,
                    title: examData.exam_title || "Exam",
                    blocks: (examData.blocks as unknown as ExamData["blocks"]) || [],
                });

                // Fetch student attempts
                const { data: attemptsData, error: attemptsError } = await supabase
                    .from("teacher_exam_attempts" as any)
                    .select(`
                        id,
                        student_id,
                        answers,
                        status,
                        total_score,
                        max_score,
                        percentage,
                        completed_at,
                        profiles:student_id (
                            full_name,
                            email
                        )
                    `)
                    .eq("exam_id", examId)
                    .in("status", ["submitted", "graded"])
                    .order("completed_at", { ascending: false });

                if (attemptsError) throw attemptsError;

                const formattedAttempts: StudentAttempt[] = ((attemptsData as any[]) || []).map((a) => ({
                    id: a.id,
                    student_id: a.student_id,
                    student_name: a.profiles?.full_name || "Unknown",
                    student_email: a.profiles?.email || "",
                    answers: a.answers || {},
                    status: a.status,
                    total_score: a.total_score,
                    max_score: a.max_score,
                    percentage: a.percentage,
                    completed_at: a.completed_at,
                }));

                setAttempts(formattedAttempts);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId]);

    // Get all questions from exam blocks
    const allQuestions: ExamQuestion[] = exam?.blocks.flatMap((block) => block.questions || []) || [];
    const currentQuestion = allQuestions[currentQuestionIndex];
    const totalQuestions = allQuestions.length;

    // Get question text
    const getQuestionText = (q: ExamQuestion) => {
        return q.text || (isRTL ? q.textAr : q.textEn) || "";
    };

    // Check if question needs manual grading
    const needsManualGrading = (q: ExamQuestion) => {
        return q.type === "essay" || q.type === "maqali" || q.type === "text";
    };

    // Get student's answer for current question
    const getStudentAnswer = (questionId: string): QuestionAnswer | null => {
        if (!selectedAttempt) return null;
        return selectedAttempt.answers[questionId] || null;
    };

    // Save grading for essay question
    const saveGrading = useCallback(async (questionId: string) => {
        if (!selectedAttempt || !gradingData[questionId]) return;

        setSaving(true);
        try {
            const { data, error: rpcError } = await supabase.rpc("grade_teacher_exam_essay" as any, {
                p_attempt_id: selectedAttempt.id,
                p_question_id: questionId,
                p_points_earned: gradingData[questionId].points,
                p_comment: gradingData[questionId].comment || null,
            });

            if (rpcError) throw rpcError;

            // Update local state
            setSelectedAttempt((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    answers: {
                        ...prev.answers,
                        [questionId]: {
                            ...prev.answers[questionId],
                            manual: {
                                is_correct: gradingData[questionId].points > 0,
                                points_earned: gradingData[questionId].points,
                                max_points: currentQuestion?.points || 0,
                                comment: gradingData[questionId].comment || null,
                                graded_by: null,
                                graded_at: new Date().toISOString(),
                            },
                        },
                    },
                };
            });
        } catch (err) {
            console.error("Error saving grade:", err);
            setError(err instanceof Error ? err.message : "Failed to save grade");
        } finally {
            setSaving(false);
        }
    }, [selectedAttempt, gradingData, currentQuestion]);

    // Navigate questions
    const goToNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    // Finish grading and update attempt status
    const finishGrading = async () => {
        if (!selectedAttempt) return;

        setSaving(true);
        try {
            const { error: updateError } = await supabase
                .from("teacher_exam_attempts" as any)
                .update({ status: "graded" })
                .eq("id", selectedAttempt.id);

            if (updateError) throw updateError;

            // Update local state
            setAttempts((prev) =>
                prev.map((a) =>
                    a.id === selectedAttempt.id ? { ...a, status: "graded" } : a
                )
            );
            setSelectedAttempt((prev) => (prev ? { ...prev, status: "graded" } : null));
        } catch (err) {
            console.error("Error finishing grading:", err);
            setError(err instanceof Error ? err.message : "Failed to finish grading");
        } finally {
            setSaving(false);
        }
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

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f12]" dir={isRTL ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#2e2e3a]">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {labels.title}: {exam?.title}
                    </h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Students List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-[#2e2e3a]">
                                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    {labels.students} ({attempts.length})
                                </h2>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {attempts.length === 0 ? (
                                    <p className="p-4 text-center text-gray-500">{labels.noStudents}</p>
                                ) : (
                                    attempts.map((attempt) => (
                                        <button
                                            key={attempt.id}
                                            onClick={() => {
                                                setSelectedAttempt(attempt);
                                                setCurrentQuestionIndex(0);
                                            }}
                                            className={`w-full p-4 text-start border-b border-gray-100 dark:border-[#2e2e3a] last:border-0 transition-colors ${
                                                selectedAttempt?.id === attempt.id
                                                    ? "bg-primary-50 dark:bg-primary-900/20"
                                                    : "hover:bg-gray-50 dark:hover:bg-[#2e2e3a]"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {attempt.student_name}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        attempt.status === "graded"
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    }`}
                                                >
                                                    {attempt.status === "graded" ? labels.graded : labels.submitted}
                                                </span>
                                            </div>
                                            {attempt.percentage !== null && (
                                                <div className="text-sm text-gray-500">
                                                    {attempt.total_score}/{attempt.max_score} ({attempt.percentage}%)
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grading Panel */}
                    <div className="lg:col-span-3">
                        {!selectedAttempt ? (
                            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-12 text-center">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-gray-500 dark:text-gray-400">{labels.selectStudent}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Question Progress */}
                                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-gray-500">
                                            {labels.question} {currentQuestionIndex + 1} {labels.of} {totalQuestions}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {allQuestions.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentQuestionIndex(idx)}
                                                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                                        idx === currentQuestionIndex
                                                            ? "bg-primary-500 text-white"
                                                            : getStudentAnswer(allQuestions[idx]?.id)
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-gray-100 text-gray-600 dark:bg-[#2e2e3a] dark:text-gray-400"
                                                    }`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Question Card */}
                                {currentQuestion && (
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentQuestionIndex}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6"
                                        >
                                            {/* Question Text */}
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-500">
                                                        {currentQuestion.points} {labels.points}
                                                    </span>
                                                    {needsManualGrading(currentQuestion) ? (
                                                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                                                            {labels.manualGrading}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                                            {labels.autoGraded}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                                    {getQuestionText(currentQuestion)}
                                                </p>
                                            </div>

                                            {/* Student Answer */}
                                            <div className="mb-6 p-4 bg-gray-50 dark:bg-[#0f0f12] rounded-xl">
                                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {labels.studentAnswer}
                                                </h3>
                                                {(() => {
                                                    const answer = getStudentAnswer(currentQuestion.id);
                                                    if (!answer) {
                                                        return (
                                                            <p className="text-gray-400 italic">{labels.noAnswer}</p>
                                                        );
                                                    }

                                                    const answerValue = answer.answer;
                                                    if (typeof answerValue === "string") {
                                                        return (
                                                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                                                {answerValue}
                                                            </p>
                                                        );
                                                    }

                                                    // For MCQ, show selected option
                                                    if (currentQuestion.options) {
                                                        const selectedOption = currentQuestion.options.find(
                                                            (opt) => opt.id === answerValue || opt.text === answerValue
                                                        );
                                                        return (
                                                            <p className="text-gray-900 dark:text-white">
                                                                {selectedOption?.text || String(answerValue)}
                                                            </p>
                                                        );
                                                    }

                                                    return (
                                                        <p className="text-gray-900 dark:text-white">
                                                            {String(answerValue)}
                                                        </p>
                                                    );
                                                })()}

                                                {/* Auto grading result */}
                                                {getStudentAnswer(currentQuestion.id)?.auto && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#2e2e3a]">
                                                        <div className="flex items-center gap-2">
                                                            {getStudentAnswer(currentQuestion.id)?.auto?.is_correct ? (
                                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                            ) : (
                                                                <X className="w-5 h-5 text-red-500" />
                                                            )}
                                                            <span className="text-sm">
                                                                {getStudentAnswer(currentQuestion.id)?.auto?.points_earned}/
                                                                {getStudentAnswer(currentQuestion.id)?.auto?.max_points} {labels.points}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Correct Answer (for auto-graded questions) */}
                                            {!needsManualGrading(currentQuestion) && currentQuestion.correctAnswer && (
                                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                    <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                                                        {labels.correctAnswer}
                                                    </h3>
                                                    <p className="text-green-800 dark:text-green-200">
                                                        {(() => {
                                                            if (currentQuestion.options) {
                                                                const correctOption = currentQuestion.options.find(
                                                                    (opt) =>
                                                                        opt.id === currentQuestion.correctAnswer ||
                                                                        opt.text === currentQuestion.correctAnswer
                                                                );
                                                                return correctOption?.text || String(currentQuestion.correctAnswer);
                                                            }
                                                            return String(currentQuestion.correctAnswer);
                                                        })()}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Manual Grading Form */}
                                            {needsManualGrading(currentQuestion) && (
                                                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            {labels.score} (0 - {currentQuestion.points})
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={currentQuestion.points}
                                                            value={gradingData[currentQuestion.id]?.points ?? ""}
                                                            onChange={(e) =>
                                                                setGradingData((prev) => ({
                                                                    ...prev,
                                                                    [currentQuestion.id]: {
                                                                        ...prev[currentQuestion.id],
                                                                        points: Math.min(
                                                                            Math.max(0, parseInt(e.target.value) || 0),
                                                                            currentQuestion.points
                                                                        ),
                                                                    },
                                                                }))
                                                            }
                                                            className="w-full px-4 py-2 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl focus:ring-2 focus:ring-primary-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            {labels.comment}
                                                        </label>
                                                        <textarea
                                                            value={gradingData[currentQuestion.id]?.comment ?? ""}
                                                            onChange={(e) =>
                                                                setGradingData((prev) => ({
                                                                    ...prev,
                                                                    [currentQuestion.id]: {
                                                                        ...prev[currentQuestion.id],
                                                                        comment: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            rows={3}
                                                            className="w-full px-4 py-2 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl resize-none focus:ring-2 focus:ring-primary-500"
                                                            dir={isRTL ? "rtl" : "ltr"}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => saveGrading(currentQuestion.id)}
                                                        disabled={saving}
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                                                    >
                                                        {saving ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                {labels.saving}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="w-4 h-4" />
                                                                {labels.save}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                )}

                                {/* Navigation */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={goToPrevious}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#3e3e4a] transition-colors"
                                    >
                                        {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                                        {labels.previous}
                                    </button>

                                    {currentQuestionIndex === totalQuestions - 1 ? (
                                        <button
                                            onClick={finishGrading}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Check className="w-5 h-5" />
                                            )}
                                            {labels.finishGrading}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={goToNext}
                                            className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                                        >
                                            {labels.next}
                                            {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
