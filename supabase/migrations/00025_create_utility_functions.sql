-- ============================================
-- Migration: 00025_create_utility_functions
-- Description: إنشاء Functions مساعدة عامة
-- ============================================

-- ============================================
-- Function لإحصائيات لوحة التحكم
-- ============================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_students BIGINT,
    total_teachers BIGINT,
    total_lessons BIGINT,
    total_exams BIGINT,
    total_questions BIGINT,
    published_lessons BIGINT,
    published_exams BIGINT,
    new_students_this_week BIGINT,
    new_teachers_this_week BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
        (SELECT COUNT(*) FROM profiles WHERE role = 'teacher'),
        (SELECT COUNT(*) FROM lessons),
        (SELECT COUNT(*) FROM exams),
        (SELECT COUNT(*) FROM questions),
        (SELECT COUNT(*) FROM lessons WHERE is_published = true),
        (SELECT COUNT(*) FROM exams WHERE is_published = true),
        (SELECT COUNT(*) FROM profiles WHERE role = 'student' AND created_at >= NOW() - INTERVAL '7 days'),
        (SELECT COUNT(*) FROM profiles WHERE role = 'teacher' AND created_at >= NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function للبحث العام
-- ============================================

CREATE OR REPLACE FUNCTION search_content(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    content_type TEXT,
    content_id UUID,
    title TEXT,
    description TEXT,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    -- البحث في الدروس
    SELECT 
        'lesson'::TEXT as content_type,
        l.id as content_id,
        l.title,
        l.description,
        similarity(l.title, search_query) as relevance
    FROM lessons l
    WHERE l.is_published = true AND (l.title ILIKE '%' || search_query || '%' OR l.description ILIKE '%' || search_query || '%')
    
    UNION ALL
    
    -- البحث في الاختبارات
    SELECT 
        'exam'::TEXT as content_type,
        e.id as content_id,
        e.title,
        e.description,
        similarity(e.title, search_query) as relevance
    FROM exams e
    WHERE e.is_published = true AND (e.title ILIKE '%' || search_query || '%' OR e.description ILIKE '%' || search_query || '%')
    
    UNION ALL
    
    -- البحث في المعلمين
    SELECT 
        'teacher'::TEXT as content_type,
        p.id as content_id,
        p.name as title,
        p.bio as description,
        similarity(p.name, search_query) as relevance
    FROM profiles p
    WHERE p.role = 'teacher' AND p.is_teacher_profile_public = true 
        AND (p.name ILIKE '%' || search_query || '%' OR p.bio ILIKE '%' || search_query || '%')
    
    ORDER BY relevance DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function لتنظيف البيانات القديمة
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- حذف المحادثات المحلولة القديمة (أكثر من 90 يوم)
    DELETE FROM support_chats 
    WHERE status = 'resolved' AND updated_at < NOW() - INTERVAL '90 days';
    
    -- حذف الرسائل المؤرشفة القديمة (أكثر من 180 يوم)
    DELETE FROM messages 
    WHERE is_archived = true AND created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function للحصول على المعلمين المميزين
-- ============================================

CREATE OR REPLACE FUNCTION get_featured_teachers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    specialization TEXT,
    subscriber_count INTEGER,
    rating_average NUMERIC,
    rating_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.avatar_url,
        p.bio,
        p.specialization,
        p.subscriber_count,
        p.rating_average,
        p.rating_count
    FROM profiles p
    WHERE p.role = 'teacher' 
        AND p.is_teacher_profile_public = true
        AND p.is_verified = true
        AND (p.is_featured = true OR p.featured_until > NOW())
    ORDER BY p.is_featured DESC, p.rating_average DESC, p.subscriber_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function لإرسال إشعار مجدول
-- ============================================

CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
BEGIN
    UPDATE notifications
    SET status = 'sent', sent_at = NOW()
    WHERE status = 'scheduled' AND scheduled_for <= NOW();
    
    GET DIAGNOSTICS processed_count = ROW_COUNT;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
