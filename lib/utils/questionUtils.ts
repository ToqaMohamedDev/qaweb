// ═══════════════════════════════════════════════════════════════════════════
// Question Utilities - دوال مشتركة لإدارة الأسئلة والخيارات
// ═══════════════════════════════════════════════════════════════════════════

export type QuestionType = 'mcq' | 'essay' | 'true_false' | 'parsing' | 'fill_blank' | 'extraction';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Lang = 'ar' | 'en';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuestionOption {
    textAr: string;
    textEn: string;
    isCorrect: boolean;
}

export interface BaseQuestion {
    id: string;
    type: QuestionType;
    textAr: string;
    textEn: string;
    options: QuestionOption[];
    explanationAr: string;
    explanationEn: string;
    difficulty: Difficulty;
    points: number;
    underlinedWord?: string;
    blankTextAr?: string;
    blankTextEn?: string;
    correctAnswerAr?: string;
    correctAnswerEn?: string;
    extractionTarget?: string;
    hintAr?: string;
    hintEn?: string;
}

export interface PoetryVerse {
    id: string;
    firstHalf: string;
    secondHalf: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const createEmptyQuestion = <T extends BaseQuestion>(type: QuestionType = 'mcq'): T => ({
    id: `q-${createId()}`,
    type,
    textAr: '',
    textEn: '',
    options: type === 'mcq' ? [
        { textAr: '', textEn: '', isCorrect: true },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
    ] : type === 'true_false' ? [
        { textAr: 'صح', textEn: 'True', isCorrect: true },
        { textAr: 'خطأ', textEn: 'False', isCorrect: false },
    ] : [],
    explanationAr: '',
    explanationEn: '',
    difficulty: 'medium',
    points: 1,
    hintAr: '',
    hintEn: '',
    underlinedWord: '',
    blankTextAr: '',
    blankTextEn: '',
    correctAnswerAr: '',
    correctAnswerEn: '',
    extractionTarget: '',
} as T);

export const createEmptyVerse = (): PoetryVerse => ({
    id: `v-${createId()}`,
    firstHalf: '',
    secondHalf: '',
});

export const createEmptyOption = (): QuestionOption => ({
    textAr: '',
    textEn: '',
    isCorrect: false,
});

// ═══════════════════════════════════════════════════════════════════════════
// QUESTION TYPE LABELS
// ═══════════════════════════════════════════════════════════════════════════

export const questionTypeLabels: Record<QuestionType, { ar: string; en: string }> = {
    mcq: { ar: 'أسئلة اختيار من متعدد', en: 'Multiple Choice Questions' },
    true_false: { ar: 'أسئلة صح وخطأ', en: 'True/False Questions' },
    essay: { ar: 'أسئلة مقالية', en: 'Essay Questions' },
    parsing: { ar: 'أسئلة الإعراب', en: 'Parsing Questions' },
    fill_blank: { ar: 'أسئلة أكمل الفراغ', en: 'Fill in the Blank Questions' },
    extraction: { ar: 'أسئلة الاستخراج', en: 'Extraction Questions' },
};

// ═══════════════════════════════════════════════════════════════════════════
// PURE OPERATIONS - Question List Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add a question to a list
 */
export const addQuestionToList = <T extends BaseQuestion>(
    questions: T[],
    type: QuestionType = 'mcq'
): T[] => [...questions, createEmptyQuestion<T>(type)];

/**
 * Remove a question from a list (keeps at least 1)
 */
export const removeQuestionFromList = <T extends { id: string }>(
    questions: T[],
    questionId: string,
    minCount: number = 1
): T[] => {
    if (questions.length <= minCount) return questions;
    return questions.filter(q => q.id !== questionId);
};

/**
 * Duplicate a question in a list
 */
export const duplicateQuestionInList = <T extends { id: string }>(
    questions: T[],
    questionId: string
): T[] => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index === -1) return questions;
    const newQ = { ...questions[index], id: `q-${createId()}` };
    const updated = [...questions];
    updated.splice(index + 1, 0, newQ);
    return updated;
};

/**
 * Update a field on a question
 */
export const updateQuestionInList = <T extends { id: string }>(
    questions: T[],
    questionId: string,
    field: keyof T,
    value: any
): T[] => questions.map(q => q.id === questionId ? { ...q, [field]: value } : q);

/**
 * Update question text based on language
 */
export const updateQuestionTextInList = <T extends { id: string; textAr: string; textEn: string }>(
    questions: T[],
    questionId: string,
    value: string,
    lang: Lang
): T[] => {
    const field = lang === 'ar' ? 'textAr' : 'textEn';
    return questions.map(q => q.id === questionId ? { ...q, [field]: value } : q);
};

// ═══════════════════════════════════════════════════════════════════════════
// PURE OPERATIONS - Option Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update an option (text or isCorrect)
 * When setting isCorrect to true, all other options become false
 */
export const updateOptionInQuestion = (
    options: QuestionOption[],
    optionIndex: number,
    field: 'text' | 'isCorrect',
    value: string | boolean,
    lang: Lang = 'ar'
): QuestionOption[] => {
    const updated = [...options];
    if (field === 'isCorrect' && value === true) {
        updated.forEach((o, i) => { o.isCorrect = i === optionIndex; });
    } else if (field === 'text') {
        const textField = lang === 'ar' ? 'textAr' : 'textEn';
        updated[optionIndex] = { ...updated[optionIndex], [textField]: value };
    }
    return updated;
};

/**
 * Add an option to a question (max limit)
 */
export const addOptionToQuestion = (
    options: QuestionOption[],
    maxOptions: number = 8
): QuestionOption[] => {
    if (options.length >= maxOptions) return options;
    return [...options, createEmptyOption()];
};

/**
 * Remove an option from a question (min limit)
 */
export const removeOptionFromQuestion = (
    options: QuestionOption[],
    optionIndex: number,
    minOptions: number = 2
): QuestionOption[] => {
    if (options.length <= minOptions) return options;
    return options.filter((_, i) => i !== optionIndex);
};

// ═══════════════════════════════════════════════════════════════════════════
// PURE OPERATIONS - Verse Operations
// ═══════════════════════════════════════════════════════════════════════════

export const addVerseToList = (verses: PoetryVerse[]): PoetryVerse[] => 
    [...verses, createEmptyVerse()];

export const removeVerseFromList = (
    verses: PoetryVerse[],
    verseId: string,
    minCount: number = 1
): PoetryVerse[] => {
    if (verses.length <= minCount) return verses;
    return verses.filter(v => v.id !== verseId);
};

export const updateVerseInList = (
    verses: PoetryVerse[],
    verseId: string,
    field: 'firstHalf' | 'secondHalf',
    value: string
): PoetryVerse[] => verses.map(v => v.id === verseId ? { ...v, [field]: value } : v);

// ═══════════════════════════════════════════════════════════════════════════
// TEXT GETTERS
// ═══════════════════════════════════════════════════════════════════════════

export const getQuestionText = <T extends { textAr: string; textEn: string }>(
    question: T,
    lang: Lang
): string => lang === 'ar' ? (question.textAr || question.textEn) : (question.textEn || question.textAr);

export const getOptionText = (option: QuestionOption, lang: Lang): string =>
    lang === 'ar' ? (option.textAr || option.textEn) : (option.textEn || option.textAr);

export const getBilingualText = <T extends { ar?: string; en?: string }>(
    obj: T | undefined,
    lang: Lang
): string => {
    if (!obj) return '';
    return lang === 'ar' ? (obj.ar || obj.en || '') : (obj.en || obj.ar || '');
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const hasCorrectAnswer = (options: QuestionOption[]): boolean =>
    options.some(o => o.isCorrect);

export const isQuestionTextEmpty = (question: { textAr: string; textEn: string }): boolean =>
    !question.textAr.trim() && !question.textEn.trim();

export const isOptionEmpty = (option: QuestionOption): boolean =>
    !option.textAr.trim() && !option.textEn.trim();

export const hasEmptyOptions = (options: QuestionOption[]): boolean =>
    options.some(isOptionEmpty);

export const needsCorrectAnswer = (type: QuestionType): boolean =>
    type === 'mcq' || type === 'true_false';
