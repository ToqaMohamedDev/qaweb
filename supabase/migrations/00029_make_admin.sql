-- ============================================
-- Migration: 00029_make_admin
-- Description: جعل المستخدم admin
-- ============================================

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'dzggghjg@gmail.com';
