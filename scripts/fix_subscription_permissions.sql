-- ============================================
-- إصلاح صلاحيات الاشتراكات للمدرسين
-- السماح لأي مستخدم مسجل بالاشتراك
-- ============================================

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Users can view own subscriptions" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Users can subscribe" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Users can unsubscribe" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Users can subscribe to teachers" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Users can view their subscriptions" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscription counts" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON teacher_subscriptions;
DROP POLICY IF EXISTS "Enable read access for all users" ON teacher_subscriptions;
DROP POLICY IF EXISTS "authenticated_users_can_subscribe" ON teacher_subscriptions;
DROP POLICY IF EXISTS "users_can_unsubscribe" ON teacher_subscriptions;
DROP POLICY IF EXISTS "authenticated_users_can_read_subscriptions" ON teacher_subscriptions;

-- التأكد من تفعيل RLS
ALTER TABLE teacher_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- السياسات الجديدة - متاحة لجميع المستخدمين المسجلين
-- ============================================

-- 1. السماح لأي مستخدم مسجل بقراءة الاشتراكات (مهم لعرض عدد المشتركين)
CREATE POLICY "allow_read_subscriptions" ON teacher_subscriptions
    FOR SELECT 
    TO authenticated
    USING (true);

-- 2. السماح لأي مستخدم مسجل بإضافة اشتراك (لنفسه فقط)
CREATE POLICY "allow_subscribe" ON teacher_subscriptions
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. السماح للمستخدم بتعديل اشتراكه
CREATE POLICY "allow_update_own_subscription" ON teacher_subscriptions
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. السماح للمستخدم بإلغاء اشتراكه
CREATE POLICY "allow_unsubscribe" ON teacher_subscriptions
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- التحقق من السياسات
-- ============================================

-- عرض السياسات الحالية للتأكد
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'teacher_subscriptions';
