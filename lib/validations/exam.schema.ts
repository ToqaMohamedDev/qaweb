/**
 * Exam Validation Schemas
 * 
 * Zod schemas for validating exam data structures
 * Used to ensure data consistency before saving to database
 */

import { z } from 'zod';

// =============================================
// Base Types
// =============================================

/** Localized text schema */
export const LangTextSchema = z.object({
    ar: z.string().optional(),
    en: z.string().optional(),
});

/** Question option schema - supports multiple formats */
export const QuestionOptionSchema = z.object({
    id: z.string().optional(),
    text: z.string().optional(),
    textAr: z.string().optional(),
    textEn: z.string().optional(),
    isCorrect: z.boolean().optional(),
});

/** Poetry verse schema */
export const PoetryVerseSchema = z.object({
    firstHalf: z.string(),
    secondHalf: z.string(),
});

// =============================================
// Question Schema
// =============================================

export const QuestionTypeSchema = z.enum([
    'mcq',
    'true_false',
    'essay',
    'fill_blank',
    'matching',
    'ordering',
    'parsing',
    'extraction',
    'short_answer',
]);

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const ExamQuestionSchema = z.object({
    id: z.string(),
    type: z.string(), // Allow any string for flexibility, validate in UI
    textAr: z.string().optional(),
    textEn: z.string().optional(),
    text: z.string().optional(),
    options: z.array(QuestionOptionSchema).optional(),
    correctOptionId: z.string().optional(),
    correctAnswer: z.union([z.string(), z.number(), LangTextSchema]).optional(),
    correctAnswerAr: z.string().optional(),
    correctAnswerEn: z.string().optional(),
    points: z.number().min(0).optional(),
    difficulty: z.string().optional(),
    explanation: z.string().optional(),
    explanationAr: z.string().optional(),
    explanationEn: z.string().optional(),
    underlinedWord: z.string().optional(),
    blankTextAr: z.string().optional(),
    blankTextEn: z.string().optional(),
    extractionTarget: z.string().optional(),
});

// =============================================
// Subsection Schema
// =============================================

export const ExamSubsectionSchema = z.object({
    id: z.string(),
    titleAr: z.string().optional(),
    titleEn: z.string().optional(),
    title: z.string().optional(),
    type: z.string().optional(),
    questions: z.array(ExamQuestionSchema).optional(),
});

// =============================================
// Block/Section Schema
// =============================================

export const ContentTypeSchema = z.enum(['none', 'reading', 'poetry']);

export const ExamBlockSchema = z.object({
    id: z.string(),
    titleAr: z.string().optional(),
    titleEn: z.string().optional(),
    title: z.string().optional(),
    type: z.string().optional(),
    contentType: ContentTypeSchema.optional(),
    // Direct questions (for comprehensive exams)
    questions: z.array(ExamQuestionSchema).optional(),
    // Subsections (for teacher exams)
    subsections: z.array(ExamSubsectionSchema).optional(),
    // Reading passage
    readingTitle: z.string().optional(),
    readingText: z.string().optional(),
    bodyText: z.string().optional(),
    genre: z.string().optional(),
    // Poetry
    poetryTitle: z.string().optional(),
    poetryVerses: z.array(PoetryVerseSchema).optional(),
    verses: z.array(z.string()).optional(),
    poet: z.string().optional(),
    poemTitle: z.string().optional(),
});

// =============================================
// Full Exam Schema
// =============================================

export const ComprehensiveExamPayloadSchema = z.object({
    type: z.string(),
    language: z.string(),
    exam_title: z.string().min(1, 'عنوان الامتحان مطلوب'),
    exam_description: z.string().optional(),
    stage_id: z.string().uuid().nullable().optional(),
    subject_id: z.string().uuid().nullable().optional(),
    semester: z.enum(['first', 'second', 'full_year']).nullable().optional(),
    duration_minutes: z.number().min(1).optional(),
    total_marks: z.number().min(0).optional(),
    usage_scope: z.string().optional(),
    grading_mode: z.string().optional(),
    branch_tags: z.array(z.string()).optional(),
    blocks: z.array(ExamBlockSchema),
    is_published: z.boolean().optional(),
    created_by: z.string().uuid().optional(),
});

export const TeacherExamPayloadSchema = z.object({
    type: z.string(),
    language: z.string(),
    exam_title: z.string().min(1, 'عنوان الامتحان مطلوب'),
    exam_description: z.string().optional(),
    stage_id: z.string().uuid().nullable().optional(),
    subject_id: z.string().uuid().nullable().optional(),
    duration_minutes: z.number().min(1).optional(),
    total_marks: z.number().min(0).optional(),
    blocks: z.array(ExamBlockSchema),
    sections: z.array(ExamBlockSchema).optional(),
    is_published: z.boolean().optional(),
    created_by: z.string().uuid(),
    is_time_limited: z.boolean().optional(),
    available_from: z.string().nullable().optional(),
    available_until: z.string().nullable().optional(),
});

// =============================================
// Validation Functions
// =============================================

/**
 * Validate comprehensive exam payload
 */
export function validateComprehensiveExam(data: unknown) {
    return ComprehensiveExamPayloadSchema.safeParse(data);
}

/**
 * Validate teacher exam payload
 */
export function validateTeacherExam(data: unknown) {
    return TeacherExamPayloadSchema.safeParse(data);
}

/**
 * Validate exam blocks array
 */
export function validateExamBlocks(blocks: unknown) {
    return z.array(ExamBlockSchema).safeParse(blocks);
}

/**
 * Get validation errors as formatted string
 */
export function formatValidationErrors(result: { success: false; error: z.ZodError }): string {
    return result.error.issues
        .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
}

// =============================================
// Type Exports
// =============================================

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type ExamSubsection = z.infer<typeof ExamSubsectionSchema>;
export type ExamBlock = z.infer<typeof ExamBlockSchema>;
export type ComprehensiveExamPayload = z.infer<typeof ComprehensiveExamPayloadSchema>;
export type TeacherExamPayload = z.infer<typeof TeacherExamPayloadSchema>;
