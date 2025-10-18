-- Verification queries to check if our security fixes are properly applied
-- Run these in Supabase SQL Editor to verify the fixes

-- Check that RLS is enabled on our tables
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('igdb_games', 'igdb_covers', 'igdb_screenshots', 'igdb_companies', 'igdb_genres', 'igdb_platforms');

-- Check that there are no views with SECURITY DEFINER
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public'
  AND definition ILIKE '%security definer%';

-- Verify our views exist and are properly created without SECURITY DEFINER
SELECT 
  schemaname,
  viewname
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN ('enhanced_games_view', 'games_with_metadata_view', 'popular_games_view');

-- Check RLS policies exist for our tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('igdb_games', 'igdb_covers', 'igdb_screenshots', 'igdb_companies', 'igdb_genres', 'igdb_platforms');