-- QuestLog Database Schema
-- Run these commands in Supabase SQL Editor
-- Note: Skip the JWT secret line - Supabase manages this automatically

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table (cache from RAWG API)
CREATE TABLE public.games (
  id SERIAL PRIMARY KEY,
  rawg_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  background_image TEXT,
  released DATE,
  rating DECIMAL(3,2),
  genres JSONB DEFAULT '[]',
  platforms JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User games (user's game library)
CREATE TABLE public.user_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES public.games(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('want_to_play', 'playing', 'completed', 'dropped', 'on_hold')) DEFAULT 'want_to_play',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  playtime_hours DECIMAL(6,2) DEFAULT 0,
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100) DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Quests table (challenges and achievements)
CREATE TABLE public.quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('daily', 'weekly', 'monthly', 'achievement')) DEFAULT 'daily',
  target_value INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User quests (user progress on quests)
CREATE TABLE public.user_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- XP Transactions (track XP gains)
CREATE TABLE public.xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID, -- Could reference user_games.id, user_quests.id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own games" ON public.user_games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own games" ON public.user_games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own games" ON public.user_games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own games" ON public.user_games FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quests" ON public.user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON public.user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON public.user_quests FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own XP" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own XP" ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for games and quests
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Anyone can view quests" ON public.quests FOR SELECT USING (true);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Simple level formula: level = sqrt(xp / 100) + 1
  RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to add XP and update user level
CREATE OR REPLACE FUNCTION public.add_xp(user_uuid UUID, xp_amount INTEGER, xp_reason TEXT, ref_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  new_total_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Insert XP transaction
  INSERT INTO public.xp_transactions (user_id, amount, reason, reference_id)
  VALUES (user_uuid, xp_amount, xp_reason, ref_id);
  
  -- Update user's total XP
  UPDATE public.users 
  SET total_xp = total_xp + xp_amount,
      updated_at = NOW()
  WHERE id = user_uuid
  RETURNING total_xp INTO new_total_xp;
  
  -- Calculate and update new level
  SELECT public.calculate_level(new_total_xp) INTO new_level;
  
  UPDATE public.users 
  SET level = new_level,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;