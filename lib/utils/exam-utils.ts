/**
 * Exam Utilities
 * Helper functions for exam-related operations
 * 
 * This file consolidates all exam utility functions from:
 * - lib/types/exam.types.ts (moved here)
 * - hooks/useTeacherExamPlayer.ts (duplicated logic removed)
 * - components/shared/LessonPage.tsx (typeLabels object)
 */

// =============================================
// Types (imported from consolidated exam.ts)
// =============================================

import type {
    QuestionType,
    QuestionOption,
    Question,
    Exam,
    ExamAvailability,
} from '@/lib/types/exam';

// =============================================
// Question Type Labels
// =============================================

/**
 * Question type labels in Arabic and English
 * Unified source of truth for all components
 */
export const questionTypeLabels: Record<string, { ar: string; en: string }> = {
    'mcq': { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
    'true_false': { ar: 'صح أو خطأ', en: 'True or False' },
    'truefalse': { ar: 'صح أو خطأ', en: 'True or False' }, // Legacy support
    'fill_blank': { ar: 'أكمل الفراغ', en: 'Fill in the Blank' },
    'matching': { ar: 'توصيل', en: 'Matching' },
    'ordering': { ar: 'ترتيب', en: 'Ordering' },
    'essay': { ar: 'مقالي', en: 'Essay' },
    'short_answer': { ar: 'إجابة قصيرة', en: 'Short Answer' },
    'parsing': { ar: 'إعراب', en: 'Parsing' },
    'extraction': { ar: 'استخراج', en: 'Extraction' },
};

/**
 * Standard order for question types display
 */
export const questionTypeOrder: QuestionType[] = [
    'mcq',
    'true_false',
    'fill_blank',
    'matching',
    'ordering',
    'essay',
    'short_answer',
];

/**
 * Get question type label
 * @param type - Question type string
 * @param lang - Language ('ar' | 'en'), defaults to 'ar'
 */
export function getQuestionTypeLabel(type: QuestionType | string, lang: 'ar' | 'en' = 'ar'): string {
    const labels = questionTypeLabels[type];
    if (labels) {
        return lang === 'ar' ? labels.ar : labels.en;
    }
    return lang === 'ar' ? 'أسئلة' : 'Questions';
}

// =============================================
// Option Helpers
// =============================================

/**
 * Transform raw option to display string
 * @param option - Option object or string
 * @param lang - Language preference
 */
export function getOptionText(option: QuestionOption | string, lang: 'ar' | 'en' = 'ar'): string {
    if (typeof option === 'string') {
        return option;
    }
    if (lang === 'en' && option.textEn) {
        return option.textEn;
    }
    return option.textAr || option.text || '';
}

/**
 * Calculate correct answer index from options array
 * @param options - Array of question options
 */
export function getCorrectAnswerIndex(options: (QuestionOption | string)[]): number {
    if (!options || !Array.isArray(options)) return 0;

    const index = options.findIndex(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return opt.isCorrect === true;
        }
        return false;
    });

    return index >= 0 ? index : 0;
}

// =============================================
// Exam Availability
// =============================================

/**
 * Check if exam is available based on time constraints
 * @param exam - Exam object with time-limited fields
 */
export function checkExamAvailability(exam: Exam): ExamAvailability {
    if (!exam.is_time_limited || !exam.available_from || !exam.available_until) {
        return { isAvailable: true, reason: 'available', message: null, timeLeft: null };
    }

    const now = new Date();
    const from = new Date(exam.available_from);
    const until = new Date(exam.available_until);

    if (now < from) {
        return {
            isAvailable: false,
            reason: 'not_started',
            message: `الامتحان سيكون متاحاً في ${from.toLocaleString('ar-EG')}`,
            timeLeft: Math.floor((from.getTime() - now.getTime()) / 1000),
        };
    }

    if (now > until) {
        return {
            isAvailable: false,
            reason: 'ended',
            message: `انتهى وقت الامتحان في ${until.toLocaleString('ar-EG')}`,
            timeLeft: null,
        };
    }

    return {
        isAvailable: true,
        reason: 'available',
        message: null,
        timeLeft: Math.floor((until.getTime() - now.getTime()) / 1000),
    };
}

// =============================================
// Type Guards
// =============================================

/**
 * Check if object is a valid Question
 */
export function isQuestion(obj: unknown): obj is Question {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof (obj as Question).id === 'string' &&
        typeof (obj as Question).type === 'string'
    );
}

/**
 * Check if object is a valid Exam
 */
export function isExam(obj: unknown): obj is Exam {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof (obj as Exam).id === 'string' &&
        typeof (obj as Exam).exam_title === 'string'
    );
}

// =============================================
// Time Formatting
// =============================================

/**
 * Format seconds to MM:SS string
 * @param seconds - Time in seconds
 */
export function formatExamTime(seconds: number): string {
    if (seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if time is in warning zone (less than 5 minutes)
 * @param seconds - Time left in seconds
 * @param warningThreshold - Threshold in seconds (default: 300 = 5 min)
 */
export function isTimeWarning(seconds: number | null, warningThreshold: number = 300): boolean {
    return seconds !== null && seconds > 0 && seconds < warningThreshold;
}

// =============================================
// Score Calculations
// =============================================

/**
 * Calculate exam score percentage
 * @param score - Achieved score
 * @param maxScore - Maximum possible score
 */
export function calculateScorePercentage(score: number, maxScore: number): number {
    if (maxScore <= 0) return 0;
    return Math.round((score / maxScore) * 100);
}

/**
 * Check if score is passing (default: 60%)
 * @param score - Achieved score
 * @param maxScore - Maximum possible score
 * @param passingPercentage - Passing threshold (default: 60)
 */
export function isPassingScore(score: number, maxScore: number, passingPercentage: number = 60): boolean {
    return calculateScorePercentage(score, maxScore) >= passingPercentage;
}

/**
 * Get score grade label
 * @param percentage - Score percentage
 */
export function getScoreGrade(percentage: number): { label: string; labelAr: string; color: string } {
    if (percentage >= 90) return { label: 'Excellent', labelAr: 'ممتاز', color: 'green' };
    if (percentage >= 80) return { label: 'Very Good', labelAr: 'جيد جداً', color: 'blue' };
    if (percentage >= 70) return { label: 'Good', labelAr: 'جيد', color: 'cyan' };
    if (percentage >= 60) return { label: 'Pass', labelAr: 'مقبول', color: 'yellow' };
    return { label: 'Fail', labelAr: 'راسب', color: 'red' };
}
