-- Fix permissions for comprehensive_exam_attempts
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comprehensive_exam_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comprehensive_exam_attempts TO service_role;

-- Enable RLS just in case
ALTER TABLE public.comprehensive_exam_attempts ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting or redundant policies to clear the slate
DROP POLICY IF EXISTS "Students view own comp attempts" ON public.comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.comprehensive_exam_attempts;
DROP POLICY IF EXISTS "comp_attempts_user_all" ON public.comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Students create own comp attempts" ON public.comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Students update own in_progress comp attempts" ON public.comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.comprehensive_exam_attempts;
DROP POLICY IF EXISTS "comp_attempts_admin_read" ON public.comprehensive_exam_attempts;

-- Re-create clean, consolidated policies

-- 1. SELECT: Users can see their own attempts, Admins can see everything, Teachers can see attempts on their exams
CREATE POLICY "view_comprehensive_exam_attempts" ON public.comprehensive_exam_attempts
FOR SELECT
TO authenticated
USING (
  -- Student viewing their own attempt
  student_id = auth.uid()
  OR
  -- Admin viewing any attempt
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- Teacher viewing attempts for exams they created
  EXISTS (
    SELECT 1 FROM comprehensive_exams
    WHERE id = comprehensive_exam_attempts.exam_id
    AND created_by = auth.uid()
  )
);

-- 2. INSERT: Users can create attempts for themselves
CREATE POLICY "insert_comprehensive_exam_attempts" ON public.comprehensive_exam_attempts
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
);

-- 3. UPDATE: Users can update their own attempts (e.g. valid status transition), Admins can update any
CREATE POLICY "update_comprehensive_exam_attempts" ON public.comprehensive_exam_attempts
FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. DELETE: Admins only (or maybe teachers for their own exams, but keep it safe for now)
CREATE POLICY "delete_comprehensive_exam_attempts" ON public.comprehensive_exam_attempts
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
