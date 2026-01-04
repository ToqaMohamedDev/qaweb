/**
 * Exam Service
 * 
 * Handles exams (الامتحانات الشاملة وامتحانات المعلمين)
 */

import { getSupabaseClient } from '../supabase-client';
import type {
    ComprehensiveExam,
    TeacherExam,
    ComprehensiveExamAttempt,
    TeacherExamAttempt,
    TablesInsert,
    TablesUpdate
} from '../database.types';

// ==========================================
// Types
// ==========================================

import type { ExamFilters } from '../types';

// ==========================================
// Comprehensive Exams (Admin)
// ==========================================

/**
 * Get comprehensive exams with optional filters
 */
export async function getComprehensiveExams(filters: ExamFilters = {}): Promise<ComprehensiveExam[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('comprehensive_exams')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.stageId) query = query.eq('stage_id', filters.stageId);
    if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
    if (filters.isPublished !== undefined) query = query.eq('is_published', filters.isPublished);
    if (filters.type) query = query.eq('type', filters.type);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/**
 * Get published comprehensive exams
 */
export async function getPublishedExams(): Promise<ComprehensiveExam[]> {
    return getComprehensiveExams({ isPublished: true });
}

/**
 * Get a comprehensive exam by ID
 */
export async function getComprehensiveExamById(id: string): Promise<ComprehensiveExam | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exams')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Create a comprehensive exam
 */
export async function createComprehensiveExam(
    exam: TablesInsert<'comprehensive_exams'>
): Promise<ComprehensiveExam> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exams')
        .insert(exam)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a comprehensive exam
 */
export async function updateComprehensiveExam(
    id: string,
    updates: TablesUpdate<'comprehensive_exams'>
): Promise<ComprehensiveExam> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exams')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a comprehensive exam
 */
export async function deleteComprehensiveExam(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('comprehensive_exams')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ==========================================
// Teacher Exams
// ==========================================

/**
 * Get teacher exams with optional filters
 */
export async function getTeacherExams(filters: ExamFilters = {}): Promise<TeacherExam[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('teacher_exams')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.stageId) query = query.eq('stage_id', filters.stageId);
    if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
    if (filters.isPublished !== undefined) query = query.eq('is_published', filters.isPublished);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/**
 * Get public teacher exams (published)
 */
export async function getPublishedTeacherExams(): Promise<TeacherExam[]> {
    return getTeacherExams({ isPublished: true });
}

/**
 * Get exams by teacher
 */
export async function getExamsByTeacher(teacherId: string): Promise<TeacherExam[]> {
    return getTeacherExams({ createdBy: teacherId });
}

/**
 * Get a teacher exam by ID
 */
export async function getTeacherExamById(id: string): Promise<TeacherExam | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_exams')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Create a teacher exam
 */
export async function createTeacherExam(exam: TablesInsert<'teacher_exams'>): Promise<TeacherExam> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_exams')
        .insert(exam)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a teacher exam
 */
export async function updateTeacherExam(
    id: string,
    updates: TablesUpdate<'teacher_exams'>
): Promise<TeacherExam> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_exams')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a teacher exam
 */
export async function deleteTeacherExam(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('teacher_exams')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ==========================================
// Exam Attempts
// ==========================================

/**
 * Start a comprehensive exam attempt
 */
export async function startComprehensiveExamAttempt(
    examId: string,
    studentId: string
): Promise<ComprehensiveExamAttempt> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exam_attempts')
        .insert({
            exam_id: examId,
            student_id: studentId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Complete a comprehensive exam attempt
 */
export async function completeComprehensiveExamAttempt(
    attemptId: string,
    answers: Record<string, unknown>,
    score: number,
    maxScore: number
): Promise<ComprehensiveExamAttempt> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exam_attempts')
        .update({
            answers: answers as any,
            total_score: score,
            max_score: maxScore,
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get attempts for a student
 */
export async function getStudentAttempts(studentId: string): Promise<ComprehensiveExamAttempt[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exam_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get attempt by ID
 */
export async function getAttemptById(attemptId: string): Promise<ComprehensiveExamAttempt | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

// ==========================================
// Exam Stats
// ==========================================

/**
 * Get exam statistics
 */
export async function getExamStats(examId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
}> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('comprehensive_exam_attempts')
        .select('total_score, max_score, status')
        .eq('exam_id', examId)
        .eq('status', 'completed');

    if (error) throw error;

    const attempts = data || [];
    const totalAttempts = attempts.length;

    if (totalAttempts === 0) {
        return { totalAttempts: 0, averageScore: 0, passRate: 0 };
    }

    const totalScore = attempts.reduce((sum, a) => sum + (a.total_score || 0), 0);
    const averageScore = totalScore / totalAttempts;

    // Assuming passing is 60%
    const passing = attempts.filter(a => {
        const percentage = ((a.total_score || 0) / (a.max_score || 1)) * 100;
        return percentage >= 60;
    }).length;

    const passRate = (passing / totalAttempts) * 100;

    return { totalAttempts, averageScore, passRate };
}
