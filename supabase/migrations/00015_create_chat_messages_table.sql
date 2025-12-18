-- ============================================
-- Migration: 00015_create_chat_messages_table
-- Description: إنشاء جدول رسائل المحادثات
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقة مع المحادثة
    chat_id UUID NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,
    
    -- نوع المرسل
    sender_type sender_type NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- الرسالة
    message TEXT NOT NULL,
    
    -- هل هي رسالة من الذكاء الاصطناعي
    is_ai_response BOOLEAN NOT NULL DEFAULT false,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للعلاقة مع المحادثة
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);

-- فهرس للمرسل
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);

-- فهرس لنوع المرسل
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);

-- فهرس لتاريخ الإنشاء (للترتيب)
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(chat_id, created_at);

-- فهرس لرسائل الذكاء الاصطناعي
CREATE INDEX IF NOT EXISTS idx_chat_messages_ai ON chat_messages(is_ai_response) WHERE is_ai_response = true;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- سياسة: قراءة رسائل المحادثة للمشاركين والمدراء
CREATE POLICY "Chat participants can view messages"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_chats
            WHERE support_chats.id = chat_messages.chat_id
            AND (
                support_chats.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- سياسة: المشاركون والمدراء يمكنهم إضافة رسائل
CREATE POLICY "Participants can insert messages"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_chats
            WHERE support_chats.id = chat_messages.chat_id
            AND (
                support_chats.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف الرسائل
CREATE POLICY "Admins can delete messages"
    ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- Trigger لتحديث updated_at في المحادثة عند إضافة رسالة
-- ============================================

CREATE OR REPLACE FUNCTION update_chat_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_chats
    SET updated_at = NOW()
    WHERE id = NEW.chat_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_on_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_on_new_message();

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE chat_messages IS 'جدول رسائل محادثات الدعم';
COMMENT ON COLUMN chat_messages.chat_id IS 'معرف المحادثة';
COMMENT ON COLUMN chat_messages.sender_type IS 'نوع المرسل: user, ai, admin';
COMMENT ON COLUMN chat_messages.sender_id IS 'معرف المرسل';
COMMENT ON COLUMN chat_messages.message IS 'نص الرسالة';
COMMENT ON COLUMN chat_messages.is_ai_response IS 'هل الرسالة من الذكاء الاصطناعي';
