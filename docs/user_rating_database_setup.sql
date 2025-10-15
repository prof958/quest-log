-- User Rating System Database Tables
-- Run these commands in Supabase SQL editor to create the user rating system

-- 1. User Game Ratings Table
CREATE TABLE IF NOT EXISTS user_game_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  igdb_game_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  play_status TEXT NOT NULL DEFAULT 'not_played' 
    CHECK (play_status IN ('not_played', 'playing', 'completed', 'dropped', 'plan_to_play')),
  hours_played INTEGER DEFAULT 0 CHECK (hours_played >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one rating per user per game
  UNIQUE(user_id, igdb_game_id)
);

-- 2. User Game Library Table
CREATE TABLE IF NOT EXISTS user_game_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  igdb_game_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'plan_to_play'
    CHECK (status IN ('playing', 'completed', 'plan_to_play', 'dropped', 'not_played')),
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one library entry per user per game
  UNIQUE(user_id, igdb_game_id)
);

-- 3. User Profiles Table (if not already exists from auth setup)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_game_ratings_user_id ON user_game_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_ratings_igdb_game_id ON user_game_ratings(igdb_game_id);
CREATE INDEX IF NOT EXISTS idx_user_game_ratings_rating ON user_game_ratings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_game_ratings_created_at ON user_game_ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_game_library_user_id ON user_game_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_library_igdb_game_id ON user_game_library(igdb_game_id);
CREATE INDEX IF NOT EXISTS idx_user_game_library_status ON user_game_library(status);
CREATE INDEX IF NOT EXISTS idx_user_game_library_updated_at ON user_game_library(updated_at DESC);

-- 5. Update Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_game_ratings_updated_at
    BEFORE UPDATE ON user_game_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_library_updated_at
    BEFORE UPDATE ON user_game_library
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_game_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User Game Ratings Policies
CREATE POLICY "Users can view all ratings" ON user_game_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON user_game_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON user_game_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON user_game_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- User Game Library Policies
CREATE POLICY "Users can view their own library" ON user_game_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own library" ON user_game_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library" ON user_game_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own library" ON user_game_library
  FOR DELETE USING (auth.uid() = user_id);

-- User Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. Helpful Views

-- Game Rating Statistics View
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
  COUNT(*) FILTER (WHERE rating < 6) as poor_count
FROM user_game_ratings 
GROUP BY igdb_game_id;

-- User Library Statistics View
CREATE OR REPLACE VIEW user_library_stats AS
SELECT 
  user_id,
  COUNT(*) as total_games,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_games,
  COUNT(*) FILTER (WHERE status = 'playing') as currently_playing,
  COUNT(*) FILTER (WHERE status = 'plan_to_play') as planned_games,
  COUNT(*) FILTER (WHERE status = 'dropped') as dropped_games
FROM user_game_library 
GROUP BY user_id;

-- Recent Community Activity View
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

-- 8. Functions for Complex Queries

-- Function to get combined rating (IGDB + User ratings)
CREATE OR REPLACE FUNCTION get_combined_rating(
  game_igdb_id INTEGER,
  igdb_rating NUMERIC DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  user_avg NUMERIC;
  user_count INTEGER;
  combined_rating NUMERIC;
BEGIN
  -- Get user rating statistics
  SELECT AVG(rating), COUNT(*) 
  INTO user_avg, user_count
  FROM user_game_ratings 
  WHERE igdb_game_id = game_igdb_id;
  
  -- If no user ratings, return IGDB rating or 0
  IF user_count = 0 THEN
    RETURN COALESCE(igdb_rating, 0);
  END IF;
  
  -- If no IGDB rating, return user average
  IF igdb_rating IS NULL THEN
    RETURN user_avg;
  END IF;
  
  -- Weighted average: more user ratings = more weight to user rating
  -- Formula: (user_avg * user_weight + igdb_rating * igdb_weight) / total_weight
  -- user_weight increases with more ratings, max weight is 0.8
  DECLARE
    user_weight NUMERIC := LEAST(user_count::NUMERIC / 10, 0.8);
    igdb_weight NUMERIC := 1 - user_weight;
    total_weight NUMERIC := user_weight + igdb_weight;
  BEGIN
    combined_rating := (user_avg * user_weight + igdb_rating * igdb_weight) / total_weight;
    RETURN ROUND(combined_rating, 2);
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile automatically on signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. Sample Data (Optional - for testing)
-- Uncomment to insert sample data

/*
-- Insert sample user profiles (requires existing auth.users)
INSERT INTO user_profiles (id, username, full_name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'gamer1', 'Test User 1'),
  ('00000000-0000-0000-0000-000000000002', 'gamer2', 'Test User 2')
ON CONFLICT (id) DO NOTHING;

-- Insert sample ratings
INSERT INTO user_game_ratings (user_id, igdb_game_id, rating, review, play_status) VALUES
  ('00000000-0000-0000-0000-000000000001', 1942, 9, 'Amazing game! Love the story.', 'completed'),
  ('00000000-0000-0000-0000-000000000001', 1020, 8, 'Great gameplay mechanics.', 'playing'),
  ('00000000-0000-0000-0000-000000000002', 1942, 10, 'Perfect in every way!', 'completed'),
  ('00000000-0000-0000-0000-000000000002', 1020, 7, 'Good but has some issues.', 'completed')
ON CONFLICT (user_id, igdb_game_id) DO NOTHING;

-- Insert sample library entries
INSERT INTO user_game_library (user_id, igdb_game_id, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 1942, 'completed'),
  ('00000000-0000-0000-0000-000000000001', 1020, 'playing'),
  ('00000000-0000-0000-0000-000000000001', 1877, 'plan_to_play'),
  ('00000000-0000-0000-0000-000000000002', 1942, 'completed'),
  ('00000000-0000-0000-0000-000000000002', 1020, 'completed')
ON CONFLICT (user_id, igdb_game_id) DO NOTHING;
*/