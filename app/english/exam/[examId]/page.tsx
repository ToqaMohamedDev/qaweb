"use client";

// =============================================
// English Exam Page - صفحة الامتحان الإنجليزي (Refactored)
// =============================================

import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Languages, PenTool } from "lucide-react";
import {
    ExamLoadingScreen,
    ExamErrorScreen,
    ExamEmptyScreen,
    ExamHeader,
    ExamFooter,
} from "@/components/exam";
import { useTeacherExamPlayer } from "@/hooks/useTeacherExamPlayer";

export default function EnglishExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.examId as string;

    // Use unified exam player hook
    const {
        exam,
        isLoading,
        error,
        currentBlockIndex,
        totalBlocks,
        answers,
        answeredCount,
        totalQuestions,
        progress,
        timeFormatted,
        isTimeWarning,
        isSubmitting,
        setCurrentBlockIndex,
        goToNextBlock,
        goToPrevBlock,
        handleAnswerChange,
        handleSubmit,
    } = useTeacherExamPlayer({
        examId,
        language: 'english',
        resultsPath: `/english/exam/${examId}/results`,
        fallbackPath: '/english',
        requireAuth: false, // الامتحانات العادية متاحة للجميع للعرض
        requireAuthToSubmit: true, // لكن تحتاج تسجيل دخول للتسليم
    });

    // For English exams, we use sections instead of blocks
    const sections = (exam as any)?.sections || exam?.blocks || [];
    const currentSection = sections[currentBlockIndex];

    // Loading state
    if (isLoading) {
        return <ExamLoadingScreen lang="en" />;
    }

    // Error state
    if (error) {
        return (
            <ExamErrorScreen
                error={error.message || "An error occurred while loading the exam"}
                onBack={() => router.back()}
                lang="en"
            />
        );
    }

    // No exam data
    if (!exam) return null;

    // No sections
    if (sections.length === 0) {
        return <ExamEmptyScreen onBack={() => router.back()} lang="en" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 font-sans" dir="ltr">
            {/* Header */}
            <ExamHeader
                examTitle={exam.examTitle}
                currentPage={currentBlockIndex + 1}
                totalPages={sections.length}
                answeredCount={answeredCount}
                totalQuestions={totalQuestions}
                progress={progress}
                timeFormatted={timeFormatted}
                isTimeWarning={isTimeWarning}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                lang="en"
            />

            <main className="max-w-4xl mx-auto px-4 pt-24 space-y-8">
                {/* Section Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSection?.id || currentBlockIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {/* Section Header */}
                        <div className="mb-6 flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {currentSection?.title || `Section ${currentBlockIndex + 1}`}
                            </h2>
                            {currentSection?.note && (
                                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                    {currentSection.note}
                                </span>
                            )}
                        </div>

                        {/* Vocabulary & Grammar Questions */}
                        {currentSection?.vocabularyQuestions && (
                            <SectionTypeHeader
                                icon="☑"
                                title="Vocabulary & Grammar"
                                count={currentSection.vocabularyQuestions.length}
                                color="blue"
                            />
                        )}
                        {currentSection?.vocabularyQuestions && (
                            <div className="mb-6">
                                {currentSection.vocabularyQuestions.map((q: any, idx: number) => (
                                    <MCQQuestion
                                        key={q.id}
                                        question={q}
                                        index={`Q${idx + 1}`}
                                        answer={answers[q.id]}
                                        onAnswer={handleAnswerChange}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Choose Two Questions */}
                        {currentSection?.chooseTwoQuestions && (
                            <>
                                <SectionTypeHeader
                                    icon="☑☑"
                                    title="Choose Two"
                                    count={currentSection.chooseTwoQuestions.length}
                                    color="green"
                                />
                                <div className="mb-6">
                                    {currentSection.chooseTwoQuestions.map((q: any, idx: number) => (
                                        <ChooseTwoQuestion
                                            key={q.id}
                                            question={q}
                                            index={`Q${idx + 1}`}
                                            answers={answers[q.id] || []}
                                            onAnswer={handleAnswerChange}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Writing Mechanics */}
                        {currentSection?.writingMechanicsQuestions && (
                            <>
                                <SectionTypeHeader
                                    icon="✎"
                                    title="Writing Mechanics"
                                    count={currentSection.writingMechanicsQuestions.length}
                                    color="amber"
                                />
                                <div className="mb-6">
                                    {currentSection.writingMechanicsQuestions.map((q: any, idx: number) => (
                                        <MCQQuestion
                                            key={q.id}
                                            question={q}
                                            index={`Q${idx + 1}`}
                                            answer={answers[q.id]}
                                            onAnswer={handleAnswerChange}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Reading Passages */}
                        {currentSection?.readingPassages && (
                            <>
                                <SectionTypeHeader
                                    icon="📖"
                                    title="Reading Comprehension"
                                    count={currentSection.readingPassages.length}
                                    color="purple"
                                />
                                <div className="space-y-8 mb-6">
                                    {currentSection.readingPassages.map((passage: any, pIdx: number) => (
                                        <ReadingPassageSection
                                            key={passage.id}
                                            passage={passage}
                                            passageIndex={pIdx}
                                            answers={answers}
                                            onAnswer={handleAnswerChange}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Translation Questions */}
                        {currentSection?.translationQuestions && (
                            <>
                                <SectionTypeHeader
                                    icon="🔄"
                                    title="Translation"
                                    count={currentSection.translationQuestions.length}
                                    color="rose"
                                />
                                <div className="space-y-4 mb-6">
                                    {currentSection.translationQuestions.map((q: any, idx: number) => (
                                        <TranslationQuestion
                                            key={q.id}
                                            question={q}
                                            index={`Q${idx + 1}`}
                                            answer={answers[q.id]}
                                            onAnswer={handleAnswerChange}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Essay Questions */}
                        {currentSection?.essayQuestions && (
                            <>
                                <SectionTypeHeader
                                    icon="📝"
                                    title="Essay Writing"
                                    count={currentSection.essayQuestions.length}
                                    color="indigo"
                                />
                                <div className="space-y-4 mb-6">
                                    {currentSection.essayQuestions.map((q: any, idx: number) => (
                                        <EssayQuestion
                                            key={q.id}
                                            question={q}
                                            index={`Q${idx + 1}`}
                                            answer={answers[q.id]}
                                            onAnswer={handleAnswerChange}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Generic blocks/questions for unified format */}
                        {currentSection?.questions && (
                            <div className="space-y-4">
                                {currentSection.questions.map((q: any, idx: number) => (
                                    <MCQQuestion
                                        key={q.id}
                                        question={q}
                                        index={`Q${idx + 1}`}
                                        answer={answers[q.id]}
                                        onAnswer={handleAnswerChange}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            <ExamFooter
                currentBlockIndex={currentBlockIndex}
                totalBlocks={sections.length}
                isSubmitting={isSubmitting}
                onPrev={goToPrevBlock}
                onNext={goToNextBlock}
                onSubmit={handleSubmit}
                lang="en"
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

function SectionTypeHeader({ icon, title, count, color }: { icon: string; title: string; count: number; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    };

    return (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-[#2e2e3a]">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.blue}`}>
                <span className="font-bold text-sm">{icon}</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">({count} questions)</span>
        </div>
    );
}

function MCQQuestion({ question, index, answer, onAnswer }: { question: any; index: string; answer: any; onAnswer: (id: string, value: any) => void }) {
    return (
        <div className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
            <div className="flex gap-4">
                <span className="font-bold text-gray-500">{index}.</span>
                <div className="flex-1 space-y-3">
                    <p className="font-medium text-lg text-gray-900 dark:text-white">
                        {question.question || question.stem}
                    </p>
                    <div className="space-y-2">
                        {(question.options || []).map((opt: string, idx: number) => (
                            <label
                                key={idx}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answer === idx
                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                    : "border-gray-100 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530]"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={question.id}
                                    checked={answer === idx}
                                    onChange={() => onAnswer(question.id, idx)}
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

function ChooseTwoQuestion({ question, index, answers, onAnswer }: { question: any; index: string; answers: number[]; onAnswer: (id: string, value: any) => void }) {
    const handleToggle = (idx: number) => {
        const newAnswers = answers.includes(idx)
            ? answers.filter(i => i !== idx)
            : [...answers, idx].slice(0, 2);
        onAnswer(question.id, newAnswers);
    };

    return (
        <div className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
            <div className="flex gap-4">
                <span className="font-bold text-gray-500">{index}.</span>
                <div className="flex-1 space-y-3">
                    <p className="font-medium text-lg text-gray-900 dark:text-white">
                        {question.question} <span className="text-sm font-normal text-primary-600">(Choose Two)</span>
                    </p>
                    <div className="space-y-2">
                        {(question.options || []).map((opt: string, idx: number) => (
                            <label
                                key={idx}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers.includes(idx)
                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                    : "border-gray-100 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530]"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={answers.includes(idx)}
                                    onChange={() => handleToggle(idx)}
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

function TranslationQuestion({ question, index, answer, onAnswer }: { question: any; index: string; answer: any; onAnswer: (id: string, value: any) => void }) {
    return (
        <div className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
            <div className="flex gap-4">
                <span className="font-bold text-gray-500">{index}.</span>
                <div className="flex-1 space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-[#252530] rounded-lg border-l-4 border-primary-500">
                        <p
                            className="font-medium text-gray-900 dark:text-white"
                            dir={question.translationDirection === "ar-to-en" ? "rtl" : "ltr"}
                        >
                            {question.originalText}
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">Select the correct translation:</p>
                    <div className="space-y-2">
                        {(question.options || []).map((opt: string, idx: number) => (
                            <label
                                key={idx}
                                dir={question.translationDirection === "en-to-ar" ? "rtl" : "ltr"}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answer === idx
                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                    : "border-gray-100 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530]"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={question.id}
                                    checked={answer === idx}
                                    onChange={() => onAnswer(question.id, idx)}
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

function EssayQuestion({ question, index, answer, onAnswer }: { question: any; index: string; answer: any; onAnswer: (id: string, value: any) => void }) {
    return (
        <div className="p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] mb-4">
            <div className="flex gap-4">
                <span className="font-bold text-gray-500">{index}.</span>
                <div className="flex-1 space-y-3">
                    <p className="font-medium text-lg text-gray-900 dark:text-white">
                        {question.question}
                    </p>
                    <textarea
                        rows={question.requiredLines || 6}
                        value={answer || ""}
                        onChange={(e) => onAnswer(question.id, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow font-sans"
                    />
                </div>
            </div>
        </div>
    );
}

function ReadingPassageSection({ passage, passageIndex, answers, onAnswer }: { passage: any; passageIndex: number; answers: Record<string, any>; onAnswer: (id: string, value: any) => void }) {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden">
            <div className="p-6 bg-gray-50 dark:bg-[#252530] border-b border-gray-200 dark:border-[#2e2e3a]">
                <h3 className="font-bold flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-primary-500" />
                    Passage {passageIndex + 1}
                </h3>
                <div className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">
                    {passage.passage}
                </div>
            </div>
            <div className="p-6">
                {(passage.questions || []).map((q: any, qIdx: number) => (
                    <MCQQuestion
                        key={q.id}
                        question={q}
                        index={`${passageIndex + 1}.${qIdx + 1}`}
                        answer={answers[q.id]}
                        onAnswer={onAnswer}
                    />
                ))}
            </div>
        </div>
    );
}
