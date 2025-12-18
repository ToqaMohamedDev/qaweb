// =============================================
// خدمات بنك الأسئلة وأسئلة الدروس - Supabase
// Note: These services use tables that may need to be created via migration:
// - question_bank
// - lesson_questions  
// - question_stats
// =============================================

import { createClient } from '@/lib/supabase';
import type {
    QuestionBankItem,
    LessonQuestion,
    CreateQuestionBankInput,
    CreateLessonQuestionInput,
    QuestionBankFilter,
    LangText,
    AnswerOption,
    QuestionMedia
} from '@/lib/types/exam-templates';

// Helper to get untyped supabase client for tables not in schema
const getSupabase = () => createClient() as any;

// =============================================
// بنك الأسئلة
// =============================================

/**
 * إضافة سؤال لبنك الأسئلة
 */
export async function addQuestionToBank(
    input: CreateQuestionBankInput,
    createdBy: string
): Promise<{ data: QuestionBankItem | null; error: Error | null }> {
    const supabase = getSupabase();

    // Note: question_bank table may need to be created via migration
    const { data, error } = await (supabase as any)
        .from('question_bank')
        .insert({
            text: input.text,
            type: input.type,
            options: input.options || [],
            correct_option_id: input.correct_option_id,
            correct_answer: input.correct_answer,
            points: input.points || 1,
            difficulty: input.difficulty || 'medium',
            subject_id: input.subject_id || null,
            lesson_id: input.lesson_id || null,
            tags: input.tags || [],
            media: input.media || {},
            hint: input.hint || { ar: '', en: '' },
            explanation: input.explanation || { ar: '', en: '' },
            created_by: createdBy,
            is_active: true
        })
        .select()
        .single();

    return { data: data as unknown as QuestionBankItem, error: error ? new Error(error.message) : null };
}

/**
 * تحديث سؤال في بنك الأسئلة
 */
export async function updateQuestionInBank(
    questionId: string,
    updates: Partial<CreateQuestionBankInput>
): Promise<{ data: QuestionBankItem | null; error: Error | null }> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('question_bank')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .select()
        .single();

    return { data: data as unknown as QuestionBankItem, error: error ? new Error(error.message) : null };
}

/**
 * حذف سؤال من بنك الأسئلة
 */
export async function deleteQuestionFromBank(questionId: string): Promise<{ error: Error | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('question_bank')
        .delete()
        .eq('id', questionId);

    return { error: error ? new Error(error.message) : null };
}

/**
 * جلب أسئلة بنك الأسئلة
 */
export async function getQuestionsFromBank(
    filter: QuestionBankFilter = {}
): Promise<{ data: QuestionBankItem[]; count: number; error: Error | null }> {
    const supabase = getSupabase();

    let query = supabase
        .from('question_bank')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (filter.subject_id) query = query.eq('subject_id', filter.subject_id);
    if (filter.lesson_id) query = query.eq('lesson_id', filter.lesson_id);
    if (filter.difficulty) query = query.eq('difficulty', filter.difficulty);
    if (filter.type) query = query.eq('type', filter.type);
    if (filter.tags && filter.tags.length > 0) query = query.overlaps('tags', filter.tags);
    if (filter.limit) query = query.limit(filter.limit);
    if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);

    const { data, count, error } = await query;

    return {
        data: (data || []) as unknown as QuestionBankItem[],
        count: count || 0,
        error: error ? new Error(error.message) : null
    };
}

/**
 * جلب أسئلة عشوائية من بنك الأسئلة
 */
export async function getRandomQuestionsFromBank(options: {
    subjectId?: string;
    lessonId?: string;
    difficulty?: string;
    type?: string;
    count?: number;
}): Promise<{ data: QuestionBankItem[]; error: Error | null }> {
    const supabase = getSupabase();

    // استخدام RPC function
    const { data, error } = await supabase.rpc('get_random_questions', {
        p_subject_id: options.subjectId || null,
        p_lesson_id: options.lessonId || null,
        p_difficulty: options.difficulty || null,
        p_type: options.type || null,
        p_count: options.count || 10
    });

    return {
        data: (data || []) as unknown as QuestionBankItem[],
        error: error ? new Error(error.message) : null
    };
}

/**
 * نسخ أسئلة من بنك الأسئلة إلى قالب
 */
export async function copyQuestionsToTemplate(
    templateId: string,
    questionIds: string[]
): Promise<{ copiedCount: number; error: Error | null }> {
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc('copy_questions_to_template', {
        p_template_id: templateId,
        p_question_ids: questionIds
    });

    return {
        copiedCount: data || 0,
        error: error ? new Error(error.message) : null
    };
}

// =============================================
// أسئلة الدروس
// =============================================

/**
 * إضافة سؤال لدرس
 */
export async function addLessonQuestion(
    input: CreateLessonQuestionInput,
    createdBy?: string
): Promise<{ data: LessonQuestion | null; error: Error | null }> {
    const supabase = getSupabase();

    // حساب الترتيب إذا لم يُحدد
    let orderIndex = input.order_index;
    if (orderIndex === undefined) {
        const { count } = await supabase
            .from('lesson_questions')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', input.lesson_id);
        orderIndex = (count || 0) + 1;
    }

    const { data, error } = await supabase
        .from('lesson_questions')
        .insert({
            lesson_id: input.lesson_id,
            text: input.text,
            type: input.type,
            options: input.options || [],
            correct_option_id: input.correct_option_id,
            correct_answer: input.correct_answer,
            points: input.points || 1,
            difficulty: input.difficulty || 'medium',
            order_index: orderIndex,
            media: input.media || {},
            hint: input.hint || { ar: '', en: '' },
            explanation: input.explanation || { ar: '', en: '' },
            created_by: createdBy || null,
            is_active: true
        })
        .select()
        .single();

    return { data: data as unknown as LessonQuestion, error: error ? new Error(error.message) : null };
}

/**
 * تحديث سؤال درس
 */
export async function updateLessonQuestion(
    questionId: string,
    updates: Partial<CreateLessonQuestionInput>
): Promise<{ data: LessonQuestion | null; error: Error | null }> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('lesson_questions')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .select()
        .single();

    return { data: data as unknown as LessonQuestion, error: error ? new Error(error.message) : null };
}

/**
 * حذف سؤال درس
 */
export async function deleteLessonQuestion(questionId: string): Promise<{ error: Error | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('lesson_questions')
        .delete()
        .eq('id', questionId);

    return { error: error ? new Error(error.message) : null };
}

/**
 * جلب أسئلة درس معين
 */
export async function getLessonQuestions(
    lessonId: string
): Promise<{ data: LessonQuestion[]; error: Error | null }> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('lesson_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

    return {
        data: (data || []) as unknown as LessonQuestion[],
        error: error ? new Error(error.message) : null
    };
}

/**
 * إعادة ترتيب أسئلة الدرس
 */
export async function reorderLessonQuestions(
    lessonId: string,
    questionOrders: { id: string; order_index: number }[]
): Promise<{ error: Error | null }> {
    const supabase = getSupabase();

    for (const q of questionOrders) {
        const { error } = await supabase
            .from('lesson_questions')
            .update({ order_index: q.order_index })
            .eq('id', q.id)
            .eq('lesson_id', lessonId);

        if (error) return { error: new Error(error.message) };
    }

    return { error: null };
}

// =============================================
// إحصائيات الأسئلة
// =============================================

/**
 * تحديث إحصائيات سؤال بعد الإجابة عليه
 */
export async function updateQuestionStats(
    questionType: 'template' | 'bank' | 'lesson',
    questionId: string,
    isCorrect: boolean,
    timeSeconds: number
): Promise<{ error: Error | null }> {
    const supabase = getSupabase();

    const { error } = await supabase.rpc('update_question_statistics', {
        p_question_type: questionType,
        p_question_id: questionId,
        p_is_correct: isCorrect,
        p_time_seconds: timeSeconds
    });

    return { error: error ? new Error(error.message) : null };
}

/**
 * جلب إحصائيات سؤال
 */
export async function getQuestionStats(
    questionType: 'template' | 'bank' | 'lesson',
    questionId: string
): Promise<{ data: { timesAsked: number; timesCorrect: number; difficultyRating: number } | null; error: Error | null }> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('question_stats')
        .select('times_asked, times_correct, difficulty_rating')
        .eq('question_type', questionType)
        .eq('question_id', questionId)
        .single();

    if (error || !data) {
        return { data: null, error: error ? new Error(error.message) : null };
    }

    return {
        data: {
            timesAsked: data.times_asked,
            timesCorrect: data.times_correct,
            difficultyRating: data.difficulty_rating
        },
        error: null
    };
}

// =============================================
// وظائف مساعدة
// =============================================

/**
 * نسخ أسئلة من درس إلى قالب
 */
export async function copyLessonQuestionsToTemplate(
    lessonId: string,
    templateId: string
): Promise<{ copiedCount: number; error: Error | null }> {
    const supabase = getSupabase();

    // جلب أسئلة الدرس
    const { data: questions, error: fetchError } = await getLessonQuestions(lessonId);
    if (fetchError) return { copiedCount: 0, error: fetchError };

    // الحصول على آخر ترتيب
    const { count: existingCount } = await supabase
        .from('template_questions')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId);

    let orderIndex = existingCount || 0;
    let copiedCount = 0;

    for (const q of questions) {
        orderIndex++;
        const { error } = await supabase
            .from('template_questions')
            .insert({
                template_id: templateId,
                lesson_id: lessonId,
                text: q.text,
                type: q.type,
                options: q.options,
                correct_option_id: q.correct_option_id,
                correct_answer: q.correct_answer,
                points: q.points,
                difficulty: q.difficulty,
                order_index: orderIndex,
                media: q.media,
                hint: q.hint,
                explanation: q.explanation,
                is_active: true
            });

        if (!error) copiedCount++;
    }

    return { copiedCount, error: null };
}

/**
 * البحث في بنك الأسئلة
 */
export async function searchQuestionsInBank(
    searchText: string,
    options: QuestionBankFilter = {}
): Promise<{ data: QuestionBankItem[]; error: Error | null }> {
    const supabase = getSupabase();

    // بحث في النص العربي والإنجليزي
    let query = supabase
        .from('question_bank')
        .select('*')
        .eq('is_active', true)
        .or(`text->>ar.ilike.%${searchText}%,text->>en.ilike.%${searchText}%`)
        .order('created_at', { ascending: false });

    if (options.subject_id) query = query.eq('subject_id', options.subject_id);
    if (options.lesson_id) query = query.eq('lesson_id', options.lesson_id);
    if (options.difficulty) query = query.eq('difficulty', options.difficulty);
    if (options.type) query = query.eq('type', options.type);
    if (options.limit) query = query.limit(options.limit);

    const { data, error } = await query;

    return {
        data: (data || []) as unknown as QuestionBankItem[],
        error: error ? new Error(error.message) : null
    };
}

/**
 * جلب عدد الأسئلة حسب المادة
 */
export async function getQuestionCountBySubject(subjectId: string): Promise<{
    bankCount: number;
    lessonCount: number;
    error: Error | null;
}> {
    const supabase = getSupabase();

    const { count: bankCount, error: bankError } = await supabase
        .from('question_bank')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId)
        .eq('is_active', true);

    if (bankError) return { bankCount: 0, lessonCount: 0, error: new Error(bankError.message) };

    // جلب عدد أسئلة الدروس عبر join
    const { count: lessonCount, error: lessonError } = await supabase
        .from('lesson_questions')
        .select('*, lessons!inner(*)', { count: 'exact', head: true })
        .eq('lessons.subject_id', subjectId)
        .eq('is_active', true);

    return {
        bankCount: bankCount || 0,
        lessonCount: lessonCount || 0,
        error: lessonError ? new Error(lessonError.message) : null
    };
}
