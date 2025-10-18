-- Fix for "Database error saving new user" OAuth issue
-- Run this in Supabase SQL Editor

-- Add missing INSERT policy for users table
-- This allows the trigger function to create new user profiles
CREATE POLICY "Enable insert for authenticated users" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the trigger function exists and recreate if needed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username',
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();