/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         EXAM MAPPER - محول الامتحان                      ║
 * ║                                                                          ║
 * ║  Data Layer - يحول بين بيانات قاعدة البيانات وكيانات الأعمال            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { Exam, type ExamStatus } from '@/lib/domain/entities/Exam';
import type { ExamSettings, ExamBlock, ExamLanguage } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. DATABASE ROW TYPE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * نوع صف قاعدة البيانات للامتحان
 */
export interface ExamDBRow {
    id: string;
    title: string;
    description?: string | null;
    language: string;
    total_points: number;
    passing_score: number;
    blocks?: unknown; // Json
    settings?: unknown; // Json
    status: string;
    is_teacher_exam?: boolean;
    created_by?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    stage_id?: string | null;
    subject_id?: string | null;
    teacher_id?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MAPPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تحويل صف قاعدة البيانات إلى كيان امتحان
 */
export function mapDbRowToExam(row: ExamDBRow): Exam {
    const blocks = parseBlocks(row.blocks);
    const settings = parseSettings(row.settings);

    return new Exam(
        row.id,
        row.title,
        row.description || '',
        row.language as ExamLanguage,
        row.total_points,
        row.passing_score,
        blocks,
        settings,
        row.status as ExamStatus,
        row.is_teacher_exam || false,
        row.created_by || '',
        row.created_at ? new Date(row.created_at) : new Date(),
        row.updated_at ? new Date(row.updated_at) : new Date(),
        row.stage_id || undefined,
        row.subject_id || undefined,
        row.teacher_id || undefined,
    );
}

/**
 * تحويل كيان امتحان إلى صف قاعدة البيانات
 */
export function mapExamToDbRow(exam: Exam): Partial<ExamDBRow> {
    return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        language: exam.language,
        total_points: exam.totalPoints,
        passing_score: exam.passingScore,
        blocks: exam.blocks as unknown,
        settings: exam.settings as unknown,
        status: exam.status,
        is_teacher_exam: exam.isTeacherExam,
        created_by: exam.createdBy,
        stage_id: exam.stageId || null,
        subject_id: exam.subjectId || null,
        teacher_id: exam.teacherId || null,
    };
}

/**
 * تحويل عدة صفوف إلى كيانات
 */
export function mapDbRowsToExams(rows: ExamDBRow[]): Exam[] {
    return rows.map(mapDbRowToExam);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function parseBlocks(blocks: unknown): ExamBlock[] {
    if (!blocks) return [];
    if (Array.isArray(blocks)) return blocks as ExamBlock[];
    if (typeof blocks === 'string') {
        try {
            return JSON.parse(blocks) as ExamBlock[];
        } catch {
            return [];
        }
    }
    return [];
}

function parseSettings(settings: unknown): ExamSettings {
    const defaults: ExamSettings = {
        shuffleQuestions: false,
        shuffleOptions: false,
        allowBack: true,
        passScore: 60,
        showResults: true,
        showCorrectAnswers: true,
    };

    if (!settings) return defaults;

    if (typeof settings === 'object') {
        return { ...defaults, ...(settings as Partial<ExamSettings>) };
    }

    if (typeof settings === 'string') {
        try {
            return { ...defaults, ...JSON.parse(settings) };
        } catch {
            return defaults;
        }
    }

    return defaults;
}
