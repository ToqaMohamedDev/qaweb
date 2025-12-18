-- ============================================
-- Migration: 00001_create_extensions
-- Description: تفعيل الإضافات المطلوبة
-- ============================================

-- تفعيل إضافة UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- تفعيل إضافة pgcrypto للتشفير
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- تفعيل إضافة النصوص البحثية في public schema
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;
