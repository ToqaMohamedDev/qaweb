// =============================================
// أنواع الأسئلة الموحدة - Question Types
// =============================================

import { LangText, QuestionType, DifficultyLevel, QuestionMedia, AnswerOption } from './exam';

// ═══════════════════════════════════════════════════════════════════════════
// 1. LESSON QUESTION (بنك الأسئلة)
// ═══════════════════════════════════════════════════════════════════════════

/** سؤال الدرس / بنك الأسئلة - يطابق جدول lesson_questions */
export interface LessonQuestion {
    id: string;
    lesson_id: string | null;
    stage_id?: string | null;
    subject_id?: string | null;
    group_id?: string | null;

    // المحتوى - JSONB fields
    text: unknown; // Json
    type: string;
    options: unknown; // Json
    correct_option_id?: string | null;
    correct_answer?: unknown; // Json

    // الخصائص
    points?: number;
    difficulty?: string;
    order_index?: number;

    // الوسائط والشرح - JSONB fields
    media?: unknown; // Json
    hint?: unknown; // Json
    explanation?: unknown; // Json
    section_title?: unknown; // Json

    // بيانات إضافية للأسئلة الخاصة
    metadata?: unknown; // Json

    // التصنيف
    tags?: string[] | null;

    // الحالة
    is_active: boolean;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
}

/** بيانات إضافية للأسئلة الخاصة */
export interface QuestionMetadata {
    // للإعراب
    underlinedWord?: string;
    // للفراغات
    blankText?: LangText;
    // للاستخراج
    extractionTarget?: string;
    // بيانات أخرى
    [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. QUESTION BANK ITEM
// ═══════════════════════════════════════════════════════════════════════════

/** سؤال بنك الأسئلة */
export interface QuestionBankItem extends LessonQuestion {
    subject_id: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. CREATE/UPDATE INPUTS
// ═══════════════════════════════════════════════════════════════════════════

/** إدخال سؤال للدرس */
export interface CreateLessonQuestionInput {
    lesson_id: string;
    stage_id?: string;
    subject_id?: string;
    group_id?: string;
    text: unknown; // Json
    type: string;
    options?: unknown; // Json
    correct_option_id?: string;
    correct_answer?: unknown; // Json
    points?: number;
    difficulty?: string;
    order_index?: number;
    media?: unknown; // Json
    hint?: unknown; // Json
    explanation?: unknown; // Json
    section_title?: unknown; // Json
    metadata?: unknown; // Json
    tags?: string[];
}

/** إدخال سؤال لبنك الأسئلة */
export interface CreateQuestionBankInput extends CreateLessonQuestionInput {
    subject_id: string;
}

/** تحديث سؤال */
export interface UpdateQuestionInput extends Partial<CreateLessonQuestionInput> { }

// ═══════════════════════════════════════════════════════════════════════════
// 4. QUESTION FILTERS
// ═══════════════════════════════════════════════════════════════════════════

/** فلتر البحث في الأسئلة */
export interface QuestionFilter {
    lesson_id?: string;
    stage_id?: string;
    subject_id?: string;
    group_id?: string;
    difficulty?: string;
    type?: string;
    tags?: string[];
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}

/** فلتر البحث في بنك الأسئلة */
export interface QuestionBankFilter extends QuestionFilter {
    subject_id?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. QUESTION STATS
// ═══════════════════════════════════════════════════════════════════════════

/** إحصائيات السؤال */
export interface QuestionStats {
    id: string;
    question_id: string;
    question_type: 'bank' | 'lesson';
    times_asked: number;
    times_correct: number;
    times_wrong: number;
    average_time_seconds: number;
    difficulty_rating: number;
    last_asked_at?: string;
    updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. QUESTION GROUP (Section)
// ═══════════════════════════════════════════════════════════════════════════

/** مجموعة أسئلة (قسم) */
export interface QuestionGroup {
    group_id: string;
    section_title: LangText;
    section_type: 'reading' | 'poetry' | 'standard';
    media?: {
        type: 'reading' | 'poetry';
        title?: string;
        text?: string;
        verses?: { first: string; second: string }[];
    };
    questions: LessonQuestion[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** تحويل نوع السؤال للعرض */
export function getQuestionTypeLabel(type: string, lang: 'ar' | 'en' = 'ar'): string {
    const labels: Record<string, { ar: string; en: string }> = {
        mcq: { ar: 'اختيار متعدد', en: 'Multiple Choice' },
        truefalse: { ar: 'صح/خطأ', en: 'True/False' },
        essay: { ar: 'مقالي', en: 'Essay' },
        fill_blank: { ar: 'أكمل الفراغ', en: 'Fill in the Blank' },
        matching: { ar: 'مطابقة', en: 'Matching' },
        parsing: { ar: 'إعراب', en: 'Parsing' },
        extraction: { ar: 'استخراج', en: 'Extraction' },
    };
    return labels[type]?.[lang] || type;
}

/** تحويل مستوى الصعوبة للعرض */
export function getDifficultyLabel(difficulty: string, lang: 'ar' | 'en' = 'ar'): string {
    const labels: Record<string, { ar: string; en: string }> = {
        easy: { ar: 'سهل', en: 'Easy' },
        medium: { ar: 'متوسط', en: 'Medium' },
        hard: { ar: 'صعب', en: 'Hard' },
    };
    return labels[difficulty]?.[lang] || difficulty;
}

/** الحصول على لون الصعوبة */
export function getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
        easy: 'green',
        medium: 'yellow',
        hard: 'red',
    };
    return colors[difficulty] || 'gray';
}

