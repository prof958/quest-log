-- Migration: Add Detailed Rating Categories to user_game_ratings
-- Date: 2025-10-23
-- Description: Extends rating system to include 5 categories (story, gameplay, audio, visual, joy)
-- Each category rated 1-5 with 0.5 increments. Overall rating becomes calculated average.

-- Step 1: Drop all views that depend on the rating column
DROP VIEW IF EXISTS game_rating_stats;
DROP VIEW IF EXISTS recent_community_activity;

-- Step 2: Alter the rating column to support decimal values (for calculated averages)
ALTER TABLE user_game_ratings
ALTER COLUMN rating TYPE DECIMAL(3,1);

-- Step 3: Add new rating category columns
ALTER TABLE user_game_ratings
ADD COLUMN IF NOT EXISTS rating_story DECIMAL(2,1) CHECK (rating_story >= 1 AND rating_story <= 5 AND (rating_story * 2) % 1 = 0),
ADD COLUMN IF NOT EXISTS rating_gameplay DECIMAL(2,1) CHECK (rating_gameplay >= 1 AND rating_gameplay <= 5 AND (rating_gameplay * 2) % 1 = 0),
ADD COLUMN IF NOT EXISTS rating_audio DECIMAL(2,1) CHECK (rating_audio >= 1 AND rating_audio <= 5 AND (rating_audio * 2) % 1 = 0),
ADD COLUMN IF NOT EXISTS rating_visual DECIMAL(2,1) CHECK (rating_visual >= 1 AND rating_visual <= 5 AND (rating_visual * 2) % 1 = 0),
ADD COLUMN IF NOT EXISTS rating_joy DECIMAL(2,1) CHECK (rating_joy >= 1 AND rating_joy <= 5 AND (rating_joy * 2) % 1 = 0);

-- Add comments to document the rating categories
COMMENT ON COLUMN user_game_ratings.rating_story IS 'Story & Worldbuilding: Narrative depth, characters, pacing, emotional impact (1-5 with 0.5 increments)';
COMMENT ON COLUMN user_game_ratings.rating_gameplay IS 'Gameplay & Mechanics: Controls, challenge, systems, polish, replayability (1-5 with 0.5 increments)';
COMMENT ON COLUMN user_game_ratings.rating_audio IS 'Audio & Atmosphere: Music, sound design, immersion, emotional tone (1-5 with 0.5 increments)';
COMMENT ON COLUMN user_game_ratings.rating_visual IS 'Visual & Artistic Value: Style, art direction, UI, performance aesthetics (1-5 with 0.5 increments)';
COMMENT ON COLUMN user_game_ratings.rating_joy IS 'Joy Factor: Fun, addiction, moment-to-moment feel, undefinable spark (1-5 with 0.5 increments)';

-- Modify the existing rating column to be calculated from categories
-- Keep it for backward compatibility but it will store the average
COMMENT ON COLUMN user_game_ratings.rating IS 'Overall rating: Average of category ratings or user-provided overall (1-10 scale for compatibility)';

-- Create index for querying by category ratings
CREATE INDEX IF NOT EXISTS idx_user_game_ratings_categories 
ON user_game_ratings(rating_story, rating_gameplay, rating_audio, rating_visual, rating_joy);

-- Step 4: Recreate the game_rating_stats view (now compatible with DECIMAL rating type)
CREATE OR REPLACE VIEW game_rating_stats AS
SELECT 
  igdb_game_id,
  COUNT(*) as rating_count,
  ROUND(AVG(rating::numeric), 2) as average_rating,
  MODE() WITHIN GROUP (ORDER BY rating) as most_common_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating,
  COUNT(*) FILTER (WHERE rating >= 8) as excellent_count,
  COUNT(*) FILTER (WHERE rating >= 6) as good_count,
  COUNT(*) FILTER (WHERE rating < 6) as poor_count,
  -- Category averages
  ROUND(AVG(rating_story::numeric), 2) as avg_story_rating,
  ROUND(AVG(rating_gameplay::numeric), 2) as avg_gameplay_rating,
  ROUND(AVG(rating_audio::numeric), 2) as avg_audio_rating,
  ROUND(AVG(rating_visual::numeric), 2) as avg_visual_rating,
  ROUND(AVG(rating_joy::numeric), 2) as avg_joy_rating
FROM user_game_ratings 
GROUP BY igdb_game_id;

-- Step 5: Recreate the recent_community_activity view
CREATE OR REPLACE VIEW recent_community_activity AS
SELECT 
  r.id,
  r.user_id,
  r.igdb_game_id,
  r.rating,
  r.review,
  r.created_at,
  p.username,
  p.avatar_url
FROM user_game_ratings r
LEFT JOIN user_profiles p ON r.user_id = p.id
WHERE r.review IS NOT NULL
ORDER BY r.created_at DESC;

-- Update existing ratings to have default category values (optional - for existing data)
-- This sets all categories to the overall rating converted to 1-5 scale
-- Comment out if you want to leave existing ratings as overall-only
/*
UPDATE user_game_ratings 
SET 
  rating_story = LEAST(5, GREATEST(1, rating / 2.0)),
  rating_gameplay = LEAST(5, GREATEST(1, rating / 2.0)),
  rating_audio = LEAST(5, GREATEST(1, rating / 2.0)),
  rating_visual = LEAST(5, GREATEST(1, rating / 2.0)),
  rating_joy = LEAST(5, GREATEST(1, rating / 2.0))
WHERE rating IS NOT NULL 
  AND rating_story IS NULL;
*/
