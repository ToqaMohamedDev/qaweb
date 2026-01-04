/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                      QUESTION MAPPER - محول السؤال                       ║
 * ║                                                                          ║
 * ║  Data Layer - يحول بين بيانات قاعدة البيانات وكيانات الأعمال            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { Question, type QuestionTypeName } from '@/lib/domain/entities/Question';
import type { LangText, AnswerOption, QuestionMedia, DifficultyLevel } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. DATABASE ROW TYPE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نوع صف قاعدة البيانات للسؤال
 */
export interface QuestionDBRow {
    id: string;
    lesson_id?: string | null;
    stage_id?: string | null;
    subject_id?: string | null;
    group_id?: string | null;
    text: unknown; // Json
    type: string;
    options?: unknown; // Json
    correct_option_id?: string | null;
    correct_answer?: unknown; // Json
    points?: number | null;
    difficulty?: string | null;
    order_index?: number | null;
    media?: unknown; // Json
    hint?: unknown; // Json
    explanation?: unknown; // Json
    section_title?: unknown; // Json
    metadata?: unknown; // Json
    tags?: string[] | null;
    is_active?: boolean;
    created_by?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MAPPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحويل صف قاعدة البيانات إلى كيان سؤال
 */
export function mapDbRowToQuestion(row: QuestionDBRow): Question {
    return new Question(
        row.id,
        row.type as QuestionTypeName,
        parseText(row.text),
        parseOptions(row.options),
        row.correct_option_id || null,
        row.correct_answer,
        row.points || 1,
        (row.difficulty as DifficultyLevel) || 'medium',
        row.order_index || 0,
        parseMedia(row.media),
        parseText(row.hint),
        parseText(row.explanation),
        parseText(row.section_title),
        parseMetadata(row.metadata),
        row.lesson_id || undefined,
        row.stage_id || undefined,
        row.subject_id || undefined,
        row.group_id || undefined,
        row.tags || undefined,
        row.is_active ?? true,
        row.created_by || undefined,
        row.created_at ? new Date(row.created_at) : undefined,
        row.updated_at ? new Date(row.updated_at) : undefined,
    );
}

/**
 * تحويل كيان سؤال إلى صف قاعدة البيانات
 */
export function mapQuestionToDbRow(question: Question): Partial<QuestionDBRow> {
    return {
        id: question.id,
        lesson_id: question.lessonId || null,
        stage_id: question.stageId || null,
        subject_id: question.subjectId || null,
        group_id: question.groupId || null,
        text: question.text as unknown,
        type: question.type,
        options: question.options as unknown,
        correct_option_id: question.correctOptionId,
        correct_answer: question.correctAnswer,
        points: question.points,
        difficulty: question.difficulty,
        order_index: question.orderIndex,
        media: question.media as unknown,
        hint: question.hint as unknown,
        explanation: question.explanation as unknown,
        section_title: question.sectionTitle as unknown,
        metadata: question.metadata as unknown,
        tags: question.tags || null,
        is_active: question.isActive,
        created_by: question.createdBy || null,
    };
}

/**
 * تحويل عدة صفوف إلى كيانات
 */
export function mapDbRowsToQuestions(rows: QuestionDBRow[]): Question[] {
    return rows.map(mapDbRowToQuestion);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function parseText(text: unknown): LangText {
    if (!text) return { ar: '', en: '' };
    if (typeof text === 'string') {
        return { ar: text, en: text };
    }
    if (typeof text === 'object') {
        const obj = text as Record<string, string>;
        return {
            ar: obj.ar || obj.arabic || '',
            en: obj.en || obj.english || '',
        };
    }
    return { ar: '', en: '' };
}

function parseOptions(options: unknown): AnswerOption[] {
    if (!options) return [];
    if (Array.isArray(options)) {
        return options.map((opt, index) => ({
            id: opt.id || `opt-${index}`,
            text: parseText(opt.text || opt.label || opt),
            isCorrect: opt.isCorrect || opt.is_correct || false,
        }));
    }
    return [];
}

function parseMedia(media: unknown): QuestionMedia | undefined {
    if (!media) return undefined;
    if (typeof media === 'object') {
        return media as QuestionMedia;
    }
    return undefined;
}

function parseMetadata(metadata: unknown): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    if (typeof metadata === 'object') {
        return metadata as Record<string, unknown>;
    }
    return undefined;
}
