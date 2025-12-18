-- Migration: 00040_create_visitor_devices_table
-- Description: Create visitor_devices table for tracking anonymous visitor devices
-- Created: 2025-12-18

-- Create visitor_devices table (for anonymous visitors)
CREATE TABLE IF NOT EXISTS visitor_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visitor fingerprint (unique identifier for anonymous visitors)
    visitor_id VARCHAR(64) NOT NULL, -- Generated fingerprint/cookie ID
    
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
    
    -- Page visited
    page_url TEXT,
    referrer TEXT,
    
    -- Timestamps
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Visit tracking
    visit_count INTEGER NOT NULL DEFAULT 1,
    
    -- Unique constraint for deduplication
    CONSTRAINT visitor_devices_unique UNIQUE (visitor_id, os_name, browser, ip_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitor_devices_visitor_id ON visitor_devices(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_devices_last_seen ON visitor_devices(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_devices_device_type ON visitor_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_visitor_devices_ip ON visitor_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_devices_first_seen ON visitor_devices(first_seen_at DESC);

-- Enable RLS
ALTER TABLE visitor_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all visitor devices
CREATE POLICY "Admins can view all visitor devices"
    ON visitor_devices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Anyone can insert (for anonymous tracking)
CREATE POLICY "Anyone can insert visitor devices"
    ON visitor_devices FOR INSERT
    WITH CHECK (true);

-- Policy: System can manage visitor devices
CREATE POLICY "System can manage visitor devices"
    ON visitor_devices FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to upsert visitor device record
CREATE OR REPLACE FUNCTION upsert_visitor_device(
    p_visitor_id VARCHAR(64),
    p_device_type device_type,
    p_os_name VARCHAR(100),
    p_os_version VARCHAR(50),
    p_browser VARCHAR(100),
    p_browser_version VARCHAR(50),
    p_ip_address INET,
    p_user_agent TEXT,
    p_page_url TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_country VARCHAR(100) DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    device_id UUID;
BEGIN
    INSERT INTO visitor_devices (
        visitor_id, device_type, os_name, os_version, 
        browser, browser_version, ip_address, 
        user_agent, page_url, referrer, country, city, 
        first_seen_at, last_seen_at, visit_count
    ) VALUES (
        p_visitor_id, p_device_type, p_os_name, p_os_version,
        p_browser, p_browser_version, p_ip_address,
        p_user_agent, p_page_url, p_referrer, p_country, p_city,
        NOW(), NOW(), 1
    )
    ON CONFLICT (visitor_id, os_name, browser, ip_address)
    DO UPDATE SET
        last_seen_at = NOW(),
        visit_count = visitor_devices.visit_count + 1,
        device_type = EXCLUDED.device_type,
        os_version = EXCLUDED.os_version,
        browser_version = EXCLUDED.browser_version,
        user_agent = EXCLUDED.user_agent,
        page_url = COALESCE(EXCLUDED.page_url, visitor_devices.page_url),
        referrer = COALESCE(EXCLUDED.referrer, visitor_devices.referrer),
        country = COALESCE(EXCLUDED.country, visitor_devices.country),
        city = COALESCE(EXCLUDED.city, visitor_devices.city)
    RETURNING id INTO device_id;
    
    RETURN device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_visitor_device TO anon;
GRANT EXECUTE ON FUNCTION upsert_visitor_device TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_visitor_device TO service_role;

-- Comments
COMMENT ON TABLE visitor_devices IS 'تتبع أجهزة الزوار بدون تسجيل دخول';
COMMENT ON COLUMN visitor_devices.visitor_id IS 'معرف الزائر (fingerprint أو cookie)';
COMMENT ON COLUMN visitor_devices.device_type IS 'نوع الجهاز';
COMMENT ON COLUMN visitor_devices.page_url IS 'الصفحة التي تم زيارتها';
COMMENT ON COLUMN visitor_devices.referrer IS 'مصدر الزيارة';
COMMENT ON COLUMN visitor_devices.visit_count IS 'عدد الزيارات';
