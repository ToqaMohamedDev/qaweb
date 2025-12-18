-- ============================================
-- Migration: 00002_create_enums
-- Description: إنشاء أنواع البيانات المخصصة (ENUMS)
-- ============================================

-- نوع دور المستخدم
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع الإشعارات حسب الدور المستهدف
DO $$ BEGIN
    CREATE TYPE notification_target_role AS ENUM ('all', 'students', 'teachers', 'admins');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة الإشعار
DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('draft', 'sent', 'scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع الاختبار
DO $$ BEGIN
    CREATE TYPE exam_type AS ENUM ('quiz', 'midterm', 'final', 'practice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع السؤال
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'fill_blank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- مستوى صعوبة السؤال
DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة محادثة الدعم
DO $$ BEGIN
    CREATE TYPE support_chat_status AS ENUM ('open', 'resolved', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع المرسل في الرسائل
DO $$ BEGIN
    CREATE TYPE sender_type AS ENUM ('user', 'ai', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع الامتحان الشامل
DO $$ BEGIN
    CREATE TYPE comprehensive_exam_type AS ENUM ('arabic_comprehensive_exam', 'english_comprehensive_exam');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نطاق استخدام الامتحان الشامل
DO $$ BEGIN
    CREATE TYPE exam_usage_scope AS ENUM ('exam', 'lesson');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع التصحيح
DO $$ BEGIN
    CREATE TYPE grading_mode AS ENUM ('manual', 'hybrid', 'auto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة محاولة الامتحان الشامل
DO $$ BEGIN
    CREATE TYPE exam_attempt_status AS ENUM ('in_progress', 'completed', 'graded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع سؤال الدرس
DO $$ BEGIN
    CREATE TYPE lesson_question_type AS ENUM ('mcq', 'truefalse', 'essay', 'fill_blank', 'matching');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
