/**
 * User Rating Service
 * Handles user-generated ratings and reviews for games
 * Integrates with Supabase for data storage and authentication
 */

import { supabase } from '../lib/supabase';

export interface CategoryRatings {
  story?: number; // 1-5 with 0.5 increments
  gameplay?: number; // 1-5 with 0.5 increments
  audio?: number; // 1-5 with 0.5 increments
  visual?: number; // 1-5 with 0.5 increments
  joy?: number; // 1-5 with 0.5 increments
}

export interface UserGameRating {
  id: string;
  user_id: string;
  igdb_game_id: number;
  rating: number; // 1-10 scale (overall, calculated or user-provided)
  // Category ratings (1-5 scale with 0.5 increments)
  rating_story?: number;
  rating_gameplay?: number;
  rating_audio?: number;
  rating_visual?: number;
  rating_joy?: number;
  review?: string;
  play_status: 'not_played' | 'playing' | 'completed' | 'dropped' | 'plan_to_play';
  hours_played?: number;
  created_at: string;
  updated_at: string;
  // Joined user data
  user_profile?: {
    username: string;
    avatar_url?: string;
  };
}

export interface GameRatingStats {
  igdb_game_id: number;
  user_rating_average: number;
  user_rating_count: number;
  igdb_rating?: number;
  combined_rating: number; // Weighted average of IGDB + user ratings
  rating_distribution: {
    [key: number]: number; // rating -> count
  };
}

export type UserGameStatus = 'playing' | 'completed' | 'plan_to_play' | 'dropped' | 'not_played';

export interface UserGameLibraryEntry {
  id: string;
  user_id: string;
  igdb_game_id: number;
  status: UserGameStatus;
  rating?: UserGameRating;
  added_at: string;
  updated_at: string;
}

/**
 * Service for managing user ratings and game libraries
 */
export class UserRatingService {
  private static instance: UserRatingService;

  public static getInstance(): UserRatingService {
    if (!UserRatingService.instance) {
      UserRatingService.instance = new UserRatingService();
    }
    return UserRatingService.instance;
  }

  /**
   * Add or update a user's rating for a game
   * @param categoryRatings - Optional detailed category ratings (1-5 scale)
   * If provided, overall rating will be calculated as average * 2 (to maintain 1-10 scale)
   */
  public async rateGame(
    igdbGameId: number,
    rating: number,
    review?: string,
    playStatus?: UserGameRating['play_status'],
    hoursPlayed?: number,
    categoryRatings?: CategoryRatings
  ): Promise<UserGameRating | null> {
    try {
      console.log('🔧 UserRatingService.rateGame called');
      console.log('  - igdbGameId:', igdbGameId);
      console.log('  - rating:', rating);
      console.log('  - review:', review ? 'provided' : 'none');
      console.log('  - playStatus:', playStatus);
      console.log('  - categoryRatings:', categoryRatings);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('  - user:', user ? user.id : 'null');
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate overall rating from categories if provided
      let finalRating = rating;
      if (categoryRatings) {
        const categories = Object.values(categoryRatings).filter(r => r !== undefined) as number[];
        if (categories.length > 0) {
          const avgCategoryRating = categories.reduce((sum, r) => sum + r, 0) / categories.length;
          finalRating = avgCategoryRating * 2; // Convert 1-5 to 1-10 scale
          console.log('  - calculated overall from categories:', finalRating);
        }
      }

      if (finalRating < 1 || finalRating > 10) {
        throw new Error('Rating must be between 1 and 10');
      }

      console.log('📊 Checking for existing rating...');
      // Check if user already has a rating for this game
      const { data: existingRating, error: checkError } = await supabase
        .from('user_game_ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('igdb_game_id', igdbGameId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing rating:', checkError);
      }
      console.log('  - existing rating:', existingRating ? 'found' : 'none');

      const ratingData = {
        user_id: user.id,
        igdb_game_id: igdbGameId,
        rating: finalRating,
        rating_story: categoryRatings?.story,
        rating_gameplay: categoryRatings?.gameplay,
        rating_audio: categoryRatings?.audio,
        rating_visual: categoryRatings?.visual,
        rating_joy: categoryRatings?.joy,
        review,
        play_status: playStatus || 'not_played',
        hours_played: hoursPlayed,
        updated_at: new Date().toISOString(),
      };

      if (existingRating) {
        console.log('🔄 Updating existing rating...');
        // Update existing rating
        const { data, error } = await supabase
          .from('user_game_ratings')
          .update(ratingData)
          .eq('id', existingRating.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        console.log('✅ Rating updated successfully');
        return data;
      } else {
        console.log('➕ Creating new rating...');
        // Create new rating
        const { data, error } = await supabase
          .from('user_game_ratings')
          .insert({
            ...ratingData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }
        console.log('✅ Rating created successfully');
        
        // Also add to user's library if not already there
        console.log('📚 Adding to library...');
        await this.addToLibrary(igdbGameId, playStatus || 'not_played');
        
        return data;
      }
    } catch (error) {
      console.error('❌ Failed to rate game:', error);
      throw error;
    }
  }

  /**
   * Get user's rating for a specific game
   */
  public async getUserRating(igdbGameId: number): Promise<UserGameRating | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_game_ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('igdb_game_id', igdbGameId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Failed to get user rating:', error);
      return null;
    }
  }

  /**
   * Get rating statistics for a game
   */
  public async getGameRatingStats(igdbGameId: number): Promise<GameRatingStats | null> {
    try {
      // Get user ratings stats
      const { data: userRatings, error } = await supabase
        .from('user_game_ratings')
        .select('rating')
        .eq('igdb_game_id', igdbGameId);

      if (error) throw error;

      if (!userRatings || userRatings.length === 0) {
        return {
          igdb_game_id: igdbGameId,
          user_rating_average: 0,
          user_rating_count: 0,
          combined_rating: 0,
          rating_distribution: {},
        };
      }

      // Calculate statistics
      const ratings = userRatings.map(r => r.rating);
      const userRatingAverage = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      const userRatingCount = ratings.length;

      // Calculate rating distribution
      const ratingDistribution: { [key: number]: number } = {};
      ratings.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });

      // For now, combined rating is just user rating
      // Later we can implement weighted combination with IGDB rating
      const combinedRating = userRatingAverage;

      return {
        igdb_game_id: igdbGameId,
        user_rating_average: userRatingAverage,
        user_rating_count: userRatingCount,
        combined_rating: combinedRating,
        rating_distribution: ratingDistribution,
      };
    } catch (error) {
      console.error('Failed to get game rating stats:', error);
      return null;
    }
  }

  /**
   * Get recent ratings and reviews from community
   */
  public async getCommunityReviews(
    igdbGameId: number,
    limit: number = 10
  ): Promise<UserGameRating[]> {
    try {
      // Use RPC or manual join since the foreign key relationship isn't auto-detected
      const { data, error } = await supabase
        .from('user_game_ratings')
        .select(`
          *
        `)
        .eq('igdb_game_id', igdbGameId)
        .not('review', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Manually fetch user profiles for each review
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))]; // Remove duplicates
        
        console.log('🔍 Fetching user data for IDs:', userIds);
        
        // Fetch from user_profiles (public table, no RLS restrictions for viewing)
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('Failed to fetch user profiles:', profilesError);
        }
        
        console.log('📋 user_profiles query result:', profiles);
        
        // Merge profiles into reviews
        const reviewsWithProfiles = data.map(review => {
          const profile = profiles?.find(p => p.id === review.user_id);
          
          // Determine display name: username -> full_name -> 'Anonymous'
          let displayName = 'Anonymous';
          let avatarUrl = null;
          
          if (profile) {
            if (profile.username && profile.username.trim()) {
              displayName = profile.username;
            } else if (profile.full_name && profile.full_name.trim()) {
              displayName = profile.full_name;
            }
            avatarUrl = profile.avatar_url;
          }
          
          console.log('👤 Review user mapping:', {
            userId: review.user_id,
            username: profile?.username,
            fullName: profile?.full_name,
            finalDisplayName: displayName
          });
          
          return {
            ...review,
            user_profiles: {
              id: review.user_id,
              username: displayName,
              avatar_url: avatarUrl
            }
          };
        });
        
        return reviewsWithProfiles as any;
      }
      
      return data as any || [];
    } catch (error) {
      console.error('Failed to get community reviews:', error);
      return [];
    }
  }

  /**
   * Add game to user's library
   */
  public async addToLibrary(
    igdbGameId: number,
    status: UserGameLibraryEntry['status']
  ): Promise<UserGameLibraryEntry | null> {
    try {
      console.log('🔧 UserRatingService.addToLibrary called');
      console.log('  - igdbGameId:', igdbGameId);
      console.log('  - status:', status);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('  - user:', user ? user.id : 'null');
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('📊 Checking if game is already in library...');
      // Check if already in library
      const { data: existing, error: checkError } = await supabase
        .from('user_game_library')
        .select('*')
        .eq('user_id', user.id)
        .eq('igdb_game_id', igdbGameId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking library:', checkError);
      }
      console.log('  - existing entry:', existing ? 'found' : 'none');

      const libraryData = {
        user_id: user.id,
        igdb_game_id: igdbGameId,
        status,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        console.log('🔄 Updating existing library entry...');
        // Update existing entry
        const { data, error } = await supabase
          .from('user_game_library')
          .update(libraryData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        console.log('✅ Library entry updated successfully');
        return data;
      } else {
        console.log('➕ Creating new library entry...');
        // Create new entry
        const { data, error } = await supabase
          .from('user_game_library')
          .insert({
            ...libraryData,
            added_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Insert error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
        console.log('✅ Library entry created successfully');
        return data;
      }
    } catch (error) {
      console.error('❌ Failed to add to library:', error);
      throw error;
    }
  }

  /**
   * Get user's game library
   */
  public async getUserLibrary(
    status?: UserGameLibraryEntry['status']
  ): Promise<UserGameLibraryEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First, get library entries
      let query = supabase
        .from('user_game_library')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: libraryData, error: libraryError } = await query;
      if (libraryError) throw libraryError;
      if (!libraryData || libraryData.length === 0) return [];

      // Then, get all ratings for this user
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_game_ratings')
        .select('*')
        .eq('user_id', user.id);

      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
      }

      // Merge library and ratings data
      const result = libraryData.map(library => {
        const rating = ratingsData?.find(r => r.igdb_game_id === library.igdb_game_id);
        return {
          ...library,
          rating: rating || undefined,
        };
      });

      return result;
    } catch (error) {
      console.error('Failed to get user library:', error);
      return [];
    }
  }

  /**
   * Remove game from user's library
   */
  public async removeFromLibrary(igdbGameId: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_game_library')
        .delete()
        .eq('user_id', user.id)
        .eq('igdb_game_id', igdbGameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to remove from library:', error);
      return false;
    }
  }

  /**
   * Delete user's rating for a game
   */
  public async deleteRating(igdbGameId: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_game_ratings')
        .delete()
        .eq('user_id', user.id)
        .eq('igdb_game_id', igdbGameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete rating:', error);
      return false;
    }
  }

  /**
   * Get top rated games by community
   */
  public async getTopRatedGames(limit: number = 20): Promise<GameRatingStats[]> {
    try {
      // This would be better implemented as a database view or function
      // For now, we'll get all ratings and calculate averages
      const { data: ratings, error } = await supabase
        .from('user_game_ratings')
        .select('igdb_game_id, rating')
        .order('rating', { ascending: false });

      if (error) throw error;
      if (!ratings) return [];

      // Group by game and calculate averages
      const gameStats = new Map<number, { total: number; count: number; ratings: number[] }>();
      
      ratings.forEach(rating => {
        const current = gameStats.get(rating.igdb_game_id) || { total: 0, count: 0, ratings: [] };
        current.total += rating.rating;
        current.count += 1;
        current.ratings.push(rating.rating);
        gameStats.set(rating.igdb_game_id, current);
      });

      // Convert to GameRatingStats and sort by average
      const results: GameRatingStats[] = Array.from(gameStats.entries())
        .filter(([_, stats]) => stats.count >= 3) // Minimum 3 ratings
        .map(([igdbGameId, stats]) => {
          const average = stats.total / stats.count;
          const ratingDistribution: { [key: number]: number } = {};
          stats.ratings.forEach(rating => {
            ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
          });

          return {
            igdb_game_id: igdbGameId,
            user_rating_average: average,
            user_rating_count: stats.count,
            combined_rating: average,
            rating_distribution: ratingDistribution,
          };
        })
        .sort((a, b) => b.user_rating_average - a.user_rating_average)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Failed to get top rated games:', error);
      return [];
    }
  }
  /**
   * Get user's game library entry for a specific game
   */
  public async getUserGame(igdbGameId: number): Promise<UserGameLibraryEntry | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get library entry
      const { data: libraryData, error: libraryError } = await supabase
        .from('user_game_library')
        .select('*')
        .eq('user_id', user.id)
        .eq('igdb_game_id', igdbGameId)
        .single();

      if (libraryError && libraryError.code !== 'PGRST116') { // Not found error
        throw libraryError;
      }

      if (!libraryData) return null;

      // Get rating for this game
      const { data: ratingData } = await supabase
        .from('user_game_ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('igdb_game_id', igdbGameId)
        .single();

      // Merge library and rating data
      return {
        ...libraryData,
        rating: ratingData || undefined,
      };
    } catch (error) {
      console.error('Failed to get user game:', error);
      return null;
    }
  }

  /**
   * Add game to user's library (alias for addToLibrary)
   */
  public async addGameToLibrary(
    igdbGameId: number,
    status: UserGameLibraryEntry['status']
  ): Promise<UserGameLibraryEntry | null> {
    return this.addToLibrary(igdbGameId, status);
  }

  /**
   * Remove game from user's library (alias for removeFromLibrary)
   */
  public async removeGameFromLibrary(igdbGameId: number): Promise<boolean> {
    return this.removeFromLibrary(igdbGameId);
  }

  /**
   * Update game status in user's library
   */
  public async updateGameStatus(
    igdbGameId: number,
    status: UserGameLibraryEntry['status']
  ): Promise<UserGameLibraryEntry | null> {
    return this.addToLibrary(igdbGameId, status); // addToLibrary handles updates
  }

  /**
   * Update user's rating for a game (alias for rateGame)
   */
  public async updateGameRating(
    igdbGameId: number,
    rating: number,
    review?: string,
    playStatus?: UserGameRating['play_status'],
    hoursPlayed?: number
  ): Promise<UserGameRating | null> {
    return this.rateGame(igdbGameId, rating, review, playStatus, hoursPlayed);
  }
}

export default UserRatingService;