-- ============================================
-- Migration: 00017_create_teacher_ratings_table
-- Description: إنشاء جدول تقييمات المعلمين
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_ratings (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقات
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- التقييم
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- المراجعة
    review TEXT,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- قيد فريد: تقييم واحد لكل مستخدم لكل معلم
    CONSTRAINT teacher_ratings_unique UNIQUE (teacher_id, user_id),
    
    -- قيد: لا يمكن للمستخدم تقييم نفسه
    CONSTRAINT teacher_ratings_not_self CHECK (teacher_id != user_id)
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للمعلم
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher_id ON teacher_ratings(teacher_id);

-- فهرس للمستخدم
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_user_id ON teacher_ratings(user_id);

-- فهرس للتقييم
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_rating ON teacher_ratings(rating);

-- فهرس لتاريخ الإنشاء
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_created_at ON teacher_ratings(created_at DESC);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_teacher_ratings_updated_at
    BEFORE UPDATE ON teacher_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;

-- سياسة: الجميع يمكنهم رؤية التقييمات
CREATE POLICY "Ratings are viewable by everyone"
    ON teacher_ratings FOR SELECT
    USING (true);

-- سياسة: المستخدم يمكنه إضافة تقييم
CREATE POLICY "Users can add ratings"
    ON teacher_ratings FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- سياسة: المستخدم يمكنه تعديل تقييمه
CREATE POLICY "Users can update own ratings"
    ON teacher_ratings FOR UPDATE
    USING (user_id = auth.uid());

-- سياسة: المستخدم يمكنه حذف تقييمه أو المدراء
CREATE POLICY "Users can delete own ratings or admins"
    ON teacher_ratings FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- Function لتحديث متوسط التقييم
-- ============================================

CREATE OR REPLACE FUNCTION update_teacher_rating_average()
RETURNS TRIGGER AS $$
DECLARE
    new_average NUMERIC(3, 2);
    new_count INTEGER;
    target_teacher_id UUID;
BEGIN
    -- تحديد معرف المعلم المستهدف
    IF TG_OP = 'DELETE' THEN
        target_teacher_id := OLD.teacher_id;
    ELSE
        target_teacher_id := NEW.teacher_id;
    END IF;
    
    -- حساب المتوسط والعدد الجديد
    SELECT 
        COALESCE(ROUND(AVG(rating), 2), 0),
        COUNT(*)
    INTO new_average, new_count
    FROM teacher_ratings
    WHERE teacher_id = target_teacher_id;
    
    -- تحديث الملف الشخصي للمعلم
    UPDATE profiles
    SET 
        rating_average = new_average,
        rating_count = new_count
    WHERE id = target_teacher_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers لتحديث المتوسط
CREATE TRIGGER trigger_update_rating_on_insert
    AFTER INSERT ON teacher_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_rating_average();

CREATE TRIGGER trigger_update_rating_on_update
    AFTER UPDATE ON teacher_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_rating_average();

CREATE TRIGGER trigger_update_rating_on_delete
    AFTER DELETE ON teacher_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_rating_average();

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE teacher_ratings IS 'جدول تقييمات المعلمين';
COMMENT ON COLUMN teacher_ratings.teacher_id IS 'معرف المعلم';
COMMENT ON COLUMN teacher_ratings.user_id IS 'معرف المستخدم المقيِّم';
COMMENT ON COLUMN teacher_ratings.rating IS 'التقييم (1-5)';
COMMENT ON COLUMN teacher_ratings.review IS 'المراجعة النصية (اختياري)';
