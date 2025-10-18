-- TEMPORARY: Disable RLS on users table to test OAuth
-- This will help us confirm if RLS is the issue

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test your friend's OAuth now - it should work

-- IMPORTANT: Re-enable RLS after confirming the fix works:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;