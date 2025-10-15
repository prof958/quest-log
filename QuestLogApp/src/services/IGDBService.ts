/**
 * IGDB Game Service
 * Uses Supabase Edge Function as proxy to access IGDB API
 * Provides comprehensive game data with enhanced caching system
 */

// IGDB Game interface matching IGDB API response
export interface IGDBGame {
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
  release_dates?: Array<{
    id: number;
    date: number;
    platform: { id: number; name: string };
    region: number;
  }>;
  artworks?: Array<{
    id: number;
    url: string;
    image_id: string;
  }>;
  videos?: Array<{
    id: number;
    name: string;
    video_id: string;
  }>;
  age_ratings?: Array<{
    category: number;
    rating: number;
  }>;
  game_modes?: Array<{
    id: number;
    name: string;
  }>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface IGDBRequest {
  endpoint: string;
  body: string;
  method?: string;
}

/**
 * IGDB Service for comprehensive game data
 * Uses Supabase Edge Function with enhanced database caching
 */
export class IGDBService {
  private static instance: IGDBService;
  private cache = new Map<string, CacheEntry<any>>();
  private supabaseUrl: string;
  
  // Cache performance tracking
  private cacheStats = {
    hits: 0,
    misses: 0,
    requests: 0,
    serverCacheHits: 0,
    totalResponseTime: 0
  };
  
  constructor() {
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_IGDB_FUNCTION_URL || '';
    if (!this.supabaseUrl) {
      console.error('IGDB proxy URL not configured');
    }
  }

  public static getInstance(): IGDBService {
    if (!IGDBService.instance) {
      IGDBService.instance = new IGDBService();
    }
    return IGDBService.instance;
  }

  /**
   * Get comprehensive cache performance statistics
   */
  public getCacheStats() {
    const totalHits = this.cacheStats.hits + this.cacheStats.serverCacheHits;
    const hitRate = this.cacheStats.requests > 0 
      ? (totalHits / this.cacheStats.requests * 100).toFixed(1)
      : '0';
    
    const avgResponseTime = this.cacheStats.requests > 0
      ? Math.round(this.cacheStats.totalResponseTime / this.cacheStats.requests)
      : 0;

    return {
      ...this.cacheStats,
      hitRate,
      avgResponseTime,
      totalRequests: this.cacheStats.requests,
      clientCacheHitRate: this.cacheStats.requests > 0 
        ? (this.cacheStats.hits / this.cacheStats.requests * 100).toFixed(1) 
        : '0',
      serverCacheHitRate: this.cacheStats.requests > 0 
        ? (this.cacheStats.serverCacheHits / this.cacheStats.requests * 100).toFixed(1) 
        : '0',
      localCacheSize: this.cache.size,
      efficiency: totalHits > 0 ? 'Excellent' : this.cacheStats.requests < 5 ? 'Building' : 'Poor'
    };
  }

  /**
   * Clear local cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      requests: 0,
      serverCacheHits: 0,
      totalResponseTime: 0
    };
    console.log('Local IGDB cache and stats cleared');
  }

  private getCacheKey(endpoint: string, body: string): string {
    return `${endpoint}_${body}`;
  }

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  private setCache<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (ttlMinutes * 60 * 1000),
    };
    this.cache.set(key, entry);
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T>;
    if (entry && this.isValidCache(entry)) {
      return entry.data;
    }
    return null;
  }

  /**
   * Make a request to IGDB via Supabase Edge Function with enhanced caching
   */
  private async makeIGDBRequest<T>(endpoint: string, body: string): Promise<T> {
    const startTime = Date.now();
    this.cacheStats.requests++;
    
    const cacheKey = this.getCacheKey(endpoint, body);
    
    // Check local cache first
    const cached = this.getCache<T>(cacheKey);
    if (cached) {
      this.cacheStats.hits++;
      const responseTime = Date.now() - startTime;
      this.cacheStats.totalResponseTime += responseTime;
      console.log(`Client cache hit for ${endpoint} (${responseTime}ms)`);
      return cached;
    }

    if (!this.supabaseUrl) {
      throw new Error('IGDB proxy URL not configured');
    }

    const request: IGDBRequest = {
      endpoint,
      body,
      method: 'POST'
    };

    try {
      console.log(`Making IGDB request to ${endpoint}: ${body}`);
      
      const response = await fetch(this.supabaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`IGDB proxy error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      this.cacheStats.totalResponseTime += responseTime;
      
      // Check if this was a server cache hit
      const cacheStatus = response.headers.get('X-Cache');
      const serverCacheKey = response.headers.get('X-Cache-Key');
      const queueSize = response.headers.get('X-Queue-Size');
      
      if (cacheStatus === 'HIT') {
        this.cacheStats.serverCacheHits++;
        console.log(`Server cache hit for ${endpoint} (${responseTime}ms, key: ${serverCacheKey})`);
      } else {
        this.cacheStats.misses++;
        console.log(`API call for ${endpoint} (${responseTime}ms, key: ${serverCacheKey}, queue: ${queueSize || 0})`);
      }
      
      // Cache successful responses locally for faster future access
      this.setCache(cacheKey, data, 30); // Local cache for 30 minutes

      return data;
    } catch (error) {
      console.error(`Error making IGDB request to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Transform IGDB cover URL to get different sizes
   */
  private transformImageUrl(imageId: string, size: 'thumb' | 'cover_small' | 'cover_big' | 'screenshot_med' | 'screenshot_big' | '1080p' = 'cover_big'): string {
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
  }

  /**
   * Search for games by name
   */
  public async searchGames(query: string, limit: number = 10): Promise<IGDBGame[]> {
    const searchQuery = `
      search "${query}";
      fields name,summary,rating,rating_count,first_release_date,cover.image_id,genres.name,platforms.name;
      limit ${limit};
    `;

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', searchQuery);
      
      return games.map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.transformImageUrl(game.cover.image_id, 'cover_big')
        } : undefined
      }));
    } catch (error) {
      console.error('Error searching games:', error);
      throw new Error('Failed to search games');
    }
  }

  /**
   * Get popular games (high rating and rating count)
   */
  public async getPopularGames(limit: number = 20): Promise<IGDBGame[]> {
    const popularQuery = `
      fields name,summary,rating,rating_count,first_release_date,cover.image_id,genres.name,platforms.name;
      where rating >= 80 & rating_count >= 100;
      sort rating desc;
      limit ${limit};
    `;

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', popularQuery);
      
      return games.map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.transformImageUrl(game.cover.image_id, 'cover_big')
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching popular games:', error);
      throw new Error('Failed to fetch popular games');
    }
  }

  /**
   * Get trending games (recently released with good ratings)
   */
  public async getTrendingGames(limit: number = 15): Promise<IGDBGame[]> {
    const sixMonthsAgo = Math.floor((Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)) / 1000);
    
    const trendingQuery = `
      fields name,summary,rating,rating_count,first_release_date,cover.image_id,genres.name,platforms.name;
      where first_release_date >= ${sixMonthsAgo} & rating >= 70;
      sort first_release_date desc;
      limit ${limit};
    `;

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', trendingQuery);
      
      return games.map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.transformImageUrl(game.cover.image_id, 'cover_big')
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching trending games:', error);
      throw new Error('Failed to fetch trending games');
    }
  }

  /**
   * Get detailed game information by ID
   */
  public async getGameDetails(gameId: number): Promise<IGDBGame> {
    const detailsQuery = `
      fields name,summary,storyline,rating,rating_count,first_release_date,
             cover.image_id,screenshots.image_id,artworks.image_id,
             genres.name,platforms.name,game_modes.name,
             involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
             release_dates.date,release_dates.platform.name,release_dates.region,
             videos.name,videos.video_id,age_ratings.category,age_ratings.rating;
      where id = ${gameId};
    `;

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', detailsQuery);
      
      if (!games || games.length === 0) {
        throw new Error('Game not found');
      }

      const game = games[0];
      
      return {
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.transformImageUrl(game.cover.image_id, 'cover_big')
        } : undefined,
        screenshots: game.screenshots?.map(screenshot => ({
          ...screenshot,
          url: this.transformImageUrl(screenshot.image_id, 'screenshot_big')
        })),
        artworks: game.artworks?.map(artwork => ({
          ...artwork,
          url: this.transformImageUrl(artwork.image_id, '1080p')
        }))
      };
    } catch (error) {
      console.error(`Error fetching game details for ID ${gameId}:`, error);
      throw new Error('Failed to fetch game details');
    }
  }

  /**
   * Get games by genre
   */
  public async getGamesByGenre(genreName: string, limit: number = 20): Promise<IGDBGame[]> {
    const genreQuery = `
      fields name,summary,rating,rating_count,first_release_date,cover.image_id,genres.name,platforms.name;
      where genres.name ~ "${genreName}" & rating >= 60;
      sort rating desc;
      limit ${limit};
    `;

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', genreQuery);
      
      return games.map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.transformImageUrl(game.cover.image_id, 'cover_big')
        } : undefined
      }));
    } catch (error) {
      console.error(`Error fetching games by genre ${genreName}:`, error);
      throw new Error('Failed to fetch games by genre');
    }
  }

  /**
   * Get upcoming games
   */
  public async getUpcomingGames(limit: number = 15): Promise<IGDBGame[]> {
    const now = Math.floor(Date.now() / 1000);
    
    const upcomingQuery = `
      fields name,summary,rating,first_release_date,cover.image_id,genres.name,platforms.name;
      where first_release_date > ${now};
      sort first_release_date asc;
      limit ${limit};
    `;

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', upcomingQuery);
      
      return games.map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.transformImageUrl(game.cover.image_id, 'cover_big')
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching upcoming games:', error);
      throw new Error('Failed to fetch upcoming games');
    }
  }
}

export default IGDBService;