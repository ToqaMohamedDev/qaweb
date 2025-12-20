-- ============================================
-- Complete User Devices Setup
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- 1. Create ENUM for device types
DO $$ BEGIN
    CREATE TYPE device_type AS ENUM ('mobile', 'desktop', 'tablet', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type device_type NOT NULL DEFAULT 'unknown',
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    ip_address INET,
    country VARCHAR(100),
    city VARCHAR(100),
    user_agent TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    login_count INTEGER NOT NULL DEFAULT 1,
    is_current_device BOOLEAN DEFAULT FALSE
);

-- 3. Add unique constraint (if not exists)
DO $$ BEGIN
    ALTER TABLE user_devices ADD CONSTRAINT user_devices_unique 
    UNIQUE (user_id, os_name, browser, ip_address);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON user_devices(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_type ON user_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_user_devices_ip ON user_devices(ip_address);

-- 5. Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- 6. Drop old policies
DROP POLICY IF EXISTS "Users can view own devices" ON user_devices;
DROP POLICY IF EXISTS "Admins can view all devices" ON user_devices;
DROP POLICY IF EXISTS "Service can manage devices" ON user_devices;

-- 7. Create new policies
CREATE POLICY "Users can view own devices"
    ON user_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all devices"
    ON user_devices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow inserts and updates from authenticated users (needed for the upsert function)
CREATE POLICY "Authenticated can insert devices"
    ON user_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated can update own devices"
    ON user_devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete devices"
    ON user_devices FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 8. Create or replace the upsert function
CREATE OR REPLACE FUNCTION upsert_user_device(
    p_user_id UUID,
    p_device_type device_type,
    p_os_name VARCHAR(100),
    p_os_version VARCHAR(50),
    p_browser VARCHAR(100),
    p_browser_version VARCHAR(50),
    p_ip_address INET,
    p_user_agent TEXT,
    p_country VARCHAR(100) DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    device_id UUID;
BEGIN
    INSERT INTO user_devices (
        user_id, device_type, os_name, os_version, 
        browser, browser_version, ip_address, 
        user_agent, country, city, 
        first_seen_at, last_seen_at, login_count
    ) VALUES (
        p_user_id, p_device_type, p_os_name, p_os_version,
        p_browser, p_browser_version, p_ip_address,
        p_user_agent, p_country, p_city,
        NOW(), NOW(), 1
    )
    ON CONFLICT (user_id, os_name, browser, ip_address)
    DO UPDATE SET
        last_seen_at = NOW(),
        login_count = user_devices.login_count + 1,
        device_type = EXCLUDED.device_type,
        os_version = EXCLUDED.os_version,
        browser_version = EXCLUDED.browser_version,
        user_agent = EXCLUDED.user_agent,
        country = COALESCE(EXCLUDED.country, user_devices.country),
        city = COALESCE(EXCLUDED.city, user_devices.city)
    RETURNING id INTO device_id;
    
    -- Mark this device as current, unmark others
    UPDATE user_devices 
    SET is_current_device = (id = device_id)
    WHERE user_id = p_user_id;
    
    RETURN device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_user_device TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_device TO service_role;

-- 10. Done!
SELECT 'User devices table setup complete!' as status;
