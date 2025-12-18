-- Migration: 00039_create_user_devices_table
-- Description: Create user_devices table for tracking user login devices
-- Created: 2025-12-18

-- Create ENUM for device types
DO $$ BEGIN
    CREATE TYPE device_type AS ENUM ('mobile', 'desktop', 'tablet', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Device Information
    device_type device_type NOT NULL DEFAULT 'unknown',
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    
    -- Network Information
    ip_address INET,
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- User Agent (full string for reference)
    user_agent TEXT,
    
    -- Timestamps
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Session tracking
    login_count INTEGER NOT NULL DEFAULT 1,
    is_current_device BOOLEAN DEFAULT FALSE,
    
    -- Unique constraint for deduplication
    -- Same user + OS + Browser + IP = same device
    CONSTRAINT user_devices_unique UNIQUE (user_id, os_name, browser, ip_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON user_devices(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_type ON user_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_user_devices_ip ON user_devices(ip_address);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own devices
CREATE POLICY "Users can view own devices"
    ON user_devices FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admins can view all devices
CREATE POLICY "Admins can view all devices"
    ON user_devices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: System can insert/update devices (using service role)
CREATE POLICY "Service can manage devices"
    ON user_devices FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to upsert device record
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
    -- Try to insert, on conflict update last_seen_at and increment login_count
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_user_device TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_device TO service_role;

-- Comments
COMMENT ON TABLE user_devices IS 'تتبع أجهزة تسجيل دخول المستخدمين';
COMMENT ON COLUMN user_devices.device_type IS 'نوع الجهاز: mobile, desktop, tablet, unknown';
COMMENT ON COLUMN user_devices.os_name IS 'اسم نظام التشغيل';
COMMENT ON COLUMN user_devices.browser IS 'اسم المتصفح';
COMMENT ON COLUMN user_devices.ip_address IS 'عنوان IP';
COMMENT ON COLUMN user_devices.last_seen_at IS 'آخر ظهور';
COMMENT ON COLUMN user_devices.login_count IS 'عدد مرات تسجيل الدخول من هذا الجهاز';
COMMENT ON COLUMN user_devices.is_current_device IS 'هل هذا هو الجهاز الحالي';
