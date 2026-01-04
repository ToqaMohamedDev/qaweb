"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";

// ─── Local State Types ───
interface TeacherExamState {
    id: string;
    examTitle: string;
    examDescription?: string | null;
    durationMinutes?: number | null;
    totalMarks?: number | null;
    passingScore?: number | null;
    sections: any[]; // Dynamic structure from database
}

export default function EnglishTeacherExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.examId as string;

    const [exam, setExam] = useState<TeacherExamState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    // Use refs to avoid dependency cycles for auto-submit
    const attemptIdRef = useRef<string | null>(null);
    const answersRef = useRef<Record<string, any>>({});

    // State to track if this is a practice mode (already completed before)
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [previousResult, setPreviousResult] = useState<{ score: number; maxScore: number } | null>(null);

    useEffect(() => {
        attemptIdRef.current = attemptId;
    }, [attemptId]);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    const handleSubmitRef = useRef<() => Promise<void>>(async () => { });

    // 1. Check Auth & Fetch Exam
    useEffect(() => {
        const initPage = async () => {
            if (!examId) return;
            try {
                // Auth Check
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!currentUser) {
                    router.push(`/login?returnUrl=/english/teacher-exam/${examId}`);
                    return;
                }
                setUser(currentUser);

                // Fetch Exam from teacher_exams
                const { data: rawExamData, error: examError } = await supabase
                    .from("teacher_exams")
                    .select("*")
                    .eq("id", examId)
                    .single();

                if (examError) throw examError;
                if (!rawExamData) throw new Error("Exam not found");

                const examData = rawExamData as any;

                // Transform to local state format
                const transformedExam: TeacherExamState = {
                    id: examData.id,
                    examTitle: examData.exam_title || 'Exam',
                    examDescription: examData.exam_description,
                    totalMarks: examData.total_marks,
                    durationMinutes: examData.duration_minutes,
                    passingScore: examData.passing_score,
                    sections: (examData.sections as any[]) || [],
                };

                setExam(transformedExam);

                // Check for existing completed attempt
                const { data: existingAttempt } = await supabase
                    .from("teacher_exam_attempts")
                    .select("id, total_score, max_score, status")
                    .eq("exam_id", examData.id)
                    .eq("student_id", currentUser.id)
                    .in("status", ["completed", "graded"])
                    .maybeSingle();

                if (existingAttempt) {
                    // User already completed this exam - enter practice mode
                    setIsPracticeMode(true);
                    setPreviousResult({
                        score: (existingAttempt as any).total_score || 0,
                        maxScore: (existingAttempt as any).max_score || 0,
                    });
                    // Don't create new attempt, just allow practice
                } else {
                    // First time - create new attempt
                    const { data: attemptData, error: attemptError } = await supabase
                        .from("teacher_exam_attempts")
                        .insert({
                            exam_id: examData.id,
                            student_id: currentUser.id,
                            status: "in_progress",
                            started_at: new Date().toISOString(),
                        } as any)
                        .select("id")
                        .single();

                    if (attemptError) {
                        logger.error("Failed to create attempt", { context: "EnglishTeacherExamPage", data: attemptError });
                    } else if (attemptData) {
                        setAttemptId((attemptData as any).id);
                    }
                }

                // Set Timer
                if (examData.duration_minutes) {
                    setTimeLeft(examData.duration_minutes * 60);
                }
            } catch (err: any) {
                logger.error('Error loading teacher exam', { context: 'EnglishTeacherExamPage', data: err });
                alert(err.message || "An error occurred while loading the exam");
            } finally {
                setIsLoading(false);
            }
        };

        initPage();
    }, [examId, router]);

    // Timer Logic
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

    // Submit Logic
    const handleSubmit = useCallback(async () => {
        // في وضع التمرين - لا يتم حفظ النتيجة
        if (isPracticeMode) {
            alert("Practice completed! Your previous result is already saved.");
            router.push(`/english/teacher-exam/${examId}/results?practice=true`);
            return;
        }

        const currentAttemptId = attemptIdRef.current;
        if (isSubmitting || !currentAttemptId) return;

        setIsSubmitting(true);
        try {
            // Calculate score (basic - might need enhancement based on question types)
            let totalScore = 0;
            let maxScore = 0;

            if (exam) {
                exam.sections.forEach(section => {
                    const allQuestions = [
                        ...(section.vocabularyQuestions || []),
                        ...(section.chooseTwoQuestions || []),
                        ...(section.writingMechanicsQuestions || []),
                        ...(section.translationQuestions || []),
                    ];

                    allQuestions.forEach((q: any) => {
                        maxScore += q.points || 1;
                        const userAnswer = answersRef.current[q.id];
                        if (userAnswer === q.correctIndex || userAnswer === q.correctAnswer) {
                            totalScore += q.points || 1;
                        }
                    });

                    // Reading passages
                    (section.readingPassages || []).forEach((passage: any) => {
                        (passage.questions || []).forEach((q: any) => {
                            maxScore += q.points || 1;
                            const userAnswer = answersRef.current[q.id];
                            if (userAnswer === q.correctIndex) {
                                totalScore += q.points || 1;
                            }
                        });
                    });
                });
            }

            const { error } = await supabase
                .from("teacher_exam_attempts")
                .update({
                    answers: answersRef.current,
                    completed_at: new Date().toISOString(),
                    status: "completed",
                    total_score: totalScore,
                    max_score: maxScore,
                })
                .eq("id", currentAttemptId);

            if (error) throw error;
            router.push(`/english/teacher-exam/${examId}/results?attemptId=${currentAttemptId}`);
        } catch (err) {
            logger.error('Error submitting exam', { context: 'EnglishTeacherExamPage', data: err });
            alert("An error occurred while submitting the exam");
            setIsSubmitting(false);
        }
    }, [isSubmitting, examId, router, isPracticeMode, exam]);

    // Update ref for useEffect
    useEffect(() => {
        handleSubmitRef.current = handleSubmit;
    }, [handleSubmit]);

    // Auto-submit trigger
    useEffect(() => {
        if (timeLeft === 0) {
            handleSubmitRef.current();
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
                <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!exam) return null;

    const currentSection = exam.sections[currentSectionIndex];
    const isLastSection = currentSectionIndex === exam.sections.length - 1;
    const progress = ((currentSectionIndex + 1) / exam.sections.length) * 100;

    const renderQuestion = (q: any, type: string, indexStr: string) => {
        // Generic MCQ renderer
        if (type === "mcq") {
            return (
                <div key={q.id} className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
                    <div className="flex gap-4">
                        <span className="font-bold text-gray-500">{indexStr}.</span>
                        <div className="flex-1 space-y-3">
                            <p className="font-medium text-lg text-gray-900 dark:text-white">{q.question}</p>
                            <div className="space-y-2">
                                {q.options.map((opt: string, idx: number) => (
                                    <label
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === idx
                                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                            : "border-gray-100 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530]"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={q.id}
                                            checked={answers[q.id] === idx}
                                            onChange={() => handleAnswerChange(q.id, idx)}
                                            className="w-4 h-4 text-primary-600"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Choose Two
        if (type === "chooseTwo") {
            const currentAnswers: number[] = answers[q.id] || [];
            return (
                <div key={q.id} className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
                    <div className="flex gap-4">
                        <span className="font-bold text-gray-500">{indexStr}.</span>
                        <div className="flex-1 space-y-3">
                            <p className="font-medium text-lg text-gray-900 dark:text-white">
                                {q.question} <span className="text-sm font-normal text-primary-600">(Choose Two)</span>
                            </p>
                            <div className="space-y-2">
                                {q.options.map((opt: string, idx: number) => (
                                    <label
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${currentAnswers.includes(idx)
                                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                            : "border-gray-100 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530]"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={currentAnswers.includes(idx)}
                                            onChange={() => {
                                                const newAnswers = currentAnswers.includes(idx)
                                                    ? currentAnswers.filter((i) => i !== idx)
                                                    : [...currentAnswers, idx].slice(0, 2);
                                                handleAnswerChange(q.id, newAnswers);
                                            }}
                                            className="w-4 h-4 text-primary-600 rounded"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Translation
        if (type === "translation") {
            return (
                <div key={q.id} className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
                    <div className="flex gap-4">
                        <span className="font-bold text-gray-500">{indexStr}.</span>
                        <div className="flex-1 space-y-3">
                            <div className="p-3 bg-gray-50 dark:bg-[#252530] rounded-lg border-l-4 border-primary-500">
                                <p className="font-medium text-gray-900 dark:text-white" dir={q.translationDirection === "ar-to-en" ? "rtl" : "ltr"}>{q.originalText}</p>
                            </div>
                            <p className="text-sm text-gray-500">Select the correct translation:</p>
                            <div className="space-y-2">
                                {q.options.map((opt: string, idx: number) => (
                                    <label
                                        key={idx}
                                        dir={q.translationDirection === "en-to-ar" ? "rtl" : "ltr"}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === idx
                                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                            : "border-gray-100 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530]"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={q.id}
                                            checked={answers[q.id] === idx}
                                            onChange={() => handleAnswerChange(q.id, idx)}
                                            className="w-4 h-4 text-primary-600"
                                        />
                                        <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Essay
        if (type === "essay") {
            return (
                <div key={q.id} className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
                    <div className="flex gap-4">
                        <span className="font-bold text-gray-500">{indexStr}.</span>
                        <div className="flex-1 space-y-3">
                            <p className="font-medium text-lg text-gray-900 dark:text-white">{q.question}</p>
                            <textarea
                                rows={q.requiredLines || 6}
                                value={answers[q.id] || ""}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow font-sans"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 font-sans" dir="ltr">
            {/* Practice Mode Banner */}
            {isPracticeMode && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium">
                    ⚠️ Practice Mode - You've already completed this exam. Your previous score: {previousResult?.score}/{previousResult?.maxScore}
                </div>
            )}
            {/* Header */}
            <header className={`fixed ${isPracticeMode ? 'top-10' : 'top-0'} left-0 right-0 z-40 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#2e2e3a]`}>
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-md">
                            {exam.examTitle}
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Section {currentSectionIndex + 1} of {exam.sections.length}: {currentSection.title}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {timeLeft !== null && (
                            <div
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-medium ${timeLeft < 300
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                                    }`}
                            >
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(timeLeft)}</span>
                            </div>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Finish Exam
                        </button>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 dark:bg-[#2e2e3a] w-full">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary-500"
                    />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 pt-24 space-y-8">
                {/* Section Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSection.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {/* Section Header */}
                        <div className="mb-6 flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {currentSection.title}
                            </h2>
                            {currentSection.note && (
                                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                    {currentSection.note}
                                </span>
                            )}
                        </div>

                        {/* Vocab & Grammar */}
                        {currentSection.vocabularyQuestions && (
                            <div>
                                {currentSection.vocabularyQuestions.map((q: any, idx: number) =>
                                    renderQuestion(q, "mcq", `Q${idx + 1}`)
                                )}
                            </div>
                        )}

                        {/* Choose Two */}
                        {currentSection.chooseTwoQuestions && (
                            <div>
                                {currentSection.chooseTwoQuestions.map((q: any, idx: number) =>
                                    renderQuestion(q, "chooseTwo", `Q${idx + 1}`)
                                )}
                            </div>
                        )}

                        {/* Writing Mechanics */}
                        {currentSection.writingMechanicsQuestions && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Writing Mechanics</h3>
                                {currentSection.writingMechanicsQuestions.map((q: any, idx: number) =>
                                    renderQuestion(q, "mcq", `Q${idx + 1}`)
                                )}
                            </div>
                        )}

                        {/* Reading Passages */}
                        {currentSection.readingPassages && (
                            <div className="space-y-8">
                                {currentSection.readingPassages.map((passage: any, pIdx: number) => (
                                    <div key={passage.id} className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden">
                                        <div className="p-6 bg-gray-50 dark:bg-[#252530] border-b border-gray-200 dark:border-[#2e2e3a]">
                                            <h3 className="font-bold flex items-center gap-2 mb-2">
                                                <BookOpen className="h-5 w-5 text-primary-500" />
                                                Passage {pIdx + 1}
                                            </h3>
                                            <div className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">
                                                {passage.passage}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            {passage.questions.map((q: any, qIdx: number) =>
                                                renderQuestion(q, "mcq", `${pIdx + 1}.${qIdx + 1}`)
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Translation */}
                        {currentSection.translationQuestions && (
                            <div className="space-y-4">
                                {currentSection.translationQuestions.map((q: any, idx: number) =>
                                    renderQuestion(q, "translation", `Q${idx + 1}`)
                                )}
                            </div>
                        )}

                        {/* Essay */}
                        {currentSection.essayQuestions && (
                            <div className="space-y-4">
                                {currentSection.essayQuestions.map((q: any, idx: number) =>
                                    renderQuestion(q, "essay", `Q${idx + 1}`)
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-t border-gray-200 dark:border-[#2e2e3a]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={() => setCurrentSectionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentSectionIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#353545] transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Previous
                    </button>

                    {isLastSection ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5" />
                            )}
                            Finish Exam
                        </button>
                    ) : (
                        <button
                            onClick={() =>
                                setCurrentSectionIndex((prev) => Math.min(exam.sections.length - 1, prev + 1))
                            }
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium hover:shadow-lg transition-all"
                        >
                            Next
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
