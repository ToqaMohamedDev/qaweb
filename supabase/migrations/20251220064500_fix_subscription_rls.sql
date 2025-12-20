-- Fix RLS policies for teacher_subscriptions table
-- This allows any authenticated user to subscribe to teachers

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can subscribe to teachers" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Users can unsubscribe" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Users can view their subscriptions" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscription counts" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Enable read access for all users" ON teacher_subscriptions;

-- Make sure RLS is enabled
ALTER TABLE teacher_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow ANY authenticated user to subscribe (insert their own subscription)
CREATE POLICY "authenticated_users_can_subscribe" ON teacher_subscriptions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own subscriptions
CREATE POLICY "users_can_unsubscribe" ON teacher_subscriptions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Allow ALL authenticated users to read subscriptions (needed for counts and checking status)
CREATE POLICY "authenticated_users_can_read_subscriptions" ON teacher_subscriptions
FOR SELECT TO authenticated
USING (true);
