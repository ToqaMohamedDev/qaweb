-- Fix my_words table RLS permissions
-- Run this in Supabase SQL Editor

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS my_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL REFERENCES dictionary(concept_id) ON DELETE CASCADE,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, concept_id)
);

-- Enable RLS
ALTER TABLE my_words ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own words" ON my_words;
DROP POLICY IF EXISTS "Users can insert own words" ON my_words;
DROP POLICY IF EXISTS "Users can update own words" ON my_words;
DROP POLICY IF EXISTS "Users can delete own words" ON my_words;

-- Create RLS policies
CREATE POLICY "Users can read own words" ON my_words
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own words" ON my_words
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own words" ON my_words
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own words" ON my_words
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON my_words TO authenticated;
GRANT SELECT ON my_words TO anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_my_words_user_id ON my_words(user_id);
CREATE INDEX IF NOT EXISTS idx_my_words_concept_id ON my_words(concept_id);
CREATE INDEX IF NOT EXISTS idx_my_words_user_concept ON my_words(user_id, concept_id);
