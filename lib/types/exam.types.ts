/**
 * Exam Types
 * Centralized types for exam-related data
 */

// =============================================
// Question Types
// =============================================

export type QuestionType =
    | 'mcq'           // Multiple Choice
    | 'true_false'    // True/False
    | 'fill_blank'    // Fill in the blank
    | 'matching'      // Matching
    | 'ordering'      // Ordering
    | 'essay'         // Essay
    | 'short_answer'; // Short answer

export interface QuestionOption {
    id?: string;
    text?: string;
    textAr?: string;
    textEn?: string;
    isCorrect?: boolean;
}

export interface Question {
    id: string;
    type: QuestionType;
    stem: string;
    textAr?: string;
    textEn?: string;
    options?: (QuestionOption | string)[];
    correctAnswer?: number | string;
    explanationAr?: string;
    explanationEn?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    points?: number;
    order?: number;
}

// =============================================
// Exam Block/Section Types
// =============================================

export interface ExamSubsection {
    id: string;
    title: string;
    type: QuestionType;
    questions: Question[];
}

export interface ExamBlock {
    id: string;
    type?: string;
    contentType?: string;
    order?: number;
    titleAr?: string;
    titleEn?: string;
    title?: string;
    subsections?: ExamSubsection[];
    questions?: Question[];

    // Content fields
    readingTitle?: string;
    readingText?: string;
    bodyText?: string;
    poetryTitle?: string;
    poetryVerses?: { shatrA?: string; shatrB?: string; firstHalf?: string; secondHalf?: string }[];
    verses?: any[];
    contextText?: string;
    prompt?: string;
    genre?: string;
    poet?: string;
}

// =============================================
// Exam Types
// =============================================

export interface Exam {
    id: string;
    exam_title: string;
    exam_description?: string;
    duration_minutes?: number;
    total_marks?: number;
    stage_id?: string | null;
    subject_id?: string | null;
    language?: 'arabic' | 'english';
    type?: string;
    is_published: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;

    // Time-limited exam fields
    is_time_limited?: boolean;
    available_from?: string | null;
    available_until?: string | null;

    // Content
    blocks?: ExamBlock[];
    sections?: ExamBlock[];
}

export interface TransformedExam {
    id: string;
    examTitle: string;
    examDescription?: string;
    durationMinutes?: number;
    totalMarks?: number;
    blocks: ExamBlock[];
    isTimeLimited?: boolean;
    availableFrom?: string | null;
    availableUntil?: string | null;
}

// =============================================
// Exam Attempt Types
// =============================================

export type AttemptStatus = 'in_progress' | 'completed' | 'graded' | 'expired';

export interface ExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    status: AttemptStatus;
    answers: Record<string, any>;
    total_score?: number;
    max_score?: number;
    started_at: string;
    completed_at?: string;
    graded_at?: string;
    created_at: string;
    updated_at: string;
}

// =============================================
// Exam Player State
// =============================================

export interface ExamPlayerState {
    exam: TransformedExam | null;
    isLoading: boolean;
    error: Error | null;
    currentBlockIndex: number;
    totalBlocks: number;
    answers: Record<string, any>;
    answeredCount: number;
    totalQuestions: number;
    progress: number;
    timeLeft: number | null;
    timeFormatted: string;
    isTimeWarning: boolean;
    isSubmitting: boolean;
    attemptId: string | null;
}

// =============================================
// Exam Availability
// =============================================

export interface ExamAvailability {
    isAvailable: boolean;
    reason: 'available' | 'not_started' | 'ended' | null;
    message: string | null;
    timeLeft: number | null;
}

// =============================================
// Type Guards
// =============================================

export function isQuestion(obj: any): obj is Question {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.type === 'string'
    );
}

export function isExam(obj: any): obj is Exam {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.exam_title === 'string'
    );
}

// =============================================
// Transformers
// =============================================

/**
 * Get question type label in Arabic
 */
export function getQuestionTypeLabel(type: QuestionType | string): string {
    switch (type) {
        case 'mcq': return 'اختيار من متعدد';
        case 'true_false': return 'صح أو خطأ';
        case 'fill_blank': return 'أكمل الفراغ';
        case 'matching': return 'توصيل';
        case 'ordering': return 'ترتيب';
        case 'essay': return 'مقالي';
        case 'short_answer': return 'إجابة قصيرة';
        default: return 'أسئلة';
    }
}

/**
 * Transform raw option to string
 */
export function getOptionText(option: QuestionOption | string, lang: 'ar' | 'en' = 'ar'): string {
    if (typeof option === 'string') {
        return option;
    }
    return option.textAr || option.text || '';
}

/**
 * Calculate correct answer index from options
 */
export function getCorrectAnswerIndex(options: (QuestionOption | string)[]): number {
    if (!options) return 0;

    const index = options.findIndex(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return opt.isCorrect === true;
        }
        return false;
    });

    return index >= 0 ? index : 0;
}

/**
 * Check exam time availability
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
