-- Run this in Supabase SQL Editor to make the user admin
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'dzggghjg@gmail.com';

-- Verify the change
SELECT id, email, name, role 
FROM profiles 
WHERE email = 'dzggghjg@gmail.com';
