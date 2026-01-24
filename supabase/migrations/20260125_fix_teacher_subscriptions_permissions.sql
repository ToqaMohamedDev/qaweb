-- =============================================
-- Fix teacher_subscriptions table permissions
-- The table was missing proper GRANT statements for authenticated and service_role
-- =============================================

-- Grant full permissions to service_role (bypasses RLS)
GRANT ALL ON public.teacher_subscriptions TO service_role;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON public.teacher_subscriptions TO authenticated;

-- Grant read-only access to anon users (for viewing subscription counts)
GRANT SELECT ON public.teacher_subscriptions TO anon;

-- Also ensure the profiles table has proper permissions for the ensureProfileExists function
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
