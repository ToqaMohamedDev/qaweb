-- User Lesson Likes Table
-- جدول إعجابات المستخدمين بالدروس
-- This prevents duplicate likes and allows tracking who liked what

-- Create the table if not exists
CREATE TABLE IF NOT EXISTS public.user_lesson_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.user_lesson_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own likes
CREATE POLICY "Users can view own likes" ON public.user_lesson_likes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can like lessons
CREATE POLICY "Users can like lessons" ON public.user_lesson_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike lessons
CREATE POLICY "Users can unlike lessons" ON public.user_lesson_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all likes
CREATE POLICY "Admins can manage likes" ON public.user_lesson_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_likes_user ON public.user_lesson_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_likes_lesson ON public.user_lesson_likes(lesson_id);

-- Comment
COMMENT ON TABLE public.user_lesson_likes IS 'Tracks user likes for lessons to prevent duplicate likes';
