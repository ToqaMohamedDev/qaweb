-- ============================================
-- Migration: 00037_add_stage_to_profiles
-- Description: إضافة المرحلة التعليمية المفضلة لجدول المستخدمين
-- ============================================

-- إضافة عمود المرحلة التعليمية للمستخدم
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS educational_stage_id UUID REFERENCES public.educational_stages(id) ON DELETE SET NULL;

-- إضافة index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_profiles_educational_stage ON public.profiles(educational_stage_id);

-- تعيين ثالثة ثانوي كقيمة افتراضية للمستخدمين الحاليين
UPDATE public.profiles
SET educational_stage_id = (
    SELECT id FROM public.educational_stages 
    WHERE name LIKE '%ثالث%ثانوي%' OR name LIKE '%الثالث الثانوي%'
    LIMIT 1
)
WHERE educational_stage_id IS NULL;
