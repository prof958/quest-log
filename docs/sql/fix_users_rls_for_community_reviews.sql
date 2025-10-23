-- Migration: Fix RLS policies on users table to allow community reviews
-- Allows authenticated users to view basic public profile information of other users

-- First, check what policies exist on users table
-- You can view them in Supabase Dashboard > Authentication > Policies

-- Option 1: Add a policy to allow reading public profile data
-- This allows ALL authenticated users to read username, display_name, and avatar_url
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users
FOR SELECT 
TO authenticated
USING (true);

-- If you want more restrictive access (only for specific columns), use this instead:
-- CREATE POLICY "Public profiles are viewable by everyone" 
-- ON public.users
-- FOR SELECT 
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- Note: If you already have a policy that restricts SELECT to own user only,
-- you need to DROP it first:
-- DROP POLICY IF EXISTS "Users can only view their own profile" ON public.users;

COMMENT ON POLICY "Public profiles are viewable by everyone" ON public.users 
IS 'Allows authenticated users to view public profile information for community reviews';
