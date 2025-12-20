-- ============================================================================
-- NOTIFICATION SYSTEM - PRODUCTION READY
-- ============================================================================
-- Author: Senior Backend Architect
-- Created: 2025-12-20
-- Description: Complete notification system with push notifications support
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================

-- Notification types enum for categorization
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'system',           -- System announcements
        'achievement',      -- User achievements/badges
        'quiz_result',      -- Quiz completion results
        'new_content',      -- New courses/lessons available
        'subscription',     -- Subscription updates
        'reminder',         -- Study reminders
        'social',           -- Social interactions (follows, mentions)
        'promotional',      -- Promotional content
        'security',         -- Security alerts (login, password change)
        'billing'           -- Billing/payment notifications
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Device platform enum
DO $$ BEGIN
    CREATE TYPE device_platform AS ENUM (
        'ios',
        'android',
        'web'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Table: notifications
-- Description: Stores all user notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',  -- Metadata: redirect_route, action_url, entity_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    is_pushed BOOLEAN DEFAULT FALSE,  -- Track if push notification was sent
    push_sent_at TIMESTAMPTZ,  -- When push was sent
    read_at TIMESTAMPTZ,  -- When notification was read
    expires_at TIMESTAMPTZ,  -- Optional expiration date
    priority INTEGER DEFAULT 0,  -- Higher = more important (0-10)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_not_pushed ON notifications(user_id, is_pushed) WHERE is_pushed = FALSE;

-- -----------------------------------------------------------------------------
-- Table: user_devices
-- Description: Stores FCM/APNs tokens for push notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform device_platform NOT NULL,
    device_name TEXT,  -- e.g., "iPhone 14 Pro", "Chrome on Windows"
    device_model TEXT,  -- e.g., "iPhone14,3"
    os_version TEXT,  -- e.g., "iOS 17.2", "Android 14"
    app_version TEXT,  -- Your app version
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate tokens per user
    CONSTRAINT unique_user_device_token UNIQUE(user_id, device_token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(user_id, is_active) WHERE is_active = TRUE;

-- -----------------------------------------------------------------------------
-- Table: notification_preferences
-- Description: User preferences for notification types
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One preference per notification type per user
    CONSTRAINT unique_user_notification_pref UNIQUE(user_id, notification_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);

-- -----------------------------------------------------------------------------
-- Table: notification_batches (Optional: for bulk operations tracking)
-- Description: Track bulk notification sends
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type notification_type NOT NULL,
    data JSONB DEFAULT '{}',
    target_audience JSONB DEFAULT '{}',  -- Filters: user_ids, roles, etc.
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_batches ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: notifications
-- -----------------------------------------------------------------------------

-- Users can only SELECT their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only UPDATE their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can DELETE their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
CREATE POLICY "Service role full access notifications" ON notifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Allow INSERT from authenticated users via functions (needed for triggers)
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT
    WITH CHECK (true);  -- Controlled via functions

-- -----------------------------------------------------------------------------
-- RLS Policies: user_devices
-- -----------------------------------------------------------------------------

-- Users can view their own devices
DROP POLICY IF EXISTS "Users can view own devices" ON user_devices;
CREATE POLICY "Users can view own devices" ON user_devices
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own devices
DROP POLICY IF EXISTS "Users can insert own devices" ON user_devices;
CREATE POLICY "Users can insert own devices" ON user_devices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
DROP POLICY IF EXISTS "Users can update own devices" ON user_devices;
CREATE POLICY "Users can update own devices" ON user_devices
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own devices
DROP POLICY IF EXISTS "Users can delete own devices" ON user_devices;
CREATE POLICY "Users can delete own devices" ON user_devices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access devices" ON user_devices;
CREATE POLICY "Service role full access devices" ON user_devices
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: notification_preferences
-- -----------------------------------------------------------------------------

-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences" ON notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences" ON notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
DROP POLICY IF EXISTS "Users can delete own preferences" ON notification_preferences;
CREATE POLICY "Users can delete own preferences" ON notification_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access preferences" ON notification_preferences;
CREATE POLICY "Service role full access preferences" ON notification_preferences
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: notification_batches (Admin only)
-- -----------------------------------------------------------------------------

-- Only service role can access batches
DROP POLICY IF EXISTS "Service role only batches" ON notification_batches;
CREATE POLICY "Service role only batches" ON notification_batches
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- SECTION 4: DATABASE FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Description: Automatically update the updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_devices_updated_at ON user_devices;
CREATE TRIGGER update_user_devices_updated_at
    BEFORE UPDATE ON user_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Function: create_notification
-- Description: Create a notification only if user hasn't disabled that type
-- Returns: The created notification ID or NULL if preferences block it
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}',
    p_priority INTEGER DEFAULT 0,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
    v_in_app_enabled BOOLEAN := TRUE;
BEGIN
    -- Check user preferences for in-app notifications
    SELECT in_app_enabled INTO v_in_app_enabled
    FROM notification_preferences
    WHERE user_id = p_user_id 
      AND notification_type = p_type;
    
    -- If no preference exists, default to enabled
    -- If preference exists and is disabled, return NULL
    IF v_in_app_enabled = FALSE THEN
        RETURN NULL;
    END IF;
    
    -- Insert the notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        body,
        data,
        priority,
        expires_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_body,
        p_data,
        p_priority,
        p_expires_at
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: mark_notification_read
-- Description: Mark a single notification as read
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated BOOLEAN := FALSE;
BEGIN
    UPDATE notifications
    SET 
        is_read = TRUE,
        read_at = NOW()
    WHERE id = p_notification_id
      AND user_id = auth.uid()
      AND is_read = FALSE;
    
    v_updated := FOUND;
    RETURN v_updated;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: mark_notifications_read_bulk
-- Description: Mark multiple notifications as read (bulk update)
-- Supports: Array of IDs or mark all unread for user
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_notifications_read_bulk(
    p_notification_ids UUID[] DEFAULT NULL,
    p_mark_all BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF p_mark_all THEN
        -- Mark all unread notifications for the user
        UPDATE notifications
        SET 
            is_read = TRUE,
            read_at = NOW()
        WHERE user_id = auth.uid()
          AND is_read = FALSE;
    ELSIF p_notification_ids IS NOT NULL AND array_length(p_notification_ids, 1) > 0 THEN
        -- Mark specific notifications as read
        UPDATE notifications
        SET 
            is_read = TRUE,
            read_at = NOW()
        WHERE id = ANY(p_notification_ids)
          AND user_id = auth.uid()
          AND is_read = FALSE;
    END IF;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: get_unread_count
-- Description: Get count of unread notifications for a user
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM notifications
    WHERE user_id = auth.uid()
      AND is_read = FALSE
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: delete_old_notifications
-- Description: Clean up old read notifications (call via cron)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_old_notifications(
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    DELETE FROM notifications
    WHERE is_read = TRUE
      AND read_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: register_device
-- Description: Register or update a device token for push notifications
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION register_device(
    p_device_token TEXT,
    p_platform device_platform,
    p_device_name TEXT DEFAULT NULL,
    p_device_model TEXT DEFAULT NULL,
    p_os_version TEXT DEFAULT NULL,
    p_app_version TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_device_id UUID;
BEGIN
    -- Upsert device token
    INSERT INTO user_devices (
        user_id,
        device_token,
        platform,
        device_name,
        device_model,
        os_version,
        app_version,
        is_active,
        last_used_at
    ) VALUES (
        auth.uid(),
        p_device_token,
        p_platform,
        p_device_name,
        p_device_model,
        p_os_version,
        p_app_version,
        TRUE,
        NOW()
    )
    ON CONFLICT (user_id, device_token)
    DO UPDATE SET
        platform = EXCLUDED.platform,
        device_name = COALESCE(EXCLUDED.device_name, user_devices.device_name),
        device_model = COALESCE(EXCLUDED.device_model, user_devices.device_model),
        os_version = COALESCE(EXCLUDED.os_version, user_devices.os_version),
        app_version = COALESCE(EXCLUDED.app_version, user_devices.app_version),
        is_active = TRUE,
        last_used_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_device_id;
    
    RETURN v_device_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: unregister_device
-- Description: Deactivate a device token (logout, token refresh)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION unregister_device(
    p_device_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE user_devices
    SET 
        is_active = FALSE,
        updated_at = NOW()
    WHERE device_token = p_device_token
      AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: remove_invalid_device_token
-- Description: Remove invalid token (called by Edge Function on FCM error)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION remove_invalid_device_token(
    p_device_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM user_devices
    WHERE device_token = p_device_token;
    
    RETURN FOUND;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: update_notification_preferences
-- Description: Update or create user notification preferences
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_notification_preferences(
    p_notification_type notification_type,
    p_email_enabled BOOLEAN DEFAULT NULL,
    p_push_enabled BOOLEAN DEFAULT NULL,
    p_in_app_enabled BOOLEAN DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pref_id UUID;
BEGIN
    INSERT INTO notification_preferences (
        user_id,
        notification_type,
        email_enabled,
        push_enabled,
        in_app_enabled
    ) VALUES (
        auth.uid(),
        p_notification_type,
        COALESCE(p_email_enabled, TRUE),
        COALESCE(p_push_enabled, TRUE),
        COALESCE(p_in_app_enabled, TRUE)
    )
    ON CONFLICT (user_id, notification_type)
    DO UPDATE SET
        email_enabled = COALESCE(p_email_enabled, notification_preferences.email_enabled),
        push_enabled = COALESCE(p_push_enabled, notification_preferences.push_enabled),
        in_app_enabled = COALESCE(p_in_app_enabled, notification_preferences.in_app_enabled),
        updated_at = NOW()
    RETURNING id INTO v_pref_id;
    
    RETURN v_pref_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: get_user_notification_preferences
-- Description: Get all notification preferences for the current user
-- Returns default values for types without explicit preferences
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_notification_preferences()
RETURNS TABLE (
    notification_type notification_type,
    email_enabled BOOLEAN,
    push_enabled BOOLEAN,
    in_app_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.type_value AS notification_type,
        COALESCE(np.email_enabled, TRUE) AS email_enabled,
        COALESCE(np.push_enabled, TRUE) AS push_enabled,
        COALESCE(np.in_app_enabled, TRUE) AS in_app_enabled
    FROM (
        SELECT unnest(enum_range(NULL::notification_type)) AS type_value
    ) t
    LEFT JOIN notification_preferences np 
        ON np.notification_type = t.type_value 
        AND np.user_id = auth.uid();
END;
$$;

-- -----------------------------------------------------------------------------
-- Function: notify_push_dispatcher
-- Description: Trigger function to call Edge Function for push notifications
-- Uses pg_net for HTTP calls
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_push_dispatcher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_push_enabled BOOLEAN := TRUE;
    v_supabase_url TEXT;
    v_service_key TEXT;
BEGIN
    -- Check if user has push enabled for this notification type
    SELECT push_enabled INTO v_push_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id 
      AND notification_type = NEW.type;
    
    -- Default to enabled if no preference exists
    IF v_push_enabled IS NULL THEN
        v_push_enabled := TRUE;
    END IF;
    
    -- Only proceed if push is enabled
    IF v_push_enabled = TRUE THEN
        -- Get Supabase URL from environment (set in Supabase Dashboard)
        -- This will call the Edge Function
        v_supabase_url := current_setting('app.supabase_url', TRUE);
        v_service_key := current_setting('app.supabase_service_key', TRUE);
        
        -- Use pg_net to call Edge Function asynchronously
        -- Note: pg_net must be enabled in your Supabase project
        IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
            PERFORM net.http_post(
                url := v_supabase_url || '/functions/v1/push-dispatcher',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_service_key
                ),
                body := jsonb_build_object(
                    'notification_id', NEW.id,
                    'user_id', NEW.user_id,
                    'type', NEW.type,
                    'title', NEW.title,
                    'body', NEW.body,
                    'data', NEW.data
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for push notifications (optional - can also use Database Webhooks)
-- Uncomment if using pg_net trigger approach:
-- DROP TRIGGER IF EXISTS trigger_push_dispatcher ON notifications;
-- CREATE TRIGGER trigger_push_dispatcher
--     AFTER INSERT ON notifications
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_push_dispatcher();

-- ============================================================================
-- SECTION 5: HELPER VIEWS
-- ============================================================================

-- View: Recent notifications with type labels
CREATE OR REPLACE VIEW v_user_notifications AS
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.type::TEXT AS type_label,
    n.title,
    n.body,
    n.data,
    n.is_read,
    n.read_at,
    n.priority,
    n.created_at,
    CASE 
        WHEN n.created_at > NOW() - INTERVAL '1 minute' THEN 'Just now'
        WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN 
            EXTRACT(MINUTE FROM NOW() - n.created_at)::TEXT || ' min ago'
        WHEN n.created_at > NOW() - INTERVAL '1 day' THEN 
            EXTRACT(HOUR FROM NOW() - n.created_at)::TEXT || ' hours ago'
        ELSE TO_CHAR(n.created_at, 'Mon DD, YYYY')
    END AS time_ago
FROM notifications n
WHERE n.user_id = auth.uid()
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at DESC;

-- ============================================================================
-- SECTION 6: INITIAL DATA SETUP
-- ============================================================================

-- Function to initialize default preferences for new users
CREATE OR REPLACE FUNCTION initialize_user_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert default preferences for all notification types
    INSERT INTO notification_preferences (user_id, notification_type, email_enabled, push_enabled, in_app_enabled)
    SELECT 
        NEW.id,
        type_value,
        TRUE,
        TRUE,
        TRUE
    FROM (
        SELECT unnest(enum_range(NULL::notification_type)) AS type_value
    ) types
    ON CONFLICT (user_id, notification_type) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger to auto-create preferences for new users
-- Note: This trigger should be on the profiles table if you have one,
-- or you can call this function manually after user registration
-- DROP TRIGGER IF EXISTS trigger_init_notification_prefs ON auth.users;
-- CREATE TRIGGER trigger_init_notification_prefs
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION initialize_user_notification_preferences();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on types
GRANT USAGE ON TYPE notification_type TO authenticated;
GRANT USAGE ON TYPE device_platform TO authenticated;

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read_bulk TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION register_device TO authenticated;
GRANT EXECUTE ON FUNCTION unregister_device TO authenticated;
GRANT EXECUTE ON FUNCTION update_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_preferences TO authenticated;

-- Grant service role access to admin functions
GRANT EXECUTE ON FUNCTION delete_old_notifications TO service_role;
GRANT EXECUTE ON FUNCTION remove_invalid_device_token TO service_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
