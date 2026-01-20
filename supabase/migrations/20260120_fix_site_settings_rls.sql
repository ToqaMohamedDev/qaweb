-- ============================================
-- Fix RLS Policies for site_settings table
-- ============================================
-- This migration adds proper RLS policies to allow
-- admins to access the site_settings table

-- First, enable RLS if not already enabled
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow admins to read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to delete site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public to read site_settings" ON public.site_settings;

-- Create policy: Allow everyone to read settings (public settings)
CREATE POLICY "Allow public to read site_settings"
ON public.site_settings
FOR SELECT
TO public
USING (true);

-- Create policy: Allow admins to insert settings
CREATE POLICY "Allow admins to insert site_settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create policy: Allow admins to update settings
CREATE POLICY "Allow admins to update site_settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create policy: Allow admins to delete settings
CREATE POLICY "Allow admins to delete site_settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Grant table permissions to authenticated and anon roles
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
