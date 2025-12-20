-- ============================================
-- Fix: إضافة الأعمدة الناقصة لجدول user_devices
-- Run this in Supabase SQL Editor
-- ============================================

-- إضافة عمود last_seen_at لو مش موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'last_seen_at'
    ) THEN
        ALTER TABLE user_devices ADD COLUMN last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- إضافة عمود first_seen_at لو مش موجود
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_devices' AND column_name = 'first_seen_at'
    ) THEN
        ALTER TABLE user_devices ADD COLUMN first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- إنشاء الـ index
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON user_devices(last_seen_at DESC);
