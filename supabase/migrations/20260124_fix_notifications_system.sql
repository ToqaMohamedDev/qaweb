-- =============================================
-- NOTIFICATIONS SYSTEM FIX
-- =============================================
-- This migration fixes the notifications system to ensure:
-- 1. Proper RLS policies for all user roles
-- 2. Admin can send notifications to all users
-- 3. Users can view their own notifications
-- 4. Proper indexes for performance
-- =============================================

-- Enable RLS on notifications table (if not already enabled)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view role-targeted notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- =============================================
-- USER POLICIES
-- =============================================

-- Allow users to view their own notifications (user_id matches)
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view notifications targeted to their role (when user_id is null and target_role matches)
-- Note: notification_target_role uses plural (students/teachers/admins) while user_role uses singular (student/teacher/admin)
CREATE POLICY "Users can view role-targeted notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
    user_id IS NULL 
    AND (
        target_role::text = 'all' 
        OR (target_role::text = 'students' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'))
        OR (target_role::text = 'teachers' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'))
        OR (target_role::text = 'admins' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ADMIN POLICIES
-- =============================================

-- Allow admins to view all notifications
CREATE POLICY "Admins can view all notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow admins to insert notifications
CREATE POLICY "Admins can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow admins to update all notifications
CREATE POLICY "Admins can update all notifications"
ON notifications
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

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications"
ON notifications
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
-- SERVICE ROLE POLICY (for API routes)
-- =============================================

-- Allow service role to insert notifications (for automated notifications)
CREATE POLICY "System can insert notifications"
ON notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON notifications TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON notifications TO service_role;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Create index on user_id for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create index on target_role for faster role-based queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);

-- Create index on status for filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Create index on created_at for sorting (if not exists)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create index on is_read for unread count queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Composite index for user notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- =============================================
-- HELPER FUNCTION: Mark single notification as read
-- =============================================

-- Drop function if exists
DROP FUNCTION IF EXISTS mark_notification_read(UUID);

-- Create function to mark a single notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, updated_at = NOW()
    WHERE id = p_notification_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;

-- =============================================
-- HELPER FUNCTION: Mark multiple notifications as read (bulk)
-- =============================================

-- Drop function if exists
DROP FUNCTION IF EXISTS mark_notifications_read_bulk(UUID[], BOOLEAN);

-- Create function to mark multiple notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read_bulk(
    p_notification_ids UUID[] DEFAULT NULL,
    p_mark_all BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    IF p_mark_all THEN
        -- Mark all user's notifications as read
        UPDATE notifications
        SET is_read = true, updated_at = NOW()
        WHERE user_id = auth.uid()
        AND is_read = false;
    ELSE
        -- Mark specific notifications as read
        UPDATE notifications
        SET is_read = true, updated_at = NOW()
        WHERE id = ANY(p_notification_ids)
        AND user_id = auth.uid();
    END IF;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_notifications_read_bulk(UUID[], BOOLEAN) TO authenticated;

-- =============================================
-- HELPER FUNCTION: Get unread notification count
-- =============================================

-- Drop function if exists
DROP FUNCTION IF EXISTS get_unread_notification_count();

-- Create function to get unread notification count for current user
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count INTEGER;
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role::text INTO user_role
    FROM profiles
    WHERE id = auth.uid();

    -- Count unread notifications (both direct and role-targeted)
    -- Map plural target_role to singular user_role
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE is_read = false
    AND (
        user_id = auth.uid()
        OR (
            user_id IS NULL 
            AND (
                target_role::text = 'all' 
                OR (target_role::text = 'students' AND user_role = 'student')
                OR (target_role::text = 'teachers' AND user_role = 'teacher')
                OR (target_role::text = 'admins' AND user_role = 'admin')
            )
        )
    );

    RETURN unread_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

-- =============================================
-- HELPER FUNCTION: Mark all notifications as read
-- =============================================

-- Drop function if exists
DROP FUNCTION IF EXISTS mark_all_notifications_read();

-- Create function to mark all user notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, updated_at = NOW()
    WHERE user_id = auth.uid()
    AND is_read = false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
