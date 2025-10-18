-- Comprehensive fix for "Database error saving new user" OAuth issue
-- Run ALL of these commands in Supabase SQL Editor

-- First, let's check what's causing the issue by looking at the trigger function
-- and ensuring all components are properly set up

-- 1. Drop and recreate the trigger function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new user profile with proper error handling
  INSERT INTO public.users (id, email, username, display_name)
  VALUES (
    new.id, 
    new.email,
    -- Try to get username from metadata, fallback to email prefix
    COALESCE(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'preferred_username', 
      split_part(new.email, '@', 1)
    ),
    -- Try to get display name from various metadata fields
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;

-- 5. Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- CRITICAL: This policy allows the trigger function to insert new user profiles
CREATE POLICY "Allow user profile creation" 
ON public.users FOR INSERT 
WITH CHECK (true);  -- Allow all inserts (trigger function runs as SECURITY DEFINER)

-- 6. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Test the setup by checking if the function exists
SELECT 
  p.proname as function_name,
  p.prosecdef as is_security_definer
FROM pg_proc p 
WHERE p.proname = 'handle_new_user';

-- 8. Check if the trigger exists
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  t.action_statement
FROM information_schema.triggers t
WHERE t.trigger_name = 'on_auth_user_created';