"use client";

/**
 * SECTION EXAM PLAYER - مشغل الامتحان بالأقسام
 * - Each section shows ONLY ONE content type: reading OR poetry (never both)
 * - Questions grouped by type (MCQ together, T/F together)
 * - Compact layout to reduce page length
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
    Send, BookOpen, Loader2, List, Star, X, Minus, Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Types
interface ExamOption {
    id?: string;
    text?: string;
    textAr?: string;
    textEn?: string;
    isCorrect?: boolean;
}

interface ExamQuestion {
    id: string;
    type: string;
    text?: string;
    textAr?: string;
    textEn?: string;
    options?: ExamOption[] | string[];
    correctAnswer?: string | number;
    points?: number;
}

interface ExamSection {
    id?: string;
    titleAr?: string;
    titleEn?: string;
    title?: string;
    contentType?: "none" | "reading" | "poetry";
    readingText?: string;
    readingTitle?: string;
    bodyText?: string;
    poetryTitle?: string;
    poetryVerses?: { firstHalf: string; secondHalf: string }[];
    questions?: ExamQuestion[];
    subsections?: { questions?: ExamQuestion[] }[];
}

interface Props {
    examId: string;
    language: "arabic" | "english";
    isTeacherExam?: boolean;
}

type QuestionStatus = "unanswered" | "answered" | "flagged";

export function SectionExamPlayer({ examId, language, isTeacherExam = false }: Props) {
    const router = useRouter();
    const isRTL = language === "arabic";
    const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // State
    const [exam, setExam] = useState<{ id: string; title: string; duration?: number; sections: ExamSection[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [fontSize, setFontSize] = useState(16);
    const [showQuestionList, setShowQuestionList] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPassageExpanded, setIsPassageExpanded] = useState(true);

    // Derived
    const currentSection = exam?.sections[currentSectionIndex];
    const getSectionQuestions = (s: ExamSection | undefined): ExamQuestion[] => {
        if (!s) return [];
        if (s.questions?.length) return s.questions;
        if (s.subsections?.length) return s.subsections.flatMap((sub) => sub.questions || []);
        return [];
    };
    const currentQuestions = getSectionQuestions(currentSection);
    const totalSections = exam?.sections.length || 0;

    // Group questions by type
    const groupedQuestions = useMemo(() => {
        const mcq = currentQuestions.filter(q => q.type === "mcq" || q.type === "multiple_choice");
        const tf = currentQuestions.filter(q => q.type === "truefalse" || q.type === "true_false");
        const other = currentQuestions.filter(q => 
            !["mcq", "multiple_choice", "truefalse", "true_false"].includes(q.type)
        );
        return { mcq, tf, other };
    }, [currentQuestions]);

    // Labels
    const L = {
        loading: isRTL ? "جاري تحميل الامتحان..." : "Loading exam...",
        error: isRTL ? "حدث خطأ" : "Error",
        section: isRTL ? "القسم" : "Section",
        of: isRTL ? "من" : "of",
        previous: isRTL ? "السابق" : "Previous",
        next: isRTL ? "التالي" : "Next",
        submit: isRTL ? "إنهاء وتسليم" : "Submit",
        submitting: isRTL ? "جاري الإرسال..." : "Submitting...",
        answered: isRTL ? "أجبت" : "Answered",
        questionList: isRTL ? "قائمة الأسئلة" : "Questions",
        readingPassage: isRTL ? "نص القراءة" : "Reading Passage",
        poetry: isRTL ? "نص شعري" : "Poetry",
        collapse: isRTL ? "طي" : "Collapse",
        expand: isRTL ? "عرض" : "Expand",
        mcqTitle: isRTL ? "اختيار من متعدد" : "Multiple Choice",
        tfTitle: isRTL ? "صح أو خطأ" : "True or False",
        trueOpt: isRTL ? "صح" : "True",
        falseOpt: isRTL ? "خطأ" : "False",
    };

    // Fetch exam
    useEffect(() => {
        const fetchExam = async () => {
            try {
                setIsLoading(true);
                const table = isTeacherExam ? "teacher_exams" : "comprehensive_exams";
                const { data, error: fetchError } = await supabase.from(table).select("*").eq("id", examId).single();
                if (fetchError) throw fetchError;
                const d = data as Record<string, unknown>;
                setExam({
                    id: d.id as string,
                    title: (d.exam_title || d.title) as string,
                    duration: d.duration_minutes as number | undefined,
                    sections: ((d.blocks || d.sections) as ExamSection[]) || [],
                });
                if (d.duration_minutes) setTimeRemaining((d.duration_minutes as number) * 60);
            } catch (err) {
                console.error(err);
                setError(L.error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExam();
    }, [examId, isTeacherExam]);

    // Timer
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;
        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) { clearInterval(timer); handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeRemaining]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    // Handlers
    const handleAnswer = useCallback((qId: string, ans: string | number) => {
        setAnswers((prev) => ({ ...prev, [qId]: ans }));
    }, []);

    const toggleFlag = useCallback((qId: string) => {
        setFlaggedQuestions((prev) => {
            const next = new Set(prev);
            next.has(qId) ? next.delete(qId) : next.add(qId);
            return next;
        });
    }, []);

    const getStatus = (qId: string): QuestionStatus => {
        if (flaggedQuestions.has(qId)) return "flagged";
        if (answers[qId] !== undefined) return "answered";
        return "unanswered";
    };

    const goNext = () => { if (currentSectionIndex < totalSections - 1) { setCurrentSectionIndex(i => i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
    const goPrev = () => { if (currentSectionIndex > 0) { setCurrentSectionIndex(i => i - 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };

    const scrollToQ = (qId: string) => { questionRefs.current.get(qId)?.scrollIntoView({ behavior: "smooth", block: "center" }); setShowQuestionList(false); };

    const answeredCount = currentQuestions.filter((q) => answers[q.id] !== undefined).length;
    const isLast = currentSectionIndex === totalSections - 1;

    // Submit
    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let total = 0, max = 0;
            exam?.sections.forEach((sec) => {
                getSectionQuestions(sec).forEach((q) => {
                    const pts = q.points || 1;
                    max += pts;
                    const userAns = answers[q.id];
                    let correctIdx = -1;
                    if (q.correctAnswer !== undefined) correctIdx = typeof q.correctAnswer === "number" ? q.correctAnswer : parseInt(String(q.correctAnswer), 10);
                    else if (q.options) correctIdx = (q.options as ExamOption[]).findIndex((o) => typeof o === "object" && o.isCorrect);
                    if (userAns !== undefined && Number(userAns) === correctIdx) total += pts;
                });
            });
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const table = isTeacherExam ? "teacher_exam_attempts" : "comprehensive_exam_attempts";
            await supabase.from(table).insert({ exam_id: examId, student_id: user.id, answers, total_score: total, max_score: max, status: "submitted", completed_at: new Date().toISOString() });
            router.push(`/${language === "arabic" ? "arabic" : "english"}/exam/${examId}/results`);
        } catch (err) { console.error(err); setIsSubmitting(false); }
    };

    // Helpers
    const getOptText = (o: ExamOption | string, i: number) => typeof o === "string" ? o : (isRTL ? o.textAr : o.textEn) || o.text || `${i + 1}`;
    const getQText = (q: ExamQuestion) => (isRTL ? q.textAr : q.textEn) || q.text || "";

    // Determine content type based on explicit contentType OR actual content presence
    // Priority: 1) Explicit contentType, 2) Check if actual content exists
    const getContentType = () => {
        if (!currentSection) return { hasPoetry: false, hasReading: false };
        
        // If explicit contentType is set, respect it but verify content exists
        if (currentSection.contentType === "poetry") {
            // Only show poetry if verses actually exist and have content
            const hasVerses = currentSection.poetryVerses && 
                currentSection.poetryVerses.length > 0 &&
                currentSection.poetryVerses.some(v => v.firstHalf || v.secondHalf);
            return { hasPoetry: hasVerses, hasReading: false };
        }
        
        if (currentSection.contentType === "reading") {
            // Only show reading if text actually exists
            const hasText = !!(currentSection.readingText || currentSection.bodyText);
            return { hasPoetry: false, hasReading: hasText };
        }
        
        if (currentSection.contentType === "none") {
            return { hasPoetry: false, hasReading: false };
        }
        
        // No explicit contentType - check actual content
        const hasVerses = currentSection.poetryVerses && 
            currentSection.poetryVerses.length > 0 &&
            currentSection.poetryVerses.some(v => v.firstHalf || v.secondHalf);
        const hasText = !!(currentSection.readingText || currentSection.bodyText);
        
        // If both exist, prefer reading (or could be changed based on requirements)
        if (hasVerses && !hasText) return { hasPoetry: true, hasReading: false };
        if (hasText && !hasVerses) return { hasPoetry: false, hasReading: true };
        
        return { hasPoetry: false, hasReading: false };
    };
    
    const { hasPoetry, hasReading } = getContentType();

    // Loading / Error
    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-neutral-950"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (error || !exam) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-neutral-950"><AlertCircle className="w-12 h-12 text-red-500 mb-4" /><p className="text-red-600">{error}</p></div>;

    // Render single question (compact)
    const renderQ = (q: ExamQuestion, idx: number, isTF = false) => {
        const status = getStatus(q.id);
        const sel = answers[q.id];
        return (
            <div key={q.id} ref={(el) => { if (el) questionRefs.current.set(q.id, el); }} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-start gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{idx + 1}</span>
                    <p className="flex-1 text-sm text-neutral-900 dark:text-white" style={{ fontSize: `${fontSize - 1}px` }}>{getQText(q)}</p>
                    <button onClick={() => toggleFlag(q.id)} className={`p-1 shrink-0 ${status === "flagged" ? "text-amber-500" : "text-neutral-300"}`}>
                        <Star className="w-4 h-4" fill={status === "flagged" ? "currentColor" : "none"} />
                    </button>
                </div>
                {isTF ? (
                    <div className="flex gap-2 mr-8">
                        {[{ v: 0, l: L.trueOpt }, { v: 1, l: L.falseOpt }].map((o) => (
                            <button key={o.v} onClick={() => handleAnswer(q.id, o.v)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${sel === o.v ? "bg-indigo-500 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"}`}>{o.l}</button>
                        ))}
                    </div>
                ) : q.options ? (
                    <div className="grid grid-cols-2 gap-2 mr-8">
                        {(q.options as (ExamOption | string)[]).map((opt, oi) => (
                            <button key={oi} onClick={() => handleAnswer(q.id, oi)} className={`py-2 px-3 rounded-lg text-sm text-right flex items-center gap-2 ${sel === oi ? "bg-indigo-500 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${sel === oi ? "bg-white/20" : "bg-neutral-200 dark:bg-neutral-700"}`}>{String.fromCharCode(65 + oi)}</span>
                                <span className="flex-1">{getOptText(opt, oi)}</span>
                                {sel === oi && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
            {/* TOP BAR */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="font-bold text-neutral-900 dark:text-white text-sm">{currentSection?.titleAr || currentSection?.titleEn || currentSection?.title || `${L.section} ${currentSectionIndex + 1}`}</h1>
                            <p className="text-xs text-neutral-500">{L.section} {currentSectionIndex + 1} {L.of} {totalSections}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {timeRemaining !== null && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${timeRemaining < 300 ? "bg-red-100 text-red-600" : "bg-neutral-100 text-neutral-600"}`}>
                                <Clock className="w-4 h-4" />{formatTime(timeRemaining)}
                            </div>
                        )}
                        <button onClick={() => setShowQuestionList(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm">
                            <List className="w-4 h-4" />{L.questionList}
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-1 pb-28">
                <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
                    {/* PASSAGE - ONLY ONE: Poetry OR Reading */}
                    {hasPoetry && currentSection?.poetryVerses?.length ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2"><span>🎭</span><h2 className="font-bold text-amber-800 dark:text-amber-200 text-sm">{currentSection?.poetryTitle || L.poetry}</h2></div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="p-1"><Minus className="w-4 h-4 text-amber-600" /></button>
                                    <button onClick={() => setFontSize(s => Math.min(24, s + 2))} className="p-1"><Plus className="w-4 h-4 text-amber-600" /></button>
                                    <button onClick={() => setIsPassageExpanded(!isPassageExpanded)} className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">{isPassageExpanded ? L.collapse : L.expand}</button>
                                </div>
                            </div>
                            <AnimatePresence>
                                {isPassageExpanded && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="p-4 space-y-2">
                                        {currentSection.poetryVerses.map((v, i) => (
                                            <div key={i} className="flex items-center justify-center gap-4" style={{ fontSize: `${fontSize}px` }}>
                                                <span className="flex-1 text-left">{v.firstHalf}</span>
                                                <span className="text-amber-500">⋯</span>
                                                <span className="flex-1 text-right">{v.secondHalf}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : hasReading ? (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">{currentSection?.readingTitle || L.readingPassage}</h2></div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="p-1"><Minus className="w-4 h-4 text-emerald-600" /></button>
                                    <button onClick={() => setFontSize(s => Math.min(24, s + 2))} className="p-1"><Plus className="w-4 h-4 text-emerald-600" /></button>
                                    <button onClick={() => setIsPassageExpanded(!isPassageExpanded)} className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">{isPassageExpanded ? L.collapse : L.expand}</button>
                                </div>
                            </div>
                            <AnimatePresence>
                                {isPassageExpanded && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="p-4">
                                        <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>{currentSection?.readingText || currentSection?.bodyText}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : null}

                    {/* QUESTIONS GROUPED BY TYPE */}
                    {groupedQuestions.mcq.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 px-1">{L.mcqTitle} ({groupedQuestions.mcq.length})</h3>
                            <div className="space-y-2">{groupedQuestions.mcq.map((q, i) => renderQ(q, i, false))}</div>
                        </div>
                    )}
                    {groupedQuestions.tf.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 px-1">{L.tfTitle} ({groupedQuestions.tf.length})</h3>
                            <div className="space-y-2">{groupedQuestions.tf.map((q, i) => renderQ(q, groupedQuestions.mcq.length + i, true))}</div>
                        </div>
                    )}
                    {groupedQuestions.other.length > 0 && (
                        <div className="space-y-2">{groupedQuestions.other.map((q, i) => renderQ(q, groupedQuestions.mcq.length + groupedQuestions.tf.length + i, false))}</div>
                    )}
                </div>
            </main>

            {/* BOTTOM BAR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 z-40">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-center gap-2 mb-2 text-sm text-neutral-500">
                        <span>{L.answered} {answeredCount} {L.of} {currentQuestions.length}</span>
                        <div className="flex-1 max-w-32 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${currentQuestions.length > 0 ? (answeredCount / currentQuestions.length) * 100 : 0}%` }} />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={goPrev} disabled={currentSectionIndex === 0} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-medium disabled:opacity-50">
                            {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}{L.previous}
                        </button>
                        {isLast ? (
                            <button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}{isSubmitting ? L.submitting : L.submit}
                            </button>
                        ) : (
                            <button onClick={goNext} className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 text-white font-bold">
                                {L.next}{isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* QUESTION LIST SHEET */}
            <AnimatePresence>
                {showQuestionList && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowQuestionList(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-50 max-h-[60vh] overflow-hidden">
                            <div className="flex justify-center py-2"><div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" /></div>
                            <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                <h3 className="font-bold">{L.questionList}</h3>
                                <button onClick={() => setShowQuestionList(false)} className="p-2"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[45vh]">
                                <div className="grid grid-cols-8 gap-2">
                                    {currentQuestions.map((q, i) => {
                                        const st = getStatus(q.id);
                                        return (
                                            <button key={q.id} onClick={() => scrollToQ(q.id)} className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${st === "answered" ? "bg-green-100 text-green-600 border-2 border-green-300" : st === "flagged" ? "bg-amber-100 text-amber-600 border-2 border-amber-300" : "bg-neutral-100 text-neutral-600"}`}>{i + 1}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
