// =============================================
// Question Bank Types - أنواع بنك الأسئلة
// =============================================

export type ContentType = 'reading' | 'poetry' | 'none';
export type QuestionType = 'mcq' | 'trueFalse' | 'essay' | 'parsing' | 'fillBlank' | 'extraction';
export type Lang = 'ar' | 'en';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Stage {
    id: string;
    name: string;
}

export interface Subject {
    id: string;
    name: string;
}

export interface Lesson {
    id: string;
    title: string;
}

export interface PoetryVerse {
    id: string;
    firstHalf: string;
    secondHalf: string;
}

export interface QuestionOption {
    textAr: string;
    textEn: string;
    isCorrect: boolean;
}

export interface Question {
    id: string;
    type: QuestionType;
    textAr: string;
    textEn: string;
    options: QuestionOption[];
    hintAr: string;
    hintEn: string;
    explanationAr: string;
    explanationEn: string;
    difficulty: Difficulty;
    points: number;
    /** For parsing questions */
    underlinedWord?: string;
    /** For fill blank - template text with [blank] */
    blankTextAr?: string;
    blankTextEn?: string;
    /** For fill blank - correct answer */
    correctAnswerAr?: string;
    correctAnswerEn?: string;
    /** For extraction questions */
    extractionTarget?: string;
}

export interface QuestionSection {
    id: string;
    sectionType: QuestionType;
    titleAr: string;
    titleEn: string;
    questions: Question[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Content Block (Reading/Poetry)
// ═══════════════════════════════════════════════════════════════════════════

export interface ReadingContent {
    title: string;
    genre: 'Scientific' | 'Literary';
    text: string;
}

export interface PoetryContent {
    poemTitle: string;
    poet: string;
    verses: PoetryVerse[];
}

export interface ContentBlock {
    type: ContentType;
    reading?: ReadingContent;
    poetry?: PoetryContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// Form State
// ═══════════════════════════════════════════════════════════════════════════

export interface QuestionBankFormState {
    lang: Lang;
    stageId: string;
    subjectId: string;
    lessonId: string;
    content: ContentBlock;
    sections: QuestionSection[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

export function createEmptyQuestion(type: QuestionType = 'mcq'): Question {
    return {
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        textAr: '',
        textEn: '',
        options: type === 'mcq' || type === 'trueFalse' ? [
            { textAr: '', textEn: '', isCorrect: false },
            { textAr: '', textEn: '', isCorrect: false },
            ...(type === 'mcq' ? [
                { textAr: '', textEn: '', isCorrect: false },
                { textAr: '', textEn: '', isCorrect: false },
            ] : []),
        ] : [],
        hintAr: '',
        hintEn: '',
        explanationAr: '',
        explanationEn: '',
        difficulty: 'medium',
        points: 1,
    };
}

export function createEmptySection(type: QuestionType = 'mcq'): QuestionSection {
    return {
        id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sectionType: type,
        titleAr: '',
        titleEn: '',
        questions: [createEmptyQuestion(type)],
    };
}

export function createEmptyVerse(): PoetryVerse {
    return {
        id: `verse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        firstHalf: '',
        secondHalf: '',
    };
}

export function createEmptyContent(): ContentBlock {
    return {
        type: 'none',
        reading: {
            title: '',
            genre: 'Literary',
            text: '',
        },
        poetry: {
            poemTitle: '',
            poet: '',
            verses: [createEmptyVerse()],
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationError {
    field: string;
    message: string;
}

export function validateQuestion(q: Question, lang: Lang): ValidationError[] {
    const errors: ValidationError[] = [];
    const textField = lang === 'ar' ? 'textAr' : 'textEn';

    if (!q[textField]?.trim()) {
        errors.push({ field: 'text', message: lang === 'ar' ? 'يجب كتابة نص السؤال' : 'Question text is required' });
    }

    if (q.type === 'mcq' || q.type === 'trueFalse') {
        const hasCorrect = q.options.some(opt => opt.isCorrect);
        if (!hasCorrect) {
            errors.push({ field: 'options', message: lang === 'ar' ? 'يجب تحديد الإجابة الصحيحة' : 'Must select correct answer' });
        }
    }

    return errors;
}

export function validateSection(section: QuestionSection, lang: Lang): ValidationError[] {
    const errors: ValidationError[] = [];
    const titleField = lang === 'ar' ? 'titleAr' : 'titleEn';

    if (!section[titleField]?.trim()) {
        errors.push({ field: 'title', message: lang === 'ar' ? 'يجب كتابة عنوان القسم' : 'Section title is required' });
    }

    section.questions.forEach((q, idx) => {
        const qErrors = validateQuestion(q, lang);
        qErrors.forEach(err => {
            errors.push({ ...err, field: `question-${idx}-${err.field}` });
        });
    });

    return errors;
}
