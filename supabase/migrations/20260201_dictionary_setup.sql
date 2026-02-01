-- Dictionary & My Words Setup

-- 1. RLS Policies for dictionary table
ALTER TABLE dictionary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read dictionary" ON dictionary;
DROP POLICY IF EXISTS "Admin can insert dictionary" ON dictionary;
DROP POLICY IF EXISTS "Admin can update dictionary" ON dictionary;
DROP POLICY IF EXISTS "Admin can delete dictionary" ON dictionary;

CREATE POLICY "Anyone can read dictionary" ON dictionary
    FOR SELECT USING (true);

CREATE POLICY "Admin can insert dictionary" ON dictionary
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can update dictionary" ON dictionary
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can delete dictionary" ON dictionary
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. Create my_words table
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

-- 3. RLS for my_words
ALTER TABLE my_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own words" ON my_words
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own words" ON my_words
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own words" ON my_words
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own words" ON my_words
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_my_words_user_id ON my_words(user_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_word_family ON dictionary(word_family_root);
