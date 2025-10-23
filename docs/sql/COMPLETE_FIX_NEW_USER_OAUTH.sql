-- Comprehensive fix for "Database error saving new user" OAuth issue
-- Run ALL of these commands in Supabase SQL Editor

-- First, let's check what's causing the issue by looking at the trigger function
-- and ensuring all components are properly set up

-- 1. Drop and recreate the trigger function (SIMPLIFIED VERSION)
-- This version only creates user_profiles entry, not public.users
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create user_profiles entry with OAuth data
  -- Username is NULL so user must complete ProfileSetupScreen
  INSERT INTO user_profiles (id, avatar_url, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Don't block user creation even if profile insert fails
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure user_profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- 5. Create comprehensive RLS policies for user_profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON user_profiles FOR SELECT 
USING (true);  -- Anyone can view profiles (for community reviews)

CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

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