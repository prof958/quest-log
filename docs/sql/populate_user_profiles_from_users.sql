-- Migration: Populate user_profiles from existing users table
-- This creates user_profiles entries for users who signed up before profile setup was implemented

-- Insert profiles for users who don't have them yet
INSERT INTO user_profiles (id, username, avatar_url, full_name)
SELECT 
  u.id,
  u.username,
  u.avatar_url,
  u.display_name
FROM public.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url,
  full_name = EXCLUDED.full_name;

-- Update the handle_new_user trigger to also check public.users table
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Check if user exists in public.users table
  SELECT * INTO existing_user FROM public.users WHERE id = NEW.id;
  
  IF existing_user.id IS NOT NULL THEN
    -- User exists in public.users, use that data
    INSERT INTO user_profiles (id, username, full_name, avatar_url)
    VALUES (
      NEW.id,
      existing_user.username,
      existing_user.display_name,
      existing_user.avatar_url
    )
    ON CONFLICT (id) DO UPDATE SET
      username = COALESCE(EXCLUDED.username, user_profiles.username),
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url);
  ELSE
    -- New user, use metadata from auth.users
    INSERT INTO user_profiles (id, username, full_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Auto-creates user_profiles entry on signup, checking both public.users and auth metadata';
