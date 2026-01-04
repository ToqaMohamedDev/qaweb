// =============================================
// أنواع الامتحانات الموحدة - Exam Types
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// 1. CORE PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

/** نص ثنائي اللغة */
export interface LangText {
    ar: string;
    en: string;
}

/** نص موسع متعدد اللغات */
export interface LocalizedText {
    ar?: string;
    en?: string;
    fr?: string;
    [langCode: string]: string | undefined;
}

/** Helper to get text in current language with fallback */
export const getText = (text: LocalizedText | string | undefined, lang: 'ar' | 'en' = 'ar'): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[lang] || text.ar || text.en || '';
};

/** لغة الامتحان */
export type ExamLanguage = 'ar' | 'en' | 'multi';

/** اتجاه النص */
export type TextDirection = 'rtl' | 'ltr' | 'auto';

// ═══════════════════════════════════════════════════════════════════════════
// 2. QUESTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** أنواع الأسئلة الأساسية */
export type QuestionType =
    | 'mcq'           // اختيار متعدد
    | 'truefalse'     // صح/خطأ
    | 'essay'         // مقالي
    | 'fill_blank'    // أكمل الفراغ
    | 'matching'      // مطابقة
    | 'parsing'       // إعراب
    | 'extraction';   // استخراج

/** مستوى الصعوبة */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/** وضع التصحيح */
export type GradingMode = 'auto' | 'manual' | 'hybrid';

/** حالة المحاولة */
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'expired';

/** نطاق الاستخدام */
export type UsageScope = 'exam' | 'lesson' | 'quiz' | 'game' | 'practice';

// ═══════════════════════════════════════════════════════════════════════════
// 3. MEDIA & OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** وسائط السؤال */
export interface QuestionMedia {
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
}

/** خيار الإجابة */
export interface AnswerOption {
    id: string;
    text: LangText;
    isCorrect?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. EXAM SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/** إعدادات الامتحان */
export interface ExamSettings {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    allowBack: boolean;
    passScore: number;
    showResults: boolean;
    showCorrectAnswers: boolean;
}

const defaultExamSettings: ExamSettings = {
    shuffleQuestions: false,
    shuffleOptions: false,
    allowBack: true,
    passScore: 60,
    showResults: true,
    showCorrectAnswers: true,
};

export { defaultExamSettings };

// ═══════════════════════════════════════════════════════════════════════════
// 5. COMPREHENSIVE EXAM (Main Structure)
// ═══════════════════════════════════════════════════════════════════════════

/** علامة الفرع */
export type BranchTag = 'Naho' | 'Adab' | 'Balagha' | 'Qiraa' | 'Qesaa' | 'Taraaib' | 'TafkirNaqdi';

/** نوع الكتلة */
export type BlockType = 'reading_passage' | 'poetry_text' | 'grammar_block' | 'expression_block' | 'standard';

/** بيت شعر */
export interface Verse {
    shatrA: string;
    shatrB: string;
}

/** قيود الكتابة */
export interface WritingConstraints {
    minWords?: number;
    maxWords?: number;
    minLines?: number;
    maxLines?: number;
}

/** سؤال الامتحان */
export interface ExamQuestion {
    id: string;
    type: QuestionType;
    textAr: string;
    textEn: string;
    options?: AnswerOption[];
    correctOptionId?: string;
    correctAnswer?: LangText | number;
    points: number;
    difficulty?: DifficultyLevel;
    hint?: LangText;
    explanation?: LangText;
    media?: QuestionMedia;
    // للأسئلة الخاصة
    underlinedWord?: string;      // للإعراب
    blankTextAr?: string;         // للفراغات
    blankTextEn?: string;
    extractionTarget?: string;    // للاستخراج
}

/** كتلة الامتحان */
export interface ExamBlock {
    id: string;
    type: BlockType;
    titleAr?: string;
    titleEn?: string;
    order: number;
    branchTag?: BranchTag;
    // للقراءة
    genre?: 'Scientific' | 'Literary';
    bodyText?: string;
    // للشعر
    poemTitle?: string;
    poet?: string;
    verses?: Verse[];
    // الأسئلة
    questions: ExamQuestion[];
}

/** الامتحان الشامل - يطابق جدول comprehensive_exams */
export interface ComprehensiveExam {
    id: string;
    language: string;
    exam_title: string;
    exam_description?: string | null;
    lesson_id?: string | null;
    stage_id?: string | null;
    subject_id?: string | null;
    subject_name?: string | null;
    stage_name?: string | null;
    duration_minutes?: number | null;
    total_marks?: number | null;
    passing_score?: number | null;
    grading_mode?: string | null;
    branch_tags?: string[] | null;
    blocks: unknown; // JSONB - يحتوي على ExamBlock[]
    sections?: unknown | null; // JSONB - للتوافق مع الكود القديم
    is_published: boolean;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
    usage_scope?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. EXAM ATTEMPT & RESULTS
// ═══════════════════════════════════════════════════════════════════════════

/** إجابة الطالب */
export interface StudentAnswer {
    questionId: string;
    selectedOptionId?: string;
    textAnswer?: string;
    answeredAt: string;
    timeSpentSeconds?: number;
}

/** نتيجة سؤال */
export interface QuestionResult {
    questionId: string;
    correct: boolean;
    pointsEarned: number;
    maxPoints: number;
    studentAnswer?: StudentAnswer;
}

/** محاولة امتحان */
export interface ExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    status: AttemptStatus;
    started_at: string;
    submitted_at?: string;
    graded_at?: string;
    expires_at?: string;
    answers: Record<string, StudentAnswer>;
    score: number;
    total_points: number;
    percentage: number;
    passed: boolean;
    time_spent_seconds: number;
    questions_answered: number;
    question_results: QuestionResult[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. CREATE/UPDATE INPUTS
// ═══════════════════════════════════════════════════════════════════════════

/** إدخال امتحان جديد - يطابق جدول comprehensive_exams */
export interface CreateExamInput {
    type: string;
    language: string;
    exam_title: string;
    exam_description?: string;
    lesson_id?: string;
    stage_id?: string;
    subject_id?: string;
    subject_name?: string;
    stage_name?: string;
    duration_minutes?: number;
    total_marks?: number;
    passing_score?: number;
    grading_mode?: string;
    branch_tags?: string[];
    blocks?: unknown; // JSONB
    sections?: unknown; // JSONB
    usage_scope?: string;
}

/** تحديث امتحان */
export interface UpdateExamInput extends Partial<CreateExamInput> {
    is_published?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. ENGLISH EXAM SPECIFIC TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** نوع قسم الامتحان الإنجليزي */
export type EnglishSectionType = 'vocabulary_grammar' | 'advanced_writing' | 'reading' | 'translation' | 'essay';

/** سؤال MCQ إنجليزي */
export interface EnglishMCQ {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    points?: number;
}

/** سؤال المقال الإنجليزي */
export interface EnglishEssayQuestion {
    id: string;
    question: string;
    modelAnswer?: string;
    points?: number;
    requiredLines?: number;
    type: 'essay' | 'story';
}

/** قسم الامتحان الإنجليزي */
export interface EnglishExamSection {
    id: string;
    sectionType: EnglishSectionType;
    title: string;
    note?: string;
    vocabularyQuestions?: EnglishMCQ[];
    writingMechanicsQuestions?: EnglishMCQ[];
    essayQuestions?: EnglishEssayQuestion[];
}

// End of file
