/**
 * IGDB API Service
 * Handles integration with Internet Game Database (IGDB) via Supabase Edge Function
 * Documentation: https://api-docs.igdb.com/
 */

import { supabase } from '../lib/supabase';

// Removed TwitchTokenResponse - now handled by Supabase Edge Function

interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  genres?: Array<{ id: number; name: string }>;
  platforms?: Array<{ id: number; name: string }>;
  cover?: {
    id: number;
    url: string;
    image_id: string;
  };
  screenshots?: Array<{
    id: number;
    url: string;
    image_id: string;
  }>;
  rating?: number;
  rating_count?: number;
  involved_companies?: Array<{
    company: {
      id: number;
      name: string;
    };
    developer: boolean;
    publisher: boolean;
  }>;
}

class IGDBService {
  private static instance: IGDBService;

  private constructor() {}

  public static getInstance(): IGDBService {
    if (!IGDBService.instance) {
      IGDBService.instance = new IGDBService();
    }
    return IGDBService.instance;
  }

  /**
   * Make request to IGDB API via Supabase Edge Function
   * This solves the CORS issue by using our backend proxy
   */
  private async makeIGDBRequest<T>(endpoint: string, body: string): Promise<T> {
    console.log(`🌐 [IGDB] Making request to ${endpoint} via Supabase Edge Function...`);

    try {
      const { data, error } = await supabase.functions.invoke('igdb-proxy', {
        method: 'POST',
        body: body,  // Apicalypse query
        headers: {
          'Content-Type': 'text/plain',
        },
        // Pass endpoint as query parameter
        // Note: Supabase functions.invoke doesn't support query params directly,
        // so we'll append it to the function name or handle it differently
      });

      if (error) {
        console.error('❌ [IGDB] Supabase Edge Function error:', error);
        throw new Error(`IGDB proxy error: ${error.message}`);
      }

      console.log(`✅ [IGDB] Request successful via proxy, received ${Array.isArray(data) ? data.length : 1} items`);
      return data;
    } catch (error) {
      console.error('❌ [IGDB] Failed to call Edge Function:', error);
      throw error;
    }
  }

  /**
   * Make request using local proxy server to solve CORS issues
   * This is a simple and effective solution for development and production
   */
  private async makeIGDBRequestProxy<T>(endpoint: string, body: string): Promise<T> {
    // Use local proxy server for development, can be deployed to production too
    const proxyUrl = 'http://localhost:3001';
    const requestUrl = `${proxyUrl}/igdb/${endpoint}`;
    
    console.log(`🌐 [IGDB] Making request via proxy server: ${requestUrl}`);

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [IGDB] Proxy server request failed:', response.status, errorText);
        throw new Error(`Proxy server request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [IGDB] Proxy request successful, received ${Array.isArray(data) ? data.length : 1} items`);
      return data;
    } catch (error) {
      console.error('❌ [IGDB] Failed to call proxy server:', error);
      throw error;
    }
  }

  /**
   * Search for games by name
   */
  async searchGames(query: string, limit: number = 10): Promise<IGDBGame[]> {
    console.log(`🔍 [IGDB] Searching for games: "${query}"`);

    if (!query.trim()) {
      return [];
    }

    try {
      const body = `search "${query}"; fields name, summary, first_release_date, genres.name, platforms.name, cover.url, cover.image_id, rating, rating_count; limit ${limit}; where version_parent = null & category = 0;`;

      console.log('🌐 [IGDB] Request body:', body);
      const games = await this.makeIGDBRequestProxy<IGDBGame[]>('games', body);
      
      console.log(`🎮 [IGDB] Found ${games?.length || 0} games for "${query}"`);
      return games || [];
    } catch (error) {
      console.error('❌ [IGDB] Search failed:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  /**
   * Get game details by ID
   */
  async getGameById(gameId: number): Promise<IGDBGame | null> {
    console.log(`🎮 [IGDB] Getting game details for ID: ${gameId}`);

    try {
      const body = `
        fields name, summary, storyline, first_release_date, genres.name, platforms.name,
               cover.url, cover.image_id, screenshots.url, screenshots.image_id,
               rating, rating_count, involved_companies.company.name, 
               involved_companies.developer, involved_companies.publisher;
        where id = ${gameId};
      `;

      const games = await this.makeIGDBRequestProxy<IGDBGame[]>('games', body);
      
      if (!games || games.length === 0) {
        console.log(`❌ [IGDB] Game not found for ID: ${gameId}`);
        return null;
      }

      console.log(`✅ [IGDB] Retrieved game: ${games[0].name}`);
      return games[0];
    } catch (error) {
      console.error('❌ [IGDB] Failed to get game details:', error);
      throw error;
    }
  }

  /**
   * Get popular/trending games
   */
  async getPopularGames(limit: number = 20): Promise<IGDBGame[]> {
    console.log(`🔥 [IGDB] Getting popular games (limit: ${limit})`);

    try {
      const body = `fields name, summary, first_release_date, genres.name, platforms.name, cover.url, cover.image_id, rating, rating_count; where rating_count > 50 & rating > 70; sort rating desc; limit ${limit};`;

      console.log('🌐 [IGDB] Popular games request body:', body);
      const games = await this.makeIGDBRequestProxy<IGDBGame[]>('games', body);
      
      console.log(`🎮 [IGDB] Retrieved ${games?.length || 0} popular games`);
      return games || [];
    } catch (error) {
      console.error('❌ [IGDB] Failed to get popular games:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  /**
   * Get recently released games
   */
  async getRecentGames(limit: number = 20): Promise<IGDBGame[]> {
    console.log(`⏰ [IGDB] Getting recent games (limit: ${limit})`);

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = currentTimestamp - (30 * 24 * 60 * 60);

      const body = `
        fields name, summary, first_release_date, genres.name, platforms.name,
               cover.url, cover.image_id, rating, rating_count;
        where first_release_date > ${thirtyDaysAgo} & first_release_date < ${currentTimestamp};
        sort first_release_date desc;
        limit ${limit};
      `;

      const games = await this.makeIGDBRequestProxy<IGDBGame[]>('games', body);
      
      console.log(`🎮 [IGDB] Retrieved ${games?.length || 0} recent games`);
      return games || [];
    } catch (error) {
      console.error('❌ [IGDB] Failed to get recent games:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  /**
   * Format image URL from IGDB image_id
   */
  formatImageUrl(imageId: string, size: 'thumb' | 'cover_small' | 'cover_big' | 'screenshot_med' | 'screenshot_big' = 'cover_small'): string {
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
  }

  /**
   * Format release date from IGDB timestamp
   */
  formatReleaseDate(timestamp?: number): string {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).getFullYear().toString();
  }
}

export default IGDBService;
export type { IGDBGame };