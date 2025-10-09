import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  level: number;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: number;
  rawg_id: number;
  name: string;
  slug: string;
  background_image?: string;
  released?: string;
  rating?: number;
  genres?: string[];
  platforms?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserGame {
  id: string;
  user_id: string;
  game_id: number;
  status: 'want_to_play' | 'playing' | 'completed' | 'dropped' | 'on_hold';
  rating?: number;
  review?: string;
  playtime_hours?: number;
  progress_percentage?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement';
  target_value: number;
  current_value: number;
  xp_reward: number;
  is_completed: boolean;
  created_at: string;
  completed_at?: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  current_progress: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}