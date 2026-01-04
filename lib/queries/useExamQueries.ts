/**
 * Exam Queries - Hooks for exam-related data fetching
 * Used for student exam attempts and results
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

// ==========================================
// Types
// ==========================================

interface ExamBlock {
    title: string;
    questions: ExamQuestion[];
}

interface ExamQuestion {
    id: string;
    stem: string;
    type: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer';
    options: string[];
    correctIndex?: number;
    correctAnswer?: string;
    points: number;
    underlinedWord?: string;
    explanation?: string;
}

interface StudentExam {
    id: string;
    examTitle: string;
    examDescription?: string;
    durationMinutes: number;
    blocks: ExamBlock[];
    totalMarks: number;
    passingScore: number;
}

interface ExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    status: string | null;
    answers: Record<string, any>;
    total_score: number | null;
    max_score: number | null;
    started_at: string | null;
    completed_at?: string | null;
}

// ==========================================
// Transform Functions
// ==========================================

function transformExamToStudentFormat(exam: any): StudentExam | null {
    if (!exam) return null;

    // Extract questions from sections/blocks
    const blocks: ExamBlock[] = [];

    if (exam.sections) {
        const sections = Array.isArray(exam.sections) ? exam.sections : [];
        sections.forEach((section: any) => {
            const questions = (section.questions || []).map((q: any) => ({
                id: q.id || crypto.randomUUID(),
                stem: q.text?.ar || q.text?.en || q.text || '',
                type: q.type || 'mcq',
                options: (q.options || []).map((opt: any) => opt.text?.ar || opt.text?.en || opt.text || opt),
                correctIndex: q.correct_option_id ?
                    (q.options || []).findIndex((opt: any) => opt.id === q.correct_option_id) :
                    (typeof q.correct_answer === 'number' ? q.correct_answer : undefined),
                correctAnswer: typeof q.correct_answer === 'string' ? q.correct_answer :
                    (q.correct_option_id ? (q.options || []).find((opt: any) => opt.id === q.correct_option_id)?.text?.ar : undefined),
                points: q.points || 1,
                underlinedWord: q.underlined_word,
                explanation: q.explanation?.ar || q.explanation?.en || q.explanation,
            }));
            blocks.push({
                title: section.title?.ar || section.title?.en || section.title || 'قسم',
                questions,
            });
        });
    }

    if (exam.blocks) {
        const examBlocks = Array.isArray(exam.blocks) ? exam.blocks : [];
        examBlocks.forEach((block: any) => {
            const questions = (block.questions || []).map((q: any) => ({
                id: q.id || crypto.randomUUID(),
                stem: q.text?.ar || q.text?.en || q.text || q.stem || '',
                type: q.type || 'mcq',
                options: (q.options || []).map((opt: any) => opt.text?.ar || opt.text?.en || opt.text || opt),
                correctIndex: q.correctIndex ?? q.correct_index ??
                    (q.correct_option_id ? (q.options || []).findIndex((opt: any) => opt.id === q.correct_option_id) : undefined),
                correctAnswer: q.correctAnswer || q.correct_answer,
                points: q.points || 1,
                underlinedWord: q.underlinedWord || q.underlined_word,
                explanation: q.explanation?.ar || q.explanation?.en || q.explanation,
            }));
            blocks.push({
                title: block.title?.ar || block.title?.en || block.title || 'قسم',
                questions,
            });
        });
    }

    return {
        id: exam.id,
        examTitle: exam.exam_title,
        examDescription: exam.exam_description,
        durationMinutes: exam.duration_minutes || 60,
        blocks,
        totalMarks: exam.total_marks || blocks.reduce((sum, b) => sum + b.questions.reduce((qs, q) => qs + q.points, 0), 0),
        passingScore: exam.passing_score || 50,
    };
}

// ==========================================
// Hooks
// ==========================================

/**
 * Hook to fetch exam data for a student
 */
export function useStudentExam(examId: string | null | undefined) {
    const [data, setData] = useState<StudentExam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!examId) {
            setIsLoading(false);
            return;
        }

        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            // Try comprehensive_exams first
            const { data: comprehensiveExam, error: compError } = await supabase
                .from('comprehensive_exams')
                .select('*')
                .eq('id', examId)
                .single();

            if (comprehensiveExam) {
                setData(transformExamToStudentFormat(comprehensiveExam));
                return;
            }

            // Try teacher_exams
            const { data: teacherExam, error: teacherError } = await supabase
                .from('teacher_exams')
                .select('*')
                .eq('id', examId)
                .single();

            if (teacherExam) {
                setData(transformExamToStudentFormat(teacherExam));
                return;
            }

            if (compError && teacherError) {
                throw new Error('Exam not found');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching exam');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

/**
 * Hook to fetch exam attempt by ID
 */
export function useExamAttempt(attemptId: string | null | undefined) {
    const [data, setData] = useState<ExamAttempt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!attemptId) {
            setIsLoading(false);
            return;
        }

        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            // Try comprehensive_exam_attempts first
            const { data: compAttempt, error: compError } = await supabase
                .from('comprehensive_exam_attempts')
                .select('*')
                .eq('id', attemptId)
                .single();

            if (compAttempt) {
                setData(compAttempt as ExamAttempt);
                return;
            }

            // Try teacher_exam_attempts
            const { data: teacherAttempt, error: teacherError } = await supabase
                .from('teacher_exam_attempts')
                .select('*')
                .eq('id', attemptId)
                .single();

            if (teacherAttempt) {
                setData(teacherAttempt as ExamAttempt);
                return;
            }

            if (compError && teacherError) {
                throw new Error('Attempt not found');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error fetching attempt');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [attemptId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}

/**
 * Hook to create or update an exam attempt
 */
export function useUpdateExamAttempt() {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (input: {
        attemptId?: string;
        examId: string;
        studentId: string;
        answers?: Record<string, any>;
        status?: string;
        totalScore?: number;
        maxScore?: number;
    }) => {
        const supabase = createClient();
        setIsPending(true);
        setError(null);

        try {
            if (input.attemptId) {
                // Update existing attempt
                const { data, error: err } = await supabase
                    .from('comprehensive_exam_attempts')
                    .update({
                        answers: input.answers,
                        status: input.status,
                        total_score: input.totalScore,
                        max_score: input.maxScore,
                        completed_at: input.status === 'completed' ? new Date().toISOString() : undefined,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', input.attemptId)
                    .select()
                    .single();

                if (err) throw err;
                return data;
            } else {
                // Create new attempt
                const { data, error: err } = await supabase
                    .from('comprehensive_exam_attempts')
                    .insert({
                        exam_id: input.examId,
                        student_id: input.studentId,
                        answers: input.answers || {},
                        status: input.status || 'in_progress',
                        started_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (err) throw err;
                return data;
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error updating attempt';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsPending(false);
        }
    };

    return { mutateAsync, isPending, error };
}
