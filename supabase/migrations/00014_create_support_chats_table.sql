-- ============================================
-- Migration: 00014_create_support_chats_table
-- Description: إنشاء جدول محادثات الدعم
-- ============================================

CREATE TABLE IF NOT EXISTS support_chats (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- بيانات المستخدم
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    
    -- حالة المحادثة
    status support_chat_status NOT NULL DEFAULT 'open',
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للمستخدم
CREATE INDEX IF NOT EXISTS idx_support_chats_user_id ON support_chats(user_id);

-- فهرس للحالة
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON support_chats(status);

-- فهرس للمحادثات المفتوحة
CREATE INDEX IF NOT EXISTS idx_support_chats_open ON support_chats(status) WHERE status = 'open';

-- فهرس لتاريخ الإنشاء
CREATE INDEX IF NOT EXISTS idx_support_chats_created_at ON support_chats(created_at DESC);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_support_chats_updated_at
    BEFORE UPDATE ON support_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يمكنه رؤية محادثاته والمدراء يمكنهم رؤية الكل
CREATE POLICY "Users can view own chats, admins can view all"
    ON support_chats FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: الجميع يمكنهم بدء محادثة
CREATE POLICY "Anyone can start a chat"
    ON support_chats FOR INSERT
    WITH CHECK (true);

-- سياسة: المستخدم والمدراء يمكنهم تعديل المحادثة
CREATE POLICY "Users and admins can update chats"
    ON support_chats FOR UPDATE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف المحادثات
CREATE POLICY "Admins can delete chats"
    ON support_chats FOR DELETE
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

COMMENT ON TABLE support_chats IS 'جدول محادثات الدعم الفني';
COMMENT ON COLUMN support_chats.user_id IS 'معرف المستخدم (اختياري)';
COMMENT ON COLUMN support_chats.user_name IS 'اسم المستخدم';
COMMENT ON COLUMN support_chats.user_email IS 'بريد المستخدم';
COMMENT ON COLUMN support_chats.status IS 'حالة المحادثة: open, resolved, pending';
