// =============================================
// خدمات قوالب الامتحانات - Supabase
// =============================================

import { createClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import type {
    ExamTemplate,
    ExamTemplateWithQuestions,
    ExamTemplateSummary,
    TemplateQuestion,
    ExamAttempt,
    CreateExamTemplateInput,
    CreateQuestionInput,
    StudentAnswer,
    QuestionResult,
    LangText
} from '@/lib/types/exam-templates';

// Type alias for template_questions insert
type TemplateQuestionInsert = Database['public']['Tables']['template_questions']['Insert'];

// =============================================
// قوالب الامتحانات
// =============================================

/**
 * إنشاء قالب امتحان جديد
 */
export async function createExamTemplate(
    input: CreateExamTemplateInput,
    createdBy: string
): Promise<{ data: ExamTemplate | null; error: Error | null }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('exam_templates')
        .insert({
            title: input.title,
            description: input.description || { ar: '', en: '' },
            language: input.language,
            subject_id: input.subject_id,
            subject_name: input.subject_name,
            grade: input.grade,
            duration_minutes: input.duration_minutes,
            settings: {
                shuffleQuestions: false,
                shuffleOptions: false,
                allowBack: true,
                passScore: 60,
                showResults: true,
                showCorrectAnswers: true,
                ...input.settings
            },
            created_by: createdBy,
            is_published: false
        })
        .select()
        .single();

    return { data: data as ExamTemplate | null, error: error ? new Error(error.message) : null };
}

/**
 * تحديث قالب امتحان
 */
export async function updateExamTemplate(
    templateId: string,
    updates: Partial<CreateExamTemplateInput & { is_published: boolean }>
): Promise<{ data: ExamTemplate | null; error: Error | null }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('exam_templates')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

    return { data: data as ExamTemplate | null, error: error ? new Error(error.message) : null };
}

/**
 * حذف قالب امتحان
 */
export async function deleteExamTemplate(templateId: string): Promise<{ error: Error | null }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('exam_templates')
        .delete()
        .eq('id', templateId);

    return { error: error ? new Error(error.message) : null };
}

/**
 * جلب قالب امتحان بالـ ID
 */
export async function getExamTemplate(templateId: string): Promise<{ data: ExamTemplate | null; error: Error | null }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('exam_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    return { data: data as ExamTemplate | null, error: error ? new Error(error.message) : null };
}

/**
 * جلب قالب مع أسئلته
 */
export async function getExamTemplateWithQuestions(
    templateId: string
): Promise<{ data: ExamTemplateWithQuestions | null; error: Error | null }> {
    const supabase = createClient();

    // جلب القالب
    const { data: template, error: templateError } = await supabase
        .from('exam_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (templateError) {
        return { data: null, error: new Error(templateError.message) };
    }

    // جلب الأسئلة مرتبة
    const { data: questions, error: questionsError } = await supabase
        .from('template_questions')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index', { ascending: true });

    if (questionsError) {
        return { data: null, error: new Error(questionsError.message) };
    }

    return {
        data: {
            ...template,
            questions: questions || []
        } as unknown as ExamTemplateWithQuestions,
        error: null
    };
}

/**
 * جلب قوالب الامتحانات المنشورة
 */
export async function getPublishedTemplates(options?: {
    subjectId?: string;
    stageId?: string;
    language?: string;
    limit?: number;
    offset?: number;
}): Promise<{ data: ExamTemplateSummary[]; count: number; error: Error | null }> {
    const supabase = createClient();

    let query = supabase
        .from('exam_templates')
        .select(`
            id, title, subject_name, grade, duration_minutes,
            questions_count, attempts_count, average_score, is_published, created_at,
            profiles!exam_templates_created_by_fkey (id, name, avatar_url)
        `, { count: 'exact' })
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (options?.subjectId) query = query.eq('subject_id', options.subjectId);
    if (options?.stageId) query = query.eq('stage_id', options.stageId);
    if (options?.language) query = query.eq('language', options.language);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, count, error } = await query;

    return {
        data: (data || []).map(t => ({
            id: t.id,
            title: t.title as LangText,
            subject_name: t.subject_name,
            grade: t.grade,
            duration_minutes: t.duration_minutes,
            questions_count: t.questions_count,
            attempts_count: t.attempts_count,
            average_score: t.average_score,
            is_published: t.is_published,
            created_at: t.created_at,
            created_by: t.profiles as { id: string; name: string; avatar_url: string | null }
        })),
        count: count || 0,
        error: error ? new Error(error.message) : null
    };
}

/**
 * جلب قوالب المعلم
 */
export async function getTeacherTemplates(
    teacherId: string,
    includeUnpublished = true
): Promise<{ data: ExamTemplate[]; error: Error | null }> {
    const supabase = createClient();

    let query = supabase
        .from('exam_templates')
        .select('*')
        .eq('created_by', teacherId)
        .order('updated_at', { ascending: false });

    if (!includeUnpublished) {
        query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    return { data: (data || []) as unknown as ExamTemplate[], error: error ? new Error(error.message) : null };
}

// =============================================
// أسئلة القوالب
// =============================================

/**
 * إضافة سؤال لقالب
 */
export async function addQuestion(
    templateId: string,
    input: CreateQuestionInput
): Promise<{ data: TemplateQuestion | null; error: Error | null }> {
    const supabase = createClient();

    // حساب الترتيب إذا لم يُحدد
    let orderIndex = input.order_index;
    if (orderIndex === undefined) {
        const { count } = await supabase
            .from('template_questions')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', templateId);
        orderIndex = (count || 0) + 1;
    }

    const questionData = {
        template_id: templateId,
        text: input.text,
        type: input.type,
        options: input.options || [],
        correct_option_id: input.correct_option_id,
        correct_answer: input.correct_answer,
        points: input.points || 1,
        order_index: orderIndex,
        media: input.media || {},
        hint: input.hint || { ar: '', en: '' },
        explanation: input.explanation || { ar: '', en: '' }
    };

    const { data, error } = await supabase
        .from('template_questions')
        .insert(questionData as unknown as TemplateQuestionInsert)
        .select()
        .single();

    return { data: data as TemplateQuestion | null, error: error ? new Error(error.message) : null };
}

/**
 * تحديث سؤال
 */
export async function updateQuestion(
    questionId: string,
    updates: Partial<CreateQuestionInput>
): Promise<{ data: TemplateQuestion | null; error: Error | null }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('template_questions')
        .update({
            ...updates as unknown as Database['public']['Tables']['template_questions']['Update'],
            updated_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .select()
        .single();

    return { data: data as TemplateQuestion | null, error: error ? new Error(error.message) : null };
}

/**
 * حذف سؤال
 */
export async function deleteQuestion(questionId: string): Promise<{ error: Error | null }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('template_questions')
        .delete()
        .eq('id', questionId);

    return { error: error ? new Error(error.message) : null };
}

/**
 * إعادة ترتيب الأسئلة
 */
export async function reorderQuestions(
    templateId: string,
    questionOrders: { id: string; order_index: number }[]
): Promise<{ error: Error | null }> {
    const supabase = createClient();

    // تحديث كل سؤال
    for (const q of questionOrders) {
        const { error } = await supabase
            .from('template_questions')
            .update({ order_index: q.order_index })
            .eq('id', q.id)
            .eq('template_id', templateId);

        if (error) return { error: new Error(error.message) };
    }

    return { error: null };
}

// =============================================
// محاولات الامتحانات
// =============================================

/**
 * بدء محاولة امتحان
 */
export async function startExamAttempt(
    templateId: string,
    studentId: string
): Promise<{ data: ExamAttempt | null; error: Error | null }> {
    const supabase = createClient();

    // جلب معلومات القالب
    const { data: template, error: templateError } = await supabase
        .from('exam_templates')
        .select('duration_minutes, total_points, is_published')
        .eq('id', templateId)
        .single();

    if (templateError || !template) {
        return { data: null, error: new Error('القالب غير موجود') };
    }

    if (!template.is_published) {
        return { data: null, error: new Error('الامتحان غير منشور') };
    }

    // حساب وقت الانتهاء
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + template.duration_minutes);

    const { data, error } = await supabase
        .from('exam_attempts')
        .insert({
            template_id: templateId,
            student_id: studentId,
            status: 'in_progress',
            total_points: template.total_points,
            expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

    return { data: data as ExamAttempt | null, error: error ? new Error(error.message) : null };
}

/**
 * حفظ إجابة (أثناء الامتحان)
 */
export async function saveAnswer(
    attemptId: string,
    questionId: string,
    answer: StudentAnswer
): Promise<{ error: Error | null }> {
    const supabase = createClient();

    // جلب الإجابات الحالية
    const { data: attempt, error: fetchError } = await supabase
        .from('exam_attempts')
        .select('answers, questions_answered')
        .eq('id', attemptId)
        .eq('status', 'in_progress')
        .single();

    if (fetchError || !attempt) {
        return { error: new Error('المحاولة غير موجودة أو منتهية') };
    }

    const answers = (attempt.answers as unknown as Record<string, StudentAnswer>) || {};
    const isNewAnswer = !answers[questionId];
    answers[questionId] = { ...answer, answeredAt: new Date().toISOString() };

    const { error } = await supabase
        .from('exam_attempts')
        .update({
            answers: answers as unknown as Database['public']['Tables']['exam_attempts']['Update']['answers'],
            questions_answered: isNewAnswer ? (attempt.questions_answered + 1) : attempt.questions_answered
        })
        .eq('id', attemptId);

    return { error: error ? new Error(error.message) : null };
}

/**
 * تسليم الامتحان وحساب الدرجات
 */
export async function submitExamAttempt(
    attemptId: string
): Promise<{ data: ExamAttempt | null; error: Error | null }> {
    const supabase = createClient();

    // جلب المحاولة
    const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('*, exam_templates(*)')
        .eq('id', attemptId)
        .single();

    if (attemptError || !attempt) {
        return { data: null, error: new Error('المحاولة غير موجودة') };
    }

    if (attempt.status !== 'in_progress') {
        return { data: null, error: new Error('تم تسليم هذا الامتحان مسبقاً') };
    }

    // جلب الأسئلة
    const { data: questions, error: questionsError } = await supabase
        .from('template_questions')
        .select('*')
        .eq('template_id', attempt.template_id);

    if (questionsError) {
        return { data: null, error: new Error('خطأ في جلب الأسئلة') };
    }

    // حساب الدرجات
    const answers = (attempt.answers as unknown as Record<string, StudentAnswer>) || {};
    const questionResults: QuestionResult[] = [];
    let totalScore = 0;

    for (const question of questions || []) {
        const studentAnswer = answers[question.id];
        let correct = false;
        let pointsEarned = 0;

        if (studentAnswer) {
            if (question.type === 'mcq' || question.type === 'truefalse') {
                correct = studentAnswer.selectedOptionId === question.correct_option_id;
            }
            // يمكن إضافة منطق للأنواع الأخرى هنا

            if (correct) {
                pointsEarned = question.points;
                totalScore += pointsEarned;
            }
        }

        questionResults.push({
            questionId: question.id,
            correct,
            pointsEarned,
            studentAnswer: studentAnswer || { answeredAt: '' }
        });
    }

    // حساب النسبة والنجاح
    const totalPoints = attempt.exam_templates.total_points || 1;
    const percentage = (totalScore / totalPoints) * 100;
    const settings = attempt.exam_templates.settings as { passScore?: number } | null;
    const passScore = settings?.passScore || 60;
    const passed = percentage >= passScore;

    // حساب الوقت المستغرق
    const startedAt = new Date(attempt.started_at);
    const submittedAt = new Date();
    const timeSpentSeconds = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000);

    // تحديث المحاولة
    const { data, error } = await supabase
        .from('exam_attempts')
        .update({
            status: 'graded',
            submitted_at: submittedAt.toISOString(),
            graded_at: submittedAt.toISOString(),
            score: totalScore,
            percentage: Math.round(percentage * 100) / 100,
            passed,
            time_spent_seconds: timeSpentSeconds,
            question_results: questionResults as unknown as Database['public']['Tables']['exam_attempts']['Update']['question_results']
        })
        .eq('id', attemptId)
        .select()
        .single();

    return { data: data as ExamAttempt | null, error: error ? new Error(error.message) : null };
}

/**
 * جلب محاولات الطالب
 */
export async function getStudentAttempts(
    studentId: string,
    templateId?: string
): Promise<{ data: ExamAttempt[]; error: Error | null }> {
    const supabase = createClient();

    let query = supabase
        .from('exam_attempts')
        .select('*, exam_templates(title, subject_name)')
        .eq('student_id', studentId)
        .order('started_at', { ascending: false });

    if (templateId) {
        query = query.eq('template_id', templateId);
    }

    const { data, error } = await query;

    return { data: (data || []) as unknown as ExamAttempt[], error: error ? new Error(error.message) : null };
}

/**
 * جلب محاولات على قالب معين (للمعلم)
 */
export async function getTemplateAttempts(
    templateId: string
): Promise<{ data: (ExamAttempt & { student: { name: string } })[]; error: Error | null }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, profiles!exam_attempts_student_id_fkey(name, avatar_url)')
        .eq('template_id', templateId)
        .order('submitted_at', { ascending: false });

    return {
        data: (data || []).map(a => ({
            ...a,
            student: a.profiles as { name: string; avatar_url: string | null }
        })) as unknown as (ExamAttempt & { student: { name: string } })[],
        error: error ? new Error(error.message) : null
    };
}

// =============================================
// وظائف مساعدة
// =============================================

/**
 * خلط مصفوفة (للعشوائية)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * تحضير أسئلة الامتحان حسب الإعدادات
 */
export function prepareQuestionsForExam(
    questions: TemplateQuestion[],
    settings: { shuffleQuestions: boolean; shuffleOptions: boolean },
    language: 'ar' | 'en'
): TemplateQuestion[] {
    let prepared = [...questions];

    // خلط الأسئلة
    if (settings.shuffleQuestions) {
        prepared = shuffleArray(prepared);
    }

    // خلط الخيارات
    if (settings.shuffleOptions) {
        prepared = prepared.map(q => ({
            ...q,
            options: shuffleArray(q.options)
        }));
    }

    return prepared;
}

/**
 * جلب النص حسب اللغة
 */
export function getLocalizedText(text: LangText, language: 'ar' | 'en'): string {
    return text[language] || text.ar || text.en || '';
}
