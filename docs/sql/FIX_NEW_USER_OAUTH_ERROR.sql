-- Fix for "Database error saving new user" OAuth issue
-- Simplifies handle_new_user trigger to avoid querying public.users table
-- Run this in Supabase SQL Editor

-- Simplified trigger that doesn't query public.users
-- Creates user_profiles entry with NULL username (forces ProfileSetupScreen)
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile entry with OAuth data
  -- Username will be NULL, forcing user through ProfileSetupScreen
  INSERT INTO user_profiles (id, avatar_url, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block signup even if profile creation fails
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Creates user_profiles entry on OAuth signup. Username set via ProfileSetupScreen.';