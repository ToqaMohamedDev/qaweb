-- =============================================
-- Performance Optimization Migration
-- Date: 2026-01-25
-- =============================================

-- =============================================
-- 1. Database Function: get_dashboard_data
-- جلب كل بيانات الـ Dashboard في query واحد
-- =============================================

CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_stage_id UUID;
  v_stage_name TEXT;
  v_show_first BOOLEAN;
  v_show_second BOOLEAN;
  v_result JSON;
BEGIN
  -- جلب إعدادات الترم
  SELECT show_first_semester, show_second_semester 
  INTO v_show_first, v_show_second
  FROM app_settings 
  WHERE id = 'global';
  
  -- القيم الافتراضية
  v_show_first := COALESCE(v_show_first, true);
  v_show_second := COALESCE(v_show_second, true);
  
  -- جلب مرحلة المستخدم
  IF p_user_id IS NOT NULL THEN
    SELECT es.id, es.name 
    INTO v_stage_id, v_stage_name
    FROM profiles p
    LEFT JOIN educational_stages es ON p.educational_stage_id = es.id
    WHERE p.id = p_user_id;
  END IF;
  
  -- المرحلة الافتراضية إذا لم توجد
  IF v_stage_id IS NULL THEN
    SELECT id, name 
    INTO v_stage_id, v_stage_name
    FROM educational_stages 
    WHERE slug = 'grade-3-secondary';
  END IF;
  
  -- جلب كل البيانات في query واحد
  SELECT json_build_object(
    'stageId', v_stage_id,
    'stageName', v_stage_name,
    'showFirst', v_show_first,
    'showSecond', v_show_second,
    'currentSemester', CASE 
      WHEN v_show_first AND NOT v_show_second THEN 'first'
      WHEN NOT v_show_first AND v_show_second THEN 'second'
      ELSE 'full_year'
    END,
    'subjects', COALESCE((
      SELECT json_agg(subject_row ORDER BY subject_row->>'orderIndex')
      FROM (
        SELECT json_build_object(
          'id', sub.id,
          'name', sub.name,
          'slug', sub.slug,
          'icon', sub.icon,
          'color', sub.color,
          'description', sub.description,
          'imageUrl', sub.image_url,
          'lessonsCount', COALESCE(lesson_counts.cnt, 0),
          'orderIndex', ss.order_index
        ) as subject_row
        FROM subjects sub
        INNER JOIN subject_stages ss 
          ON ss.subject_id = sub.id 
          AND ss.stage_id = v_stage_id 
          AND ss.is_active = true
        LEFT JOIN (
          SELECT subject_id, COUNT(*) as cnt
          FROM lessons
          WHERE is_published = true
            AND (stage_id = v_stage_id OR stage_id IS NULL)
            AND (
              (v_show_first AND v_show_second) -- show all
              OR (v_show_first AND NOT v_show_second AND semester IN ('first', 'full_year'))
              OR (NOT v_show_first AND v_show_second AND semester IN ('second', 'full_year'))
            )
          GROUP BY subject_id
        ) lesson_counts ON lesson_counts.subject_id = sub.id
        WHERE sub.is_active = true
      ) subquery
    ), '[]'::json),
    'stats', json_build_object(
      'totalUsers', (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
      'totalLessons', (
        SELECT COUNT(*) 
        FROM lessons 
        WHERE is_published = true 
          AND stage_id = v_stage_id
      ),
      'averageRating', COALESCE(
        (SELECT ROUND(AVG(rating)::numeric, 1) FROM teacher_ratings), 
        4.8
      ),
      'successRate', 85
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- إعطاء صلاحيات للـ function
GRANT EXECUTE ON FUNCTION get_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data TO anon;

-- =============================================
-- 2. Database Function: get_admin_stats
-- إحصائيات لوحة تحكم الأدمن
-- =============================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'totalTeachers', (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
    'totalStudents', (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
    'totalComprehensiveExams', (SELECT COUNT(*) FROM comprehensive_exams),
    'publishedExams', (SELECT COUNT(*) FROM comprehensive_exams WHERE is_published = true),
    'totalLessons', (SELECT COUNT(*) FROM lessons),
    'publishedLessons', (SELECT COUNT(*) FROM lessons WHERE is_published = true),
    'totalStages', (SELECT COUNT(*) FROM educational_stages WHERE is_active = true),
    'totalSubjects', (SELECT COUNT(*) FROM subjects WHERE is_active = true),
    'totalQuestions', (SELECT COUNT(*) FROM lesson_questions WHERE is_active = true)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_stats TO authenticated;

-- =============================================
-- 3. تنظيف الجداول المتضخمة (VACUUM)
-- ملاحظة: يجب تشغيل هذا يدوياً في Supabase Dashboard
-- =============================================

-- VACUUM (VERBOSE, ANALYZE) profiles;
-- VACUUM (VERBOSE, ANALYZE) notifications;
-- VACUUM (VERBOSE, ANALYZE) subjects;
-- VACUUM (VERBOSE, ANALYZE) teacher_subscriptions;

-- =============================================
-- 4. تحديث الإحصائيات
-- =============================================

ANALYZE profiles;
ANALYZE lessons;
ANALYZE subjects;
ANALYZE educational_stages;
ANALYZE subject_stages;
ANALYZE comprehensive_exams;

-- =============================================
-- 5. إضافة Index مركب للـ Dashboard queries
-- =============================================

-- Index للدروس بناءً على المرحلة والنشر والترم
CREATE INDEX IF NOT EXISTS idx_lessons_dashboard 
ON lessons (stage_id, is_published, semester) 
WHERE is_published = true;

-- Index للمواد النشطة
CREATE INDEX IF NOT EXISTS idx_subjects_active 
ON subjects (is_active) 
WHERE is_active = true;

-- Index للـ subject_stages النشطة
CREATE INDEX IF NOT EXISTS idx_subject_stages_dashboard 
ON subject_stages (stage_id, is_active, order_index) 
WHERE is_active = true;

-- =============================================
-- 6. Materialized View للإحصائيات (اختياري)
-- يمكن تحديثها بشكل دوري لتحسين الأداء
-- =============================================

-- CREATE MATERIALIZED VIEW IF NOT EXISTS mv_platform_stats AS
-- SELECT 
--   (SELECT COUNT(*) FROM profiles WHERE role = 'student') as total_students,
--   (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') as total_teachers,
--   (SELECT COUNT(*) FROM lessons WHERE is_published = true) as total_lessons,
--   (SELECT COUNT(*) FROM comprehensive_exams WHERE is_published = true) as total_exams,
--   COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM teacher_ratings), 4.8) as avg_rating,
--   NOW() as last_updated;

-- CREATE UNIQUE INDEX ON mv_platform_stats (last_updated);

-- لتحديث الـ Materialized View:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_platform_stats;
