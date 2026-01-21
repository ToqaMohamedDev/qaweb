"use client";

// =============================================
// Arabic Teacher Exam Page - صفحة امتحان المدرس العربي
// Refactored to match the main exam UI
// =============================================

import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, AlertTriangle, Info, Clock, Calendar, AlertCircle } from "lucide-react";
import {
    ExamLoadingScreen,
    ExamErrorScreen,
    ExamEmptyScreen,
    ExamHeader,
    ExamPageNavigation,
    MCQOptions,
    TextAnswer,
    ExamFooter,
} from "@/components/exam";
import { useTeacherExamPlayer } from "@/hooks/useExamSession";

export default function ArabicTeacherExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.examId as string;

    // Use teacher exam player hook
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
        isPracticeMode,
        previousResult,
        // Time Limited
        isTimeLimited,
        availabilityTimeFormatted,
        isAvailabilityWarning,
        examNotAvailable,
        examNotAvailableReason,
        examAvailabilityMessage,
        // Actions
        setCurrentBlockIndex,
        goToNextBlock,
        goToPrevBlock,
        handleAnswerChange,
        handleSubmit,
    } = useTeacherExamPlayer({
        examId,
        language: 'arabic',
        resultsPath: `/arabic/teacher-exam/${examId}/results`,
        fallbackPath: '/arabic',
        requireAuth: true, // امتحانات المدرس تحتاج تسجيل دخول
        examSource: 'teacher', // جلب من جدول teacher_exams
    });

    // Loading state
    if (isLoading) {
        return <ExamLoadingScreen lang="ar" />;
    }

    // Error state
    if (error) {
        return (
            <ExamErrorScreen
                error={error.message || "حدث خطأ أثناء تحميل الامتحان"}
                onBack={() => router.back()}
                lang="ar"
            />
        );
    }

    // Exam not available (time-limited exam)
    if (examNotAvailable && exam) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 dark:from-[#0a0a0f] dark:via-[#0f0f18] dark:to-[#121218] flex items-center justify-center" dir="rtl">
                <div className="max-w-md mx-auto text-center p-8">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${examNotAvailableReason === 'not_started' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {examNotAvailableReason === 'not_started' ? (
                            <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {exam.examTitle}
                    </h1>
                    <div className={`p-4 rounded-xl ${examNotAvailableReason === 'not_started' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                        <p className={`text-lg font-medium ${examNotAvailableReason === 'not_started' ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                            {examNotAvailableReason === 'not_started' ? 'الامتحان لم يبدأ بعد' : 'انتهى وقت الامتحان'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {examAvailabilityMessage}
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-700 hover:to-purple-700 transition-all"
                    >
                        العودة
                    </button>
                </div>
            </div>
        );
    }

    // No exam data
    if (!exam) return null;

    // No blocks
    if (!exam.blocks || exam.blocks.length === 0) {
        return <ExamEmptyScreen onBack={() => router.back()} lang="ar" />;
    }

    const currentBlock = exam.blocks[currentBlockIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 dark:from-[#0a0a0f] dark:via-[#0f0f18] dark:to-[#121218]" dir="rtl">

            {/* Practice Mode Banner */}
            {isPracticeMode && previousResult && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 text-center text-sm font-medium shadow-lg">
                    <Info className="inline h-4 w-4 ml-2" />
                    وضع التمرين - نتيجتك السابقة: {previousResult.score}/{previousResult.maxScore} ({Math.round((previousResult.score / previousResult.maxScore) * 100)}%)
                </div>
            )}

            {/* Time Limited Exam Warning Banner */}
            {isTimeLimited && isAvailabilityWarning && !isPracticeMode && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-rose-500 text-white py-2 px-4 text-center text-sm font-medium shadow-lg animate-pulse">
                    <AlertCircle className="inline h-4 w-4 ml-2" />
                    تحذير: متبقي {availabilityTimeFormatted} على انتهاء وقت توفر الامتحان! سيتم التسليم تلقائياً عند انتهاء الوقت.
                </div>
            )}

            {/* Time Limited Exam Info Banner (when not warning) */}
            {isTimeLimited && !isAvailabilityWarning && availabilityTimeFormatted && !isPracticeMode && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 text-center text-sm font-medium shadow-lg">
                    <Clock className="inline h-4 w-4 ml-2" />
                    وقت توفر الامتحان المتبقي: {availabilityTimeFormatted}
                </div>
            )}

            {/* Header */}
            <ExamHeader
                examTitle={exam.examTitle}
                currentPage={currentBlockIndex + 1}
                totalPages={totalBlocks}
                answeredCount={answeredCount}
                totalQuestions={totalQuestions}
                progress={progress}
                timeFormatted={isPracticeMode ? "∞" : timeFormatted}
                isTimeWarning={!isPracticeMode && isTimeWarning}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                lang="ar"
            />

            {/* Main Content */}
            <main className={`pt-28 pb-32 px-4 ${isPracticeMode ? 'mt-10' : ''}`}>
                <div className="max-w-4xl mx-auto">

                    {/* Page Navigation */}
                    <ExamPageNavigation
                        blocks={exam.blocks}
                        currentBlockIndex={currentBlockIndex}
                        answers={answers}
                        onBlockSelect={setCurrentBlockIndex}
                        lang="ar"
                    />

                    {/* Exam Paper */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentBlock.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/80 dark:border-[#2e2e3a]/80 overflow-hidden"
                        >
                            {/* Section Header */}
                            <SectionHeader
                                block={currentBlock}
                                currentIndex={currentBlockIndex}
                                totalPages={totalBlocks}
                            />

                            {/* Content Area (Reading/Poetry/Grammar) */}
                            <ContentArea block={currentBlock} />

                            {/* Questions */}
                            <QuestionsArea
                                block={currentBlock}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                            />

                            {/* Section Footer */}
                            <SectionFooter
                                currentIndex={currentBlockIndex}
                                block={currentBlock}
                                answers={answers}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Footer Navigation */}
            <ExamFooter
                currentBlockIndex={currentBlockIndex}
                totalBlocks={totalBlocks}
                isSubmitting={isSubmitting}
                onPrev={goToPrevBlock}
                onNext={goToNextBlock}
                onSubmit={handleSubmit}
                lang="ar"
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({ block, currentIndex, totalPages }: { block: any; currentIndex: number; totalPages: number }) {
    const getBlockTypeLabel = (type: string) => {
        switch (type) {
            case 'reading_passage': return 'نص القراءة';
            case 'poetry_text': return 'نص الشعر';
            case 'poetry': return 'نص الشعر';
            case 'reading': return 'نص القراءة';
            case 'grammar_block': return 'النحو والصرف';
            case 'expression_block': return 'التعبير';
            case 'section': return 'قسم';
            case 'none': return 'أسئلة';
            default: return 'أسئلة';
        }
    };

    return (
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 px-4 py-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm">
                            {block.title || block.titleAr || `القسم ${currentIndex + 1}`}
                        </h2>
                        <p className="text-white/70 text-xs">
                            {getBlockTypeLabel(block.type)} • {block.questions?.length || 0} أسئلة
                        </p>
                    </div>
                </div>
                <div className="text-white/80 text-xs font-medium px-2 py-0.5 bg-white/10 rounded">
                    {currentIndex + 1} / {totalPages}
                </div>
            </div>
        </div>
    );
}

function ContentArea({ block }: { block: any }) {
    const contentType = block.contentType || block.type;

    // Debug - طباعة البيانات للتأكد
    console.log('ContentArea block:', {
        contentType,
        readingTitle: block.readingTitle,
        readingText: block.readingText?.substring(0, 50),
        poetryTitle: block.poetryTitle,
        poetryVerses: block.poetryVerses,
        allKeys: Object.keys(block)
    });

    // إذا كان contentType = 'none' فلا نعرض أي محتوى
    if (contentType === 'none') {
        return null;
    }

    // تحقق من وجود محتوى فعلي
    const hasReadingContent = block.readingText || block.bodyText;
    const hasPoetryContent = (block.poetryVerses && block.poetryVerses.some((v: any) => v.firstHalf || v.secondHalf)) ||
        (block.verses && block.verses.some((v: any) => v.firstHalf || v.secondHalf));

    // تحديد نوع المحتوى للعرض - فقط إذا كان contentType صريح
    const showReading = contentType === 'reading' || contentType === 'reading_passage';
    const showPoetry = contentType === 'poetry' || contentType === 'poetry_text';
    const showGrammar = contentType === 'grammar_block';
    const showExpression = contentType === 'expression_block';

    console.log('ContentArea flags:', { hasReadingContent, hasPoetryContent, showReading, showPoetry });

    // لا تعرض شيء إذا لا يوجد محتوى فعلي
    if ((!hasReadingContent || !showReading) && (!hasPoetryContent || !showPoetry) && !showGrammar && !showExpression) {
        return null;
    }

    // Expression Block
    if (showExpression) {
        return (
            <div className="border-b border-gray-200 dark:border-[#2e2e3a] p-6 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2">المطلوب:</h3>
                        <p className="text-gray-700 dark:text-gray-300">{block.prompt}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Reading/Poetry/Grammar Content
    return (
        <div className="border-b border-gray-200 dark:border-[#2e2e3a]">
            <div className="p-4 bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-900/10 dark:to-[#1c1c24]">
                <div className="flex items-center gap-2 mb-3 text-violet-600 dark:text-violet-400">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-bold text-xs">
                        {showReading && 'اقرأ النص التالي ثم أجب:'}
                        {showPoetry && !showReading && 'اقرأ الأبيات التالية:'}
                        {showGrammar && 'تأمل الجملة التالية:'}
                    </h3>
                </div>

                <div className="bg-white dark:bg-[#252530] rounded-lg p-4 border border-violet-200/50 dark:border-violet-800/30">
                    {/* Reading Passage */}
                    {showReading && hasReadingContent && (
                        <ReadingPassage block={block} />
                    )}

                    {/* Poetry */}
                    {showPoetry && hasPoetryContent && !showReading && (
                        <PoetryContent block={block} />
                    )}

                    {/* Grammar */}
                    {showGrammar && (
                        <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                            {block.contextText || 'النص'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReadingPassage({ block }: { block: any }) {
    return (
        <div>
            {(block.title || block.readingTitle) && (
                <div className="text-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {block.title || block.readingTitle}
                    </h4>
                </div>
            )}
            <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap text-justify max-h-48 overflow-y-auto">
                {block.bodyText || block.readingText || 'نص القراءة'}
            </div>
        </div>
    );
}

function PoetryContent({ block }: { block: any }) {
    const verses = block.verses || block.poetryVerses || [];

    return (
        <div className="text-center space-y-2 font-amiri">
            {(block.poemTitle || block.poetryTitle) && (
                <h4 className="text-base font-bold text-violet-700 dark:text-violet-400 mb-2">
                    {block.poemTitle || block.poetryTitle}
                </h4>
            )}
            {verses.map((verse: any, vIdx: number) => (
                <div key={vIdx} className="flex justify-center items-center gap-4 md:gap-8 text-sm text-gray-800 dark:text-gray-200">
                    <span className="text-right flex-1">{verse.shatrA || verse.firstHalf}</span>
                    <span className="text-violet-400 text-xs">⁂</span>
                    <span className="text-left flex-1">{verse.shatrB || verse.secondHalf}</span>
                </div>
            ))}
            {block.poet && (
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs">
                    — {block.poet}
                </p>
            )}
        </div>
    );
}

function QuestionsArea({ block, answers, onAnswerChange }: { block: any; answers: Record<string, any>; onAnswerChange: (id: string, value: any) => void }) {
    const subsections = block.subsections || [];
    const questions = block.questions || [];
    const totalQuestionsCount = questions.length;

    // إذا فيه subsections - نعرض حسب النوع
    if (subsections.length > 0) {
        return (
            <div className="p-4 lg:p-5 space-y-6">
                {subsections.map((subsection: any, subIdx: number) => (
                    <div key={subsection.id || subIdx} className="space-y-3">
                        {/* عنوان نوع الأسئلة */}
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2e2e3a]">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${getSubsectionColor(subsection.type)
                                }`}>
                                <span className="font-bold text-xs">{getSubsectionIcon(subsection.type)}</span>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                {subsection.title}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({subsection.questions?.length || 0} سؤال)
                            </span>
                        </div>

                        {/* أسئلة هذا النوع */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {(subsection.questions || []).map((q: any, qIdx: number) => (
                                <QuestionCard
                                    key={q.id}
                                    question={q}
                                    index={qIdx}
                                    answer={answers[q.id]}
                                    onAnswer={onAnswerChange}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // الهيكل القديم - كل الأسئلة معاً
    return (
        <div className="p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-[#2e2e3a]">
                <div className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <span className="text-violet-600 dark:text-violet-400 font-bold text-xs">؟</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">الأسئلة</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({totalQuestionsCount} سؤال)
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {questions.map((q: any, qIdx: number) => (
                    <QuestionCard
                        key={q.id}
                        question={q}
                        index={qIdx}
                        answer={answers[q.id]}
                        onAnswer={onAnswerChange}
                    />
                ))}
            </div>
        </div>
    );
}

// دوال مساعدة للألوان والأيقونات
function getSubsectionColor(type: string): string {
    switch (type) {
        case 'mcq': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
        case 'true_false': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
        case 'fill_blank': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
        case 'matching': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
        case 'ordering': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400';
        case 'essay': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
        default: return 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400';
    }
}

function getSubsectionIcon(type: string): string {
    switch (type) {
        case 'mcq': return '☑';
        case 'true_false': return '✓✗';
        case 'fill_blank': return '___';
        case 'matching': return '↔';
        case 'ordering': return '123';
        case 'essay': return '✎';
        default: return '؟';
    }
}

function QuestionCard({ question, index, answer, onAnswer }: { question: any; index: number; answer: any; onAnswer: (id: string, value: any) => void }) {
    const isAnswered = answer !== undefined;

    return (
        <div
            className={`p-3 rounded-lg border transition-all ${isAnswered
                ? 'border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10'
                : 'border-gray-200 dark:border-[#2e2e3a] bg-gray-50/30 dark:bg-[#252530]/30 hover:border-violet-200 dark:hover:border-violet-800'
                }`}
        >
            {/* Question Header */}
            <div className="flex items-start gap-2 mb-2">
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${isAnswered
                    ? 'bg-green-500 text-white'
                    : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                    }`}>
                    {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-medium text-sm leading-relaxed">
                        {question.stem || question.textAr || question.text || ''}
                    </p>
                </div>
            </div>

            {/* Answer Area */}
            <div className="mr-9">
                {question.type === 'mcq' && question.options ? (
                    <MCQOptions
                        questionId={question.id}
                        options={question.options}
                        selectedAnswer={answer}
                        onAnswer={onAnswer}
                        lang="ar"
                    />
                ) : (
                    <TextAnswer
                        questionId={question.id}
                        value={answer || ''}
                        onAnswer={onAnswer}
                        rows={3}
                        lang="ar"
                    />
                )}
            </div>
        </div>
    );
}

function SectionFooter({ currentIndex, block, answers }: { currentIndex: number; block: any; answers: Record<string, any> }) {
    const questions = block.questions || [];
    const answeredCount = questions.filter((q: any) => answers[q.id] !== undefined).length;

    return (
        <div className="px-4 py-2 bg-gray-50 dark:bg-[#252530] border-t border-gray-200 dark:border-[#2e2e3a]">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>نهاية القسم {currentIndex + 1}</span>
                <span>{answeredCount} / {questions.length} مُجاب</span>
            </div>
        </div>
    );
}
