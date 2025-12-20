-- ============================================
-- Migration: 20251220170000_protect_role_column
-- Description: حماية عمود role من التعديل بواسطة المستخدم العادي
-- Security Fix: منع المستخدمين من تغيير أدوارهم بأنفسهم
-- ============================================

-- حماية الأعمدة الحساسة من التعديل
-- المنطق: 
-- 1. جلب role المستخدم الحالي (اللي عامل الـ request)
-- 2. لو هو admin = يقدر يعدل أي حاجة
-- 3. لو مش admin = نرجع القيم القديمة للأعمدة الحساسة

CREATE OR REPLACE FUNCTION prevent_sensitive_fields_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
    current_user_id UUID;
BEGIN
    -- جلب ID المستخدم الحالي (اللي عامل الـ request)
    current_user_id := auth.uid();
    
    -- جلب دور المستخدم الحالي
    SELECT role::TEXT INTO current_user_role 
    FROM profiles 
    WHERE id = current_user_id;
    
    -- لو المستخدم admin = يقدر يعدل أي حاجة
    IF current_user_role = 'admin' THEN
        RETURN NEW;
    END IF;
    
    -- لو مش admin، نتحقق هل هو بيعدل ملفه الشخصي ولا لا
    IF current_user_id != OLD.id THEN
        -- مش مفروض يوصل هنا أصلاً بسبب RLS
        -- بس للأمان نرفض أي تعديل على ملف شخص تاني
        RETURN OLD;
    END IF;
    
    -- المستخدم بيعدل ملفه الشخصي بس مش admin
    -- نمنع تغيير الأعمدة الحساسة
    
    -- منع تغيير الـ role
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        NEW.role := OLD.role;
    END IF;
    
    -- منع تغيير is_verified (فقط admin يقدر يوثق)
    IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
        NEW.is_verified := OLD.is_verified;
    END IF;
    
    -- منع تغيير is_featured (فقط admin يقدر يميز)
    IF OLD.is_featured IS DISTINCT FROM NEW.is_featured THEN
        NEW.is_featured := OLD.is_featured;
    END IF;
    
    -- منع تغيير featured_until
    IF OLD.featured_until IS DISTINCT FROM NEW.featured_until THEN
        NEW.featured_until := OLD.featured_until;
    END IF;
    
    -- منع تغيير subscriber_count (يتم عبر triggers فقط)
    IF OLD.subscriber_count IS DISTINCT FROM NEW.subscriber_count THEN
        NEW.subscriber_count := OLD.subscriber_count;
    END IF;
    
    -- منع تغيير rating_average و rating_count (يتم عبر triggers فقط)
    IF OLD.rating_average IS DISTINCT FROM NEW.rating_average THEN
        NEW.rating_average := OLD.rating_average;
    END IF;
    
    IF OLD.rating_count IS DISTINCT FROM NEW.rating_count THEN
        NEW.rating_count := OLD.rating_count;
    END IF;
    
    -- منع تغيير total_views (يتم عبر functions فقط)
    IF OLD.total_views IS DISTINCT FROM NEW.total_views THEN
        NEW.total_views := OLD.total_views;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف الـ trigger القديم وإنشاء الجديد
DROP TRIGGER IF EXISTS trigger_prevent_role_change ON profiles;
DROP TRIGGER IF EXISTS trigger_protect_sensitive_fields ON profiles;

CREATE TRIGGER trigger_protect_sensitive_fields
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_sensitive_fields_change();

-- ============================================
-- تعليقات
-- ============================================
COMMENT ON FUNCTION prevent_sensitive_fields_change() IS 'حماية الأعمدة الحساسة - Admin يقدر يعدل أي حاجة، المستخدم العادي مش يقدر يغير role أو is_verified إلخ';
COMMENT ON TRIGGER trigger_protect_sensitive_fields ON profiles IS 'Trigger لحماية role, is_verified, is_featured, subscriber_count, rating_average, rating_count, total_views';
