-- =============================================
-- Fix Testimonials Table RLS Policies
-- =============================================
-- This migration fixes the RLS policies for the testimonials table
-- to allow authenticated users to insert and view their own testimonials

-- Enable RLS on testimonials table (if not already enabled)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Ensure foreign key constraints exist
DO $$ 
BEGIN
    -- Add foreign key for user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'testimonials_user_id_fkey' 
        AND table_name = 'testimonials'
    ) THEN
        ALTER TABLE testimonials 
        ADD CONSTRAINT testimonials_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
    END IF;

    -- Add foreign key for reviewed_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'testimonials_reviewed_by_fkey' 
        AND table_name = 'testimonials'
    ) THEN
        ALTER TABLE testimonials 
        ADD CONSTRAINT testimonials_reviewed_by_fkey 
        FOREIGN KEY (reviewed_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view approved testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can update their own pending testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can update all testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON testimonials;

-- =============================================
-- Public Policies
-- =============================================

-- Allow everyone to view approved testimonials
CREATE POLICY "Users can view approved testimonials"
ON testimonials
FOR SELECT
USING (status = 'approved');

-- =============================================
-- Authenticated User Policies
-- =============================================

-- Allow authenticated users to view their own testimonials (any status)
CREATE POLICY "Users can view their own testimonials"
ON testimonials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own testimonials
CREATE POLICY "Users can insert their own testimonials"
ON testimonials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own pending testimonials
CREATE POLICY "Users can update their own pending testimonials"
ON testimonials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- =============================================
-- Admin Policies
-- =============================================

-- Allow admins to view all testimonials
CREATE POLICY "Admins can view all testimonials"
ON testimonials
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow admins to update all testimonials
CREATE POLICY "Admins can update all testimonials"
ON testimonials
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow admins to delete testimonials
CREATE POLICY "Admins can delete testimonials"
ON testimonials
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- =============================================
-- Grant necessary permissions
-- =============================================

-- Grant usage on the table to authenticated users
GRANT SELECT, INSERT ON testimonials TO authenticated;
GRANT UPDATE ON testimonials TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON testimonials TO service_role;
