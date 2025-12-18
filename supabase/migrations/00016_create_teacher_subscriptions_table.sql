-- ============================================
-- Migration: 00016_create_teacher_subscriptions_table
-- Description: إنشاء جدول اشتراكات المعلمين (المتابعين)
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_subscriptions (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقات
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- الإعدادات
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- قيد فريد: لا يمكن للمستخدم الاشتراك مرتين لنفس المعلم
    CONSTRAINT teacher_subscriptions_unique UNIQUE (user_id, teacher_id),
    
    -- قيد: لا يمكن للمستخدم متابعة نفسه
    CONSTRAINT teacher_subscriptions_not_self CHECK (user_id != teacher_id)
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للمستخدم (المتابِع)
CREATE INDEX IF NOT EXISTS idx_teacher_subscriptions_user_id ON teacher_subscriptions(user_id);

-- فهرس للمعلم (المتابَع)
CREATE INDEX IF NOT EXISTS idx_teacher_subscriptions_teacher_id ON teacher_subscriptions(teacher_id);

-- فهرس للإشعارات المفعلة
CREATE INDEX IF NOT EXISTS idx_teacher_subscriptions_notifications ON teacher_subscriptions(notifications_enabled) 
    WHERE notifications_enabled = true;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE teacher_subscriptions ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يمكنه رؤية اشتراكاته
CREATE POLICY "Users can view own subscriptions"
    ON teacher_subscriptions FOR SELECT
    USING (
        user_id = auth.uid()
        OR teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المستخدم يمكنه إضافة اشتراك
CREATE POLICY "Users can subscribe"
    ON teacher_subscriptions FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- سياسة: المستخدم يمكنه تعديل اشتراكه
CREATE POLICY "Users can update own subscriptions"
    ON teacher_subscriptions FOR UPDATE
    USING (user_id = auth.uid());

-- سياسة: المستخدم يمكنه إلغاء اشتراكه
CREATE POLICY "Users can unsubscribe"
    ON teacher_subscriptions FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- Triggers لتحديث عدد المتابعين
-- ============================================

-- عند إضافة اشتراك
CREATE OR REPLACE FUNCTION increment_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET subscriber_count = subscriber_count + 1
    WHERE id = NEW.teacher_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_subscribers
    AFTER INSERT ON teacher_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION increment_subscriber_count();

-- عند حذف اشتراك
CREATE OR REPLACE FUNCTION decrement_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET subscriber_count = GREATEST(0, subscriber_count - 1)
    WHERE id = OLD.teacher_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_subscribers
    AFTER DELETE ON teacher_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION decrement_subscriber_count();

-- ============================================
-- Function للتحقق من الاشتراك
-- ============================================

CREATE OR REPLACE FUNCTION is_subscribed_to_teacher(p_user_id UUID, p_teacher_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teacher_subscriptions
        WHERE user_id = p_user_id AND teacher_id = p_teacher_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE teacher_subscriptions IS 'جدول اشتراكات / متابعات المعلمين';
COMMENT ON COLUMN teacher_subscriptions.user_id IS 'معرف المستخدم المتابِع';
COMMENT ON COLUMN teacher_subscriptions.teacher_id IS 'معرف المعلم المتابَع';
COMMENT ON COLUMN teacher_subscriptions.notifications_enabled IS 'هل الإشعارات مفعلة';
