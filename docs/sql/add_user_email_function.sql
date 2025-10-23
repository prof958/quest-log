-- Migration: Add function to get user email from auth.users
-- This allows fetching email addresses for username fallback in community reviews

-- Create a function that returns user emails for given user IDs
CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE (id UUID, email TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER -- Run with function creator's privileges to access auth.users
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO anon;

COMMENT ON FUNCTION get_user_emails IS 'Returns email addresses for given user IDs from auth.users table';

