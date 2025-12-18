-- ============================================
-- Migration: 00026_create_views
-- Description: إنشاء Views مفيدة للتقارير
-- ============================================

-- ============================================
-- View: إحصائيات المعلمين
-- ============================================

CREATE OR REPLACE VIEW teacher_stats AS
SELECT 
    p.id,
    p.name,
    p.email,
    p.avatar_url,
    p.is_verified,
    p.subscriber_count,
    p.rating_average,
    p.rating_count,
    p.total_views,
    COUNT(DISTINCT l.id) as lessons_count,
    COUNT(DISTINCT et.id) as exam_templates_count,
    COALESCE(SUM(l.views_count), 0) as total_lesson_views,
    p.created_at
FROM profiles p
LEFT JOIN lessons l ON l.created_by = p.id
LEFT JOIN exam_templates et ON et.created_by = p.id
WHERE p.role = 'teacher'
GROUP BY p.id;

-- ============================================
-- View: إحصائيات المواد
-- ============================================

CREATE OR REPLACE VIEW subject_stats AS
SELECT 
    s.id,
    s.name,
    s.slug,
    es.name as stage_name,
    COUNT(DISTINCT l.id) as lessons_count,
    COUNT(DISTINCT e.id) as exams_count,
    COALESCE(SUM(l.views_count), 0) as total_views,
    s.is_active,
    s.order_index
FROM subjects s
LEFT JOIN educational_stages es ON es.id = s.stage_id
LEFT JOIN lessons l ON l.subject_id = s.id
LEFT JOIN exams e ON e.subject_id = s.id
GROUP BY s.id, es.name;

-- ============================================
-- View: أحدث الدروس
-- ============================================

CREATE OR REPLACE VIEW recent_lessons AS
SELECT 
    l.id,
    l.title,
    l.description,
    l.image_url,
    l.is_published,
    l.is_free,
    l.views_count,
    l.likes_count,
    l.created_at,
    s.name as subject_name,
    p.name as teacher_name,
    p.avatar_url as teacher_avatar
FROM lessons l
LEFT JOIN subjects s ON s.id = l.subject_id
LEFT JOIN profiles p ON p.id = l.created_by
WHERE l.is_published = true
ORDER BY l.created_at DESC;

-- ============================================
-- View: نتائج الاختبارات مع التفاصيل
-- ============================================

CREATE OR REPLACE VIEW exam_results_detailed AS
SELECT 
    er.id,
    er.score,
    er.total_questions,
    er.correct_answers,
    er.time_taken_seconds,
    er.started_at,
    er.completed_at,
    e.title as exam_title,
    e.exam_type,
    e.passing_score,
    s.name as subject_name,
    p.name as student_name,
    p.email as student_email,
    CASE WHEN er.score >= e.passing_score THEN true ELSE false END as passed
FROM exam_results er
JOIN exams e ON e.id = er.exam_id
LEFT JOIN subjects s ON s.id = e.subject_id
JOIN profiles p ON p.id = er.user_id;

-- ============================================
-- View: تقدم الطلاب
-- ============================================

CREATE OR REPLACE VIEW student_progress_overview AS
SELECT 
    p.id as student_id,
    p.name as student_name,
    p.email,
    COUNT(DISTINCT ulp.lesson_id) FILTER (WHERE ulp.is_completed = true) as completed_lessons,
    COUNT(DISTINCT er.exam_id) as exams_taken,
    COALESCE(AVG(er.score), 0) as average_exam_score,
    MAX(ulp.last_accessed_at) as last_activity
FROM profiles p
LEFT JOIN user_lesson_progress ulp ON ulp.user_id = p.id
LEFT JOIN exam_results er ON er.user_id = p.id AND er.completed_at IS NOT NULL
WHERE p.role = 'student'
GROUP BY p.id;
