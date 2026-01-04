// =============================================
// Exam UI Components - مكونات واجهة الامتحان المشتركة
// =============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    BookOpen,
    FileText,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface ExamHeaderProps {
    examTitle: string;
    currentPage: number;
    totalPages: number;
    answeredCount: number;
    totalQuestions: number;
    progress: number;
    timeFormatted: string;
    isTimeWarning: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    lang: 'ar' | 'en';
}

interface ExamNavigationProps {
    blocks: any[];
    currentBlockIndex: number;
    answers: Record<string, any>;
    onBlockSelect: (index: number) => void;
    lang: 'ar' | 'en';
}

interface ExamFooterProps {
    currentBlockIndex: number;
    totalBlocks: number;
    isSubmitting: boolean;
    onPrev: () => void;
    onNext: () => void;
    onSubmit: () => void;
    lang: 'ar' | 'en';
}

interface MCQOptionsProps {
    questionId: string;
    options: string[];
    selectedAnswer: number | undefined;
    onAnswer: (questionId: string, value: number) => void;
    lang: 'ar' | 'en';
}

// ═══════════════════════════════════════════════════════════════════════════
// Loading Screen
// ═══════════════════════════════════════════════════════════════════════════

export function ExamLoadingScreen({ lang }: { lang: 'ar' | 'en' }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0f]">
            <LoadingSpinner
                size="lg"
                text={lang === 'ar' ? 'جاري تحميل الامتحان...' : 'Loading exam...'}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Screen
// ═══════════════════════════════════════════════════════════════════════════

export function ExamErrorScreen({
    error,
    onBack,
    lang,
}: {
    error: string;
    onBack: () => void;
    lang: 'ar' | 'en';
}) {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0f] p-4"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className="text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">
                    {lang === 'ar' ? 'خطأ' : 'Error'}
                </h2>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-gray-200 text-gray-800 font-medium"
                >
                    {lang === 'ar' ? 'العودة' : 'Go Back'}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Empty Exam Screen
// ═══════════════════════════════════════════════════════════════════════════

export function ExamEmptyScreen({
    onBack,
    lang,
}: {
    onBack: () => void;
    lang: 'ar' | 'en';
}) {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0f] p-4"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {lang === 'ar' ? 'لا يوجد محتوى للامتحان' : 'No exam content'}
                </h2>
                <p className="text-gray-500 mb-4">
                    {lang === 'ar' ? 'هذا الامتحان لا يحتوي على أسئلة حالياً' : 'This exam has no questions yet'}
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium"
                >
                    {lang === 'ar' ? 'العودة' : 'Go Back'}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Exam Header
// ═══════════════════════════════════════════════════════════════════════════

export function ExamHeader({
    examTitle,
    currentPage,
    totalPages,
    answeredCount,
    totalQuestions,
    progress,
    timeFormatted,
    isTimeWarning,
    isSubmitting,
    onSubmit,
    lang,
}: ExamHeaderProps) {
    const isArabic = lang === 'ar';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1a1a24]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-[#2e2e3a]/60">
            <div className="max-w-5xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                            {examTitle}
                        </h1>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                                {isArabic ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                            </span>
                            <span>•</span>
                            <span>
                                {answeredCount}/{totalQuestions} {isArabic ? 'سؤال' : 'answered'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {timeFormatted && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-sm font-bold ${isTimeWarning
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 animate-pulse'
                                    : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                                }`}>
                                <Clock className="h-4 w-4" />
                                <span>{timeFormatted}</span>
                            </div>
                        )}
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-violet-500/25 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            <span>{isArabic ? 'تسليم' : 'Submit'}</span>
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-1 bg-gray-200 dark:bg-[#2e2e3a] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        </header>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Page Navigation Pills
// ═══════════════════════════════════════════════════════════════════════════

export function ExamPageNavigation({
    blocks,
    currentBlockIndex,
    answers,
    onBlockSelect,
    lang,
}: ExamNavigationProps) {
    const isArabic = lang === 'ar';

    return (
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
            {blocks.map((block, idx) => {
                const blockQuestions = block.questions || [];
                const blockAnswered = blockQuestions.filter((q: any) => answers[q.id] !== undefined).length;
                const isComplete = blockAnswered === blockQuestions.length && blockQuestions.length > 0;
                const isCurrent = idx === currentBlockIndex;

                return (
                    <button
                        key={block.id}
                        onClick={() => onBlockSelect(idx)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isCurrent
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                : isComplete
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-white dark:bg-[#1c1c24] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252530]'
                            } border ${isCurrent ? 'border-violet-500' : 'border-gray-200 dark:border-[#2e2e3a]'}`}
                    >
                        <span>{isArabic ? `صفحة ${idx + 1}` : `Page ${idx + 1}`}</span>
                        {isComplete && !isCurrent && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </button>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MCQ Options
// ═══════════════════════════════════════════════════════════════════════════

export function MCQOptions({
    questionId,
    options,
    selectedAnswer,
    onAnswer,
    lang,
}: MCQOptionsProps) {
    const isArabic = lang === 'ar';
    const optionLabels = isArabic
        ? ['أ', 'ب', 'ج', 'د', 'هـ', 'و']
        : ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <div className="grid grid-cols-2 gap-1.5">
            {options.map((opt, optIdx) => {
                const isSelected = selectedAnswer === optIdx;

                return (
                    <label
                        key={optIdx}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${isSelected
                                ? 'bg-violet-100 dark:bg-violet-900/30 border border-violet-400 dark:border-violet-600'
                                : 'bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] hover:border-violet-300 dark:hover:border-violet-700'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${isSelected
                                ? 'bg-violet-500 text-white'
                                : 'bg-gray-100 dark:bg-[#2e2e3a] text-gray-600 dark:text-gray-400'
                            }`}>
                            {optionLabels[optIdx] || optIdx + 1}
                        </div>
                        <input
                            type="radio"
                            name={`q-${questionId}`}
                            checked={isSelected}
                            onChange={() => onAnswer(questionId, optIdx)}
                            className="sr-only"
                        />
                        <span className={`flex-1 text-xs leading-snug ${isSelected
                                ? 'text-violet-700 dark:text-violet-300 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                            {opt}
                        </span>
                        {isSelected && (
                            <CheckCircle2 className="h-3 w-3 text-violet-500 flex-shrink-0" />
                        )}
                    </label>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Text Answer
// ═══════════════════════════════════════════════════════════════════════════

export function TextAnswer({
    questionId,
    value,
    onAnswer,
    rows = 3,
    lang,
}: {
    questionId: string;
    value: string;
    onAnswer: (questionId: string, value: string) => void;
    rows?: number;
    lang: 'ar' | 'en';
}) {
    const isArabic = lang === 'ar';

    return (
        <textarea
            rows={rows}
            value={value || ''}
            onChange={(e) => onAnswer(questionId, e.target.value)}
            placeholder={isArabic ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
            className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] text-gray-800 dark:text-gray-200 focus:border-violet-400 dark:focus:border-violet-600 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
            dir={isArabic ? 'rtl' : 'ltr'}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Exam Footer Navigation
// ═══════════════════════════════════════════════════════════════════════════

export function ExamFooter({
    currentBlockIndex,
    totalBlocks,
    isSubmitting,
    onPrev,
    onNext,
    onSubmit,
    lang,
}: ExamFooterProps) {
    const isArabic = lang === 'ar';
    const isLastBlock = currentBlockIndex === totalBlocks - 1;
    const isFirstBlock = currentBlockIndex === 0;

    const PrevIcon = isArabic ? ChevronRight : ChevronLeft;
    const NextIcon = isArabic ? ChevronLeft : ChevronRight;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1a1a24]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-[#2e2e3a]/80 shadow-2xl shadow-black/10">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={onPrev}
                        disabled={isFirstBlock}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#353545] transition-all"
                    >
                        <PrevIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">
                            {isArabic ? 'الصفحة السابقة' : 'Previous'}
                        </span>
                        <span className="sm:hidden">
                            {isArabic ? 'السابق' : 'Prev'}
                        </span>
                    </button>

                    {/* Mobile Submit */}
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="sm:hidden flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {isArabic ? 'تسليم' : 'Submit'}
                    </button>

                    {isLastBlock ? (
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/25 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            {isArabic ? 'إنهاء وتسليم الامتحان' : 'Finish & Submit'}
                        </button>
                    ) : (
                        <button
                            onClick={onNext}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-violet-500/25 transition-all"
                        >
                            <span className="hidden sm:inline">
                                {isArabic ? 'الصفحة التالية' : 'Next'}
                            </span>
                            <span className="sm:hidden">
                                {isArabic ? 'التالي' : 'Next'}
                            </span>
                            <NextIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Export All
// ═══════════════════════════════════════════════════════════════════════════

export const ExamUI = {
    Loading: ExamLoadingScreen,
    Error: ExamErrorScreen,
    Empty: ExamEmptyScreen,
    Header: ExamHeader,
    PageNavigation: ExamPageNavigation,
    MCQOptions,
    TextAnswer,
    Footer: ExamFooter,
};
