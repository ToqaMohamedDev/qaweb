-- ============================================
-- Migration: 00013_create_site_settings_table
-- Description: إنشاء جدول إعدادات الموقع
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- مفتاح الإعداد (فريد)
    key TEXT NOT NULL UNIQUE,
    
    -- قيمة الإعداد
    value JSONB NOT NULL DEFAULT '{}',
    
    -- وصف الإعداد
    description TEXT,
    
    -- آخر من قام بالتحديث
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للمفتاح (موجود بالفعل عبر UNIQUE)
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- سياسة: الجميع يمكنهم قراءة الإعدادات العامة
CREATE POLICY "Site settings are viewable by everyone"
    ON site_settings FOR SELECT
    USING (true);

-- سياسة: المدراء فقط يمكنهم إضافة إعدادات
CREATE POLICY "Admins can insert site settings"
    ON site_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم تعديل الإعدادات
CREATE POLICY "Admins can update site settings"
    ON site_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف الإعدادات
CREATE POLICY "Admins can delete site settings"
    ON site_settings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- إدخال الإعدادات الافتراضية
-- ============================================

INSERT INTO site_settings (key, value, description) VALUES
    ('site_name', '{"ar": "منصة التعليم", "en": "Education Platform"}', 'اسم الموقع'),
    ('site_description', '{"ar": "منصة تعليمية متكاملة", "en": "Integrated educational platform"}', 'وصف الموقع'),
    ('contact_email', '"admin@example.com"', 'بريد التواصل'),
    ('social_links', '{"facebook": "", "twitter": "", "youtube": "", "instagram": ""}', 'روابط التواصل الاجتماعي'),
    ('maintenance_mode', 'false', 'وضع الصيانة'),
    ('registration_enabled', 'true', 'تفعيل التسجيل'),
    ('theme_colors', '{"primary": "#3B82F6", "secondary": "#10B981", "accent": "#F59E0B"}', 'ألوان المظهر'),
    ('analytics_enabled', 'true', 'تفعيل التحليلات'),
    ('default_language', '"ar"', 'اللغة الافتراضية')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Function للحصول على إعداد
-- ============================================

CREATE OR REPLACE FUNCTION get_site_setting(setting_key TEXT)
RETURNS JSONB AS $$
DECLARE
    setting_value JSONB;
BEGIN
    SELECT value INTO setting_value
    FROM site_settings
    WHERE key = setting_key;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function لتحديث إعداد
-- ============================================

CREATE OR REPLACE FUNCTION set_site_setting(setting_key TEXT, setting_value JSONB, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO site_settings (key, value, updated_by)
    VALUES (setting_key, setting_value, user_id)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = setting_value,
        updated_by = user_id,
        updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE site_settings IS 'جدول إعدادات الموقع';
COMMENT ON COLUMN site_settings.key IS 'مفتاح الإعداد (فريد)';
COMMENT ON COLUMN site_settings.value IS 'قيمة الإعداد بصيغة JSON';
COMMENT ON COLUMN site_settings.description IS 'وصف الإعداد';
COMMENT ON COLUMN site_settings.updated_by IS 'آخر من قام بالتحديث';
