-- ============================================
-- Migration: 00033_drop_unused_views
-- Description: حذف الـ Views غير المستخدمة
-- ============================================

DROP VIEW IF EXISTS exam_results_detailed;
DROP VIEW IF EXISTS recent_lessons;
DROP VIEW IF EXISTS student_progress_overview;
DROP VIEW IF EXISTS subject_stats;
DROP VIEW IF EXISTS teacher_stats;
