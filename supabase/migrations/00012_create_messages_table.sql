-- ============================================
-- Migration: 00012_create_messages_table
-- Description: إنشاء جدول الرسائل
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- بيانات المرسل
    from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    from_name TEXT NOT NULL,
    from_email TEXT NOT NULL,
    
    -- محتوى الرسالة
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- حالة الرسالة
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    -- الرد
    is_replied BOOLEAN NOT NULL DEFAULT false,
    reply_text TEXT,
    replied_at TIMESTAMPTZ,
    replied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للمرسل
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);

-- فهرس للرسائل غير المقروءة
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = false;

-- فهرس للرسائل المميزة
CREATE INDEX IF NOT EXISTS idx_messages_starred ON messages(is_starred) WHERE is_starred = true;

-- فهرس للرسائل المؤرشفة
CREATE INDEX IF NOT EXISTS idx_messages_archived ON messages(is_archived) WHERE is_archived = true;

-- فهرس للرسائل التي تم الرد عليها
CREATE INDEX IF NOT EXISTS idx_messages_replied ON messages(is_replied) WHERE is_replied = true;

-- فهرس للبحث في الموضوع
CREATE INDEX IF NOT EXISTS idx_messages_subject_trgm ON messages USING gin(subject gin_trgm_ops);

-- فهرس لتاريخ الإنشاء
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- سياسة: المدراء فقط يمكنهم رؤية الرسائل
CREATE POLICY "Admins can view all messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
        OR from_user_id = auth.uid()
    );

-- سياسة: الجميع يمكنهم إرسال رسائل
CREATE POLICY "Anyone can insert messages"
    ON messages FOR INSERT
    WITH CHECK (true);

-- سياسة: المدراء فقط يمكنهم تعديل الرسائل
CREATE POLICY "Admins can update messages"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف الرسائل
CREATE POLICY "Admins can delete messages"
    ON messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- Function لعدد الرسائل غير المقروءة
-- ============================================

CREATE OR REPLACE FUNCTION get_unread_messages_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM messages WHERE is_read = false AND is_archived = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE messages IS 'جدول رسائل التواصل';
COMMENT ON COLUMN messages.from_user_id IS 'معرف المستخدم المرسل (اختياري)';
COMMENT ON COLUMN messages.from_name IS 'اسم المرسل';
COMMENT ON COLUMN messages.from_email IS 'بريد المرسل';
COMMENT ON COLUMN messages.is_read IS 'هل تم قراءة الرسالة';
COMMENT ON COLUMN messages.is_starred IS 'هل الرسالة مميزة';
COMMENT ON COLUMN messages.is_archived IS 'هل الرسالة مؤرشفة';
COMMENT ON COLUMN messages.is_replied IS 'هل تم الرد على الرسالة';
