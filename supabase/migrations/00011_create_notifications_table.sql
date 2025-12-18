-- ============================================
-- Migration: 00011_create_notifications_table
-- Description: إنشاء جدول الإشعارات
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- بيانات الإشعار
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- الاستهداف
    target_role notification_target_role NOT NULL DEFAULT 'all',
    
    -- الحالة
    status notification_status NOT NULL DEFAULT 'draft',
    
    -- الأوقات
    sent_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    
    -- منشئ الإشعار
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للحالة
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- فهرس للاستهداف
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_role);

-- فهرس للإشعارات المجدولة
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) 
    WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

-- فهرس لمنشئ الإشعار
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by);

-- فهرس لتاريخ الإرسال
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC) WHERE sent_at IS NOT NULL;

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- سياسة: المدراء فقط يمكنهم رؤية كل الإشعارات
CREATE POLICY "Admins can view all notifications"
    ON notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR (
            status = 'sent' AND (
                target_role = 'all'
                OR (target_role = 'students' AND EXISTS (
                    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'student'
                ))
                OR (target_role = 'teachers' AND EXISTS (
                    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
                ))
            )
        )
    );

-- سياسة: المدراء فقط يمكنهم إضافة إشعارات
CREATE POLICY "Admins can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم تعديل الإشعارات
CREATE POLICY "Admins can update notifications"
    ON notifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف الإشعارات
CREATE POLICY "Admins can delete notifications"
    ON notifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE notifications IS 'جدول الإشعارات';
COMMENT ON COLUMN notifications.title IS 'عنوان الإشعار';
COMMENT ON COLUMN notifications.message IS 'نص الإشعار';
COMMENT ON COLUMN notifications.target_role IS 'الفئة المستهدفة: all, students, teachers, admins';
COMMENT ON COLUMN notifications.status IS 'حالة الإشعار: draft, sent, scheduled';
COMMENT ON COLUMN notifications.scheduled_for IS 'موعد الإرسال المجدول';
