// =============================================
// Exam Store - إدارة حالة الامتحانات
// =============================================

import { create } from 'zustand';
import { createClient } from '@/lib/supabase';
import type { ComprehensiveExam, ExamAttempt, StudentAnswer } from '@/lib/types';

// Helper type for blocks array
interface ExamBlockWithQuestions {
    questions?: { id: string; points?: number; correctOptionId?: string }[];
}

// Helper to get blocks as array
const getBlocks = (exam: ComprehensiveExam | null): ExamBlockWithQuestions[] => {
    if (!exam?.blocks) return [];
    if (Array.isArray(exam.blocks)) return exam.blocks as ExamBlockWithQuestions[];
    return [];
};

interface ExamState {
    // ─── Current Exam ───
    currentExam: ComprehensiveExam | null;
    currentAttempt: ExamAttempt | null;
    isLoading: boolean;
    error: string | null;

    // ─── Exam List ───
    exams: ComprehensiveExam[];
    totalExams: number;

    // ─── Player State ───
    currentQuestionIndex: number;
    answers: Record<string, StudentAnswer>;
    timeRemaining: number;
    isSubmitting: boolean;

    // ─── Actions ───
    setCurrentExam: (exam: ComprehensiveExam | null) => void;
    setCurrentAttempt: (attempt: ExamAttempt | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // ─── Exam Operations ───
    fetchExam: (examId: string) => Promise<void>;
    fetchExams: (filters?: { stage_id?: string; subject_id?: string }) => Promise<void>;

    // ─── Player Operations ───
    setCurrentQuestion: (index: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    setAnswer: (questionId: string, answer: StudentAnswer) => void;
    setTimeRemaining: (time: number) => void;

    // ─── Attempt Operations ───
    startAttempt: (examId: string, studentId: string) => Promise<string | null>;
    submitAttempt: () => Promise<boolean>;

    // ─── Reset ───
    resetPlayer: () => void;
    reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialPlayerState = {
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 0,
    isSubmitting: false,
};

const initialState = {
    currentExam: null,
    currentAttempt: null,
    isLoading: false,
    error: null,
    exams: [],
    totalExams: 0,
    ...initialPlayerState,
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useExamStore = create<ExamState>()((set, get) => ({
    // الحالة الابتدائية
    ...initialState,

    // ─── Setters ───
    setCurrentExam: (currentExam) => set({ currentExam }),
    setCurrentAttempt: (currentAttempt) => set({ currentAttempt }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // ─── Fetch Single Exam ───
    fetchExam: async (examId) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase
                .from('comprehensive_exams')
                .select('*')
                .eq('id', examId)
                .single();

            if (error) throw error;

            set({
                currentExam: data as ComprehensiveExam,
                isLoading: false,
                timeRemaining: (data.duration_minutes || 60) * 60,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'فشل تحميل الامتحان',
                isLoading: false
            });
        }
    },

    // ─── Fetch Exams List ───
    fetchExams: async (filters) => {
        const supabase = createClient();
        set({ isLoading: true, error: null });

        try {
            let query = supabase
                .from('comprehensive_exams')
                .select('*', { count: 'exact' })
                .eq('is_published', true);

            if (filters?.stage_id) {
                query = query.eq('stage_id', filters.stage_id);
            }
            if (filters?.subject_id) {
                query = query.eq('subject_id', filters.subject_id);
            }

            const { data, error, count } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            set({
                exams: (data || []) as ComprehensiveExam[],
                totalExams: count || 0,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'فشل تحميل الامتحانات',
                isLoading: false
            });
        }
    },

    // ─── Player Navigation ───
    setCurrentQuestion: (currentQuestionIndex) => set({ currentQuestionIndex }),

    nextQuestion: () => {
        const { currentQuestionIndex, currentExam } = get();
        const blocks = getBlocks(currentExam);
        const totalQuestions = blocks.reduce(
            (sum: number, block) => sum + (block.questions?.length || 0),
            0
        );

        if (currentQuestionIndex < totalQuestions - 1) {
            set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
    },

    prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
            set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
    },

    setAnswer: (questionId, answer) => {
        set((state) => ({
            answers: { ...state.answers, [questionId]: answer }
        }));
    },

    setTimeRemaining: (timeRemaining) => set({ timeRemaining }),

    // ─── Start Attempt ───
    startAttempt: async (examId, studentId) => {
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from('comprehensive_exam_attempts')
                .insert({
                    exam_id: examId,
                    student_id: studentId,
                    status: 'in_progress',
                    started_at: new Date().toISOString(),
                    answers: {},
                    score: 0,
                    total_points: 0,
                    percentage: 0,
                    time_spent_seconds: 0,
                })
                .select()
                .single();

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            set({ currentAttempt: data as any });
            return data.id;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'فشل بدء المحاولة' });
            return null;
        }
    },

    // ─── Submit Attempt ───
    submitAttempt: async () => {
        const supabase = createClient();
        const { currentAttempt, answers, currentExam, timeRemaining } = get();

        if (!currentAttempt || !currentExam) return false;

        set({ isSubmitting: true });

        try {
            // حساب النتيجة
            let totalScore = 0;
            let totalPoints = 0;

            const blocks = getBlocks(currentExam);
            blocks.forEach((block) => {
                block.questions?.forEach((question) => {
                    totalPoints += question.points || 1;
                    const answer = answers[question.id];

                    if (answer?.selectedOptionId === question.correctOptionId) {
                        totalScore += question.points || 1;
                    }
                });
            });

            const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
            const timeSpent = (currentExam.duration_minutes || 60) * 60 - timeRemaining;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('comprehensive_exam_attempts')
                .update({
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    answers: answers as any,
                    score: totalScore,
                    total_points: totalPoints,
                    percentage,
                    time_spent_seconds: timeSpent,
                    questions_answered: Object.keys(answers).length,
                })
                .eq('id', currentAttempt.id);

            if (error) throw error;

            set({ isSubmitting: false });
            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'فشل تسليم الامتحان',
                isSubmitting: false
            });
            return false;
        }
    },

    // ─── Reset ───
    resetPlayer: () => set(initialPlayerState),
    reset: () => set(initialState),
}));

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

export const selectCurrentExam = (state: ExamState) => state.currentExam;
export const selectCurrentQuestion = (state: ExamState) => state.currentQuestionIndex;
export const selectAnswers = (state: ExamState) => state.answers;
export const selectTimeRemaining = (state: ExamState) => state.timeRemaining;
export const selectProgress = (state: ExamState) => {
    const blocks = getBlocks(state.currentExam);
    const totalQuestions = blocks.reduce(
        (sum: number, block) => sum + (block.questions?.length || 0),
        0
    );
    const answered = Object.keys(state.answers).length;
    return { answered, total: totalQuestions, percentage: totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0 };
};
