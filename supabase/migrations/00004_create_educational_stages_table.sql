-- ============================================
-- Migration: 00004_create_educational_stages_table
-- Description: إنشاء جدول المراحل التعليمية
-- ============================================

CREATE TABLE IF NOT EXISTS educational_stages (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- بيانات المرحلة
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    slug TEXT NOT NULL UNIQUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للبحث بالـ slug
CREATE INDEX IF NOT EXISTS idx_educational_stages_slug ON educational_stages(slug);

-- فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_educational_stages_order ON educational_stages(order_index);

-- فهرس للمراحل النشطة
CREATE INDEX IF NOT EXISTS idx_educational_stages_active ON educational_stages(is_active) WHERE is_active = true;

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_educational_stages_updated_at
    BEFORE UPDATE ON educational_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE educational_stages ENABLE ROW LEVEL SECURITY;

-- سياسة: الجميع يمكنهم قراءة المراحل
CREATE POLICY "Educational stages are viewable by everyone"
    ON educational_stages FOR SELECT
    USING (true);

-- سياسة: المدراء فقط يمكنهم إضافة مراحل
CREATE POLICY "Admins can insert educational stages"
    ON educational_stages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم تعديل المراحل
CREATE POLICY "Admins can update educational stages"
    ON educational_stages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف المراحل
CREATE POLICY "Admins can delete educational stages"
    ON educational_stages FOR DELETE
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

COMMENT ON TABLE educational_stages IS 'جدول المراحل التعليمية (ابتدائي، إعدادي، ثانوي، إلخ)';
COMMENT ON COLUMN educational_stages.name IS 'اسم المرحلة';
COMMENT ON COLUMN educational_stages.slug IS 'الرابط المختصر للمرحلة';
COMMENT ON COLUMN educational_stages.order_index IS 'ترتيب العرض';
COMMENT ON COLUMN educational_stages.is_active IS 'هل المرحلة نشطة';
