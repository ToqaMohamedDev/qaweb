-- ============================================
-- Migration: 00024_create_storage_buckets
-- Description: إنشاء Storage Buckets لتخزين الملفات
-- ============================================

-- إنشاء bucket للصور الشخصية
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket لصور الغلاف
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'covers',
    'covers',
    true,
    10485760,  -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket لملفات الدروس
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'lessons',
    'lessons',
    true,
    104857600,  -- 100MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'audio/mpeg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket لملفات الاختبارات
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'exams',
    'exams',
    false,
    52428800,  -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket للمحادثات
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-attachments',
    'chat-attachments',
    false,
    10485760,  -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies للـ Avatars
-- ============================================

CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Storage Policies للـ Covers
-- ============================================

CREATE POLICY "Cover images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own cover"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own cover"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Storage Policies للـ Lessons
-- ============================================

CREATE POLICY "Lesson files are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'lessons');

CREATE POLICY "Teachers can upload lesson files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'lessons' AND EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Teachers can update lesson files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'lessons' AND EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Teachers can delete lesson files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'lessons' AND EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
        )
    );
