// =============================================
// أنواع قوالب الامتحانات ثنائية اللغة
// =============================================

/** نص ثنائي اللغة */
export type LangText = {
    ar: string;
    en: string;
};

/** لغة الامتحان */
export type ExamLanguage = 'ar' | 'en' | 'multi';

/** نوع السؤال */
export type QuestionType = 'mcq' | 'truefalse' | 'essay' | 'fill_blank' | 'matching';

/** حالة المحاولة */
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'expired';

/** إعدادات الامتحان */
export interface ExamSettings {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    allowBack: boolean;
    passScore: number;
    showResults: boolean;
    showCorrectAnswers: boolean;
}

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
}

/** قالب الامتحان */
export interface ExamTemplate {
    id: string;
    title: LangText;
    description: LangText;
    language: ExamLanguage;
    subject_id: string | null;
    stage_id: string | null;
    lesson_id: string | null;
    subject_name: string | null;
    grade: string | null;
    duration_minutes: number;
    max_attempts: number;
    is_published: boolean;
    settings: ExamSettings;
    questions_count: number;
    total_points: number;
    attempts_count: number;
    average_score: number;
    starts_at: string | null;
    ends_at: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

/** سؤال القالب */
export interface TemplateQuestion {
    id: string;
    template_id: string;
    lesson_id: string | null;
    text: LangText;
    type: QuestionType;
    options: AnswerOption[];
    correct_option_id: string | null;
    correct_answer: any;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
    order_index: number;
    tags: string[];
    media: QuestionMedia;
    hint: LangText;
    explanation: LangText;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** إجابة الطالب على سؤال */
export interface StudentAnswer {
    selectedOptionId?: string;
    textAnswer?: string;
    answeredAt: string;
}

/** نتيجة سؤال */
export interface QuestionResult {
    questionId: string;
    correct: boolean;
    pointsEarned: number;
    studentAnswer: StudentAnswer;
}

/** محاولة امتحان */
export interface ExamAttempt {
    id: string;
    template_id: string;
    student_id: string;
    status: AttemptStatus;
    started_at: string;
    submitted_at: string | null;
    graded_at: string | null;
    expires_at: string | null;
    answers: Record<string, StudentAnswer>;
    score: number;
    total_points: number;
    percentage: number;
    passed: boolean;
    time_spent_seconds: number;
    questions_answered: number;
    question_results: QuestionResult[];
}

/** قالب مع أسئلته */
export interface ExamTemplateWithQuestions extends ExamTemplate {
    questions: TemplateQuestion[];
}

/** ملخص قالب (للقوائم) */
export interface ExamTemplateSummary {
    id: string;
    title: LangText;
    subject_name: string | null;
    grade: string | null;
    duration_minutes: number;
    questions_count: number;
    attempts_count: number;
    average_score: number;
    is_published: boolean;
    created_at: string;
    created_by: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
}

/** إدخال قالب جديد */
export interface CreateExamTemplateInput {
    title: LangText;
    description?: LangText;
    language: ExamLanguage;
    subject_id?: string;
    subject_name?: string;
    grade?: string;
    duration_minutes: number;
    settings?: Partial<ExamSettings>;
}

/** إدخال سؤال جديد */
export interface CreateQuestionInput {
    text: LangText;
    type: QuestionType;
    options?: AnswerOption[];
    correct_option_id?: string;
    correct_answer?: any;
    points?: number;
    order_index?: number;
    media?: QuestionMedia;
    hint?: LangText;
    explanation?: LangText;
}

/** بدء محاولة امتحان */
export interface StartAttemptInput {
    template_id: string;
}

/** تسليم إجابات */
export interface SubmitAnswersInput {
    attempt_id: string;
    answers: Record<string, StudentAnswer>;
}

// =============================================
// أنواع بنك الأسئلة وأسئلة الدروس
// =============================================

/** مستوى الصعوبة */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/** سؤال بنك الأسئلة */
export interface QuestionBankItem {
    id: string;
    text: LangText;
    type: QuestionType;
    options: AnswerOption[];
    correct_option_id: string | null;
    correct_answer: any;
    points: number;
    difficulty: DifficultyLevel;
    subject_id: string | null;
    lesson_id: string | null;
    tags: string[];
    media: QuestionMedia;
    hint: LangText;
    explanation: LangText;
    created_by: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** سؤال الدرس */
export interface LessonQuestion {
    id: string;
    lesson_id: string;
    text: LangText;
    type: QuestionType;
    options: AnswerOption[];
    correct_option_id: string | null;
    correct_answer: any;
    points: number;
    difficulty: DifficultyLevel;
    order_index: number;
    media: QuestionMedia;
    hint: LangText;
    explanation: LangText;
    created_by: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** إحصائيات السؤال */
export interface QuestionStats {
    id: string;
    question_type: 'template' | 'bank' | 'lesson';
    question_id: string;
    times_asked: number;
    times_correct: number;
    times_wrong: number;
    average_time_seconds: number;
    difficulty_rating: number;
    last_asked_at: string | null;
    updated_at: string;
}

/** إدخال سؤال لبنك الأسئلة */
export interface CreateQuestionBankInput {
    text: LangText;
    type: QuestionType;
    options?: AnswerOption[];
    correct_option_id?: string;
    correct_answer?: any;
    points?: number;
    difficulty?: DifficultyLevel;
    subject_id?: string;
    lesson_id?: string;
    tags?: string[];
    media?: QuestionMedia;
    hint?: LangText;
    explanation?: LangText;
}

/** إدخال سؤال للدرس */
export interface CreateLessonQuestionInput {
    lesson_id: string;
    text: LangText;
    type: QuestionType;
    options?: AnswerOption[];
    correct_option_id?: string;
    correct_answer?: any;
    points?: number;
    difficulty?: DifficultyLevel;
    order_index?: number;
    media?: QuestionMedia;
    hint?: LangText;
    explanation?: LangText;
}

/** فلتر البحث في بنك الأسئلة */
export interface QuestionBankFilter {
    subject_id?: string;
    lesson_id?: string;
    difficulty?: DifficultyLevel;
    type?: QuestionType;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
}

// =============================================
// أنواع الامتحانات الشاملة (Comprehensive Exams)
// =============================================

/** نطاق الاستخدام */
export type UsageScope = 'exam' | 'lesson';

/** وضع التصحيح */
export type GradingMode = 'manual' | 'hybrid' | 'auto';

// =============================================
// الامتحان العربي الشامل
// =============================================

/** نوع الكتلة للامتحان العربي */
export type ArabicBlockType = 'reading_passage' | 'poetry_text' | 'grammar_block' | 'expression_block';

/** نوع السؤال للامتحان العربي */
export type ArabicQuestionType = 'mcq' | 'maqali' | 'comparison_story' | 'rhetoric' | 'grammar_extraction';

/** علامة الفرع */
export type BranchTag = 'Naho' | 'Adab' | 'Balagha' | 'Qiraa' | 'Qesaa' | 'Taraaib' | 'TafkirNaqdi';

/** بيت شعر */
export interface Verse {
    shatrA: string;
    shatrB: string;
}

/** قيود التعبير */
export interface ExpressionConstraints {
    maxLines?: number;
    minWords?: number;
    maxWords?: number;
}

/** السؤال الأساسي للامتحان العربي */
export interface BaseArabicQuestion {
    id: string;
    type: ArabicQuestionType;
    weight: number;
    branchTag?: BranchTag;
}

/** سؤال اختيار من متعدد */
export interface MCQQuestion extends BaseArabicQuestion {
    type: 'mcq';
    stem: string;
    options: string[];
    correctIndex: number;
}

/** سؤال مقالي */
export interface MaqaliQuestion extends BaseArabicQuestion {
    type: 'maqali';
    prompt: string;
    modelAnswerKeywords?: string[];
}

/** سؤال مقارنة قصة */
export interface ComparisonStoryQuestion extends BaseArabicQuestion {
    type: 'comparison_story';
    prompt: string;
    externalSnippet: string;
    modelAnswerKeywords?: string[];
}

/** سؤال بلاغة */
export interface RhetoricQuestion extends BaseArabicQuestion {
    type: 'rhetoric';
    prompt: string;
    correctAnswer?: string;
}

/** سؤال استخراج نحوي */
export interface GrammarExtractionQuestion extends BaseArabicQuestion {
    type: 'grammar_extraction';
    prompt: string;
    correctAnswer?: string;
}

/** أنواع أسئلة الامتحان العربي */
export type ArabicExamQuestion =
    | MCQQuestion
    | MaqaliQuestion
    | ComparisonStoryQuestion
    | RhetoricQuestion
    | GrammarExtractionQuestion;

/** الكتلة الأساسية */
export interface BaseBlock {
    id: string;
    type: ArabicBlockType;
    order: number;
    branchTag?: BranchTag;
    title?: string;
}

/** كتلة نص القراءة */
export interface ReadingBlock extends BaseBlock {
    type: 'reading_passage';
    genre: 'Scientific' | 'Literary';
    bodyText: string;
    questions: ArabicExamQuestion[];
}

/** كتلة النص الشعري */
export interface PoetryBlock extends BaseBlock {
    type: 'poetry_text';
    poemTitle?: string;
    poet?: string;
    verses: Verse[];
    questions: ArabicExamQuestion[];
}

/** كتلة النحو */
export interface GrammarBlock extends BaseBlock {
    type: 'grammar_block';
    contextText?: string;
    questions: ArabicExamQuestion[];
}

/** كتلة التعبير */
export interface ExpressionBlock extends BaseBlock {
    type: 'expression_block';
    variant: 'functional' | 'creative';
    prompt: string;
    constraints?: ExpressionConstraints;
    questions: ArabicExamQuestion[];
}

/** أنواع الكتل */
export type ExamBlock = ReadingBlock | PoetryBlock | GrammarBlock | ExpressionBlock;

/** وثيقة الامتحان العربي الشامل */
export interface ArabicComprehensiveExam {
    id: string;
    type: 'arabic_comprehensive_exam';
    language: 'arabic';
    usageScope: UsageScope;
    lessonId?: string;
    examTitle: string;
    examDescription?: string;
    totalMarks?: number;
    durationMinutes?: number;
    gradingMode: GradingMode;
    branchTags: BranchTag[];
    blocks: ExamBlock[];
    isPublished: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================
// الامتحان الإنجليزي الشامل
// =============================================

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

/** سؤال اختر اثنين من خمسة */
export interface ChooseTwoOutOfFive {
    id: string;
    question: string;
    options: string[];
    correctAnswers: number[];
    points?: number;
}

/** فقرة القراءة */
export interface ReadingPassage {
    id: string;
    passage: string;
    questions: EnglishMCQ[];
}

/** سؤال الترجمة */
export interface TranslationQuestion {
    id: string;
    originalText: string;
    translationDirection: 'en-to-ar' | 'ar-to-en';
    options: string[];
    correctAnswer: number;
    points?: number;
}

/** سؤال المقال */
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
    chooseTwoQuestions?: ChooseTwoOutOfFive[];
    writingMechanicsQuestions?: EnglishMCQ[];
    readingPassages?: ReadingPassage[];
    translationQuestions?: TranslationQuestion[];
    essayQuestions?: EnglishEssayQuestion[];
}

/** وثيقة الامتحان الإنجليزي الشامل */
export interface EnglishComprehensiveExam {
    id: string;
    type: 'english_comprehensive_exam';
    language: 'english';
    usageScope: UsageScope;
    lessonId?: string;
    examTitle: string;
    examDescription?: string;
    durationMinutes?: number;
    passingScore?: number;
    gradingMode: GradingMode;
    branchTags: string[];
    sections: EnglishExamSection[];
    isPublished: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

/** نوع الامتحان الشامل */
export type ComprehensiveExam = ArabicComprehensiveExam | EnglishComprehensiveExam;
