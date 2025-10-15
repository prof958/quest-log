/**
 * IGDB Game Service
 * Uses Supabase Edge Function as proxy to access IGDB API
 * Provides comprehensive game data with user ratings integration
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
 * Uses Supabase Edge Function to bypass CORS and handle authentication
 * Now includes enhanced caching performance tracking
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

  /**
   * Get cache performance statistics
   */
  public getCacheStats() {
    const hitRate = this.cacheStats.requests > 0 
      ? ((this.cacheStats.hits + this.cacheStats.serverCacheHits) / this.cacheStats.requests * 100).toFixed(1)
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
        : '0'
    };
  }

  public static getInstance(): IGDBService {
    if (!IGDBService.instance) {
      IGDBService.instance = new IGDBService();
    }
    return IGDBService.instance;
  }

  private getCacheKey(endpoint: string, body: string): string {
    return `${endpoint}_${body}`;
  }

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  private setCache<T>(key: string, data: T, ttlMinutes: number = 60): void {
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
      const cacheKey = response.headers.get('X-Cache-Key');
      const queueSize = response.headers.get('X-Queue-Size');
      
      if (cacheStatus === 'HIT') {
        this.cacheStats.serverCacheHits++;
        console.log(`Server cache hit for ${endpoint} (${responseTime}ms, key: ${cacheKey})`);
      } else {
        this.cacheStats.misses++;
        console.log(`API call for ${endpoint} (${responseTime}ms, key: ${cacheKey}, queue: ${queueSize})`);
      }
      
      // Cache successful responses locally for faster future access
      this.setCache(this.getCacheKey(endpoint, body), data, 30); // Local cache for 30 minutes
      
      return data;
    } catch (error) {
      console.error('IGDB request failed:', error);
      throw error;
    }
  }

  /**
   * Search games by name
   */
  public async searchGames(query: string, limit: number = 20): Promise<IGDBGame[]> {
    if (!query.trim()) {
      return [];
    }

    const body = `
      search "${query}";
      fields name,summary,rating,first_release_date,cover.image_id,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher;
      where version_parent = null;
      limit ${limit};
    `.trim();

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', body);
      return this.processGames(games);
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Failed to search games. Please try again.');
    }
  }

  /**
   * Get popular/trending games
   */
  public async getPopularGames(limit: number = 20): Promise<IGDBGame[]> {
    const body = `
      fields name,summary,rating,rating_count,first_release_date,cover.image_id,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher;
      where rating >= 75 & rating_count >= 10 & version_parent = null;
      sort rating_count desc;
      limit ${limit};
    `.trim();

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', body);
      return this.processGames(games);
    } catch (error) {
      console.error('Failed to get popular games:', error);
      // Return empty array instead of throwing to provide graceful fallback
      return [];
    }
  }

  /**
   * Get game by ID with detailed information
   */
  public async getGameById(id: number): Promise<IGDBGame | null> {
    const body = `
      fields name,summary,storyline,rating,rating_count,first_release_date,
             cover.image_id,screenshots.image_id,artworks.image_id,
             genres.name,platforms.name,game_modes.name,
             involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
             release_dates.date,release_dates.platform.name,release_dates.region,
             videos.name,videos.video_id,age_ratings.category,age_ratings.rating;
      where id = ${id};
    `.trim();

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', body);
      if (games && games.length > 0) {
        return this.processGames(games)[0];
      }
      return null;
    } catch (error) {
      console.error(`Failed to get game ${id}:`, error);
      return null;
    }
  }

  /**
   * Get games by multiple IDs
   */
  public async getGamesByIds(ids: number[]): Promise<IGDBGame[]> {
    if (ids.length === 0) return [];

    const body = `
      fields name,summary,rating,first_release_date,cover.image_id,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher;
      where id = (${ids.join(',')});
    `.trim();

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', body);
      return this.processGames(games);
    } catch (error) {
      console.error('Failed to get games by IDs:', error);
      return [];
    }
  }

  /**
   * Get all available genres
   */
  public async getAllGenres(): Promise<Array<{ id: number; name: string }>> {
    const body = `
      fields name;
      sort name asc;
      limit 500;
    `.trim();

    try {
      return await this.makeIGDBRequest<Array<{ id: number; name: string }>>('genres', body);
    } catch (error) {
      console.error('Failed to get genres:', error);
      return [];
    }
  }

  /**
   * Get all available platforms
   */
  public async getAllPlatforms(): Promise<Array<{ id: number; name: string }>> {
    const body = `
      fields name;
      sort name asc;
      limit 500;
    `.trim();

    try {
      return await this.makeIGDBRequest<Array<{ id: number; name: string }>>('platforms', body);
    } catch (error) {
      console.error('Failed to get platforms:', error);
      return [];
    }
  }

  /**
   * Search games with advanced filters
   */
  public async searchGamesAdvanced(options: {
    query?: string;
    genres?: number[];
    platforms?: number[];
    minRating?: number;
    limit?: number;
  }): Promise<IGDBGame[]> {
    const { query, genres, platforms, minRating, limit = 20 } = options;
    
    let whereClause = 'version_parent = null';
    
    if (genres && genres.length > 0) {
      whereClause += ` & genres = (${genres.join(',')})`;
    }
    
    if (platforms && platforms.length > 0) {
      whereClause += ` & platforms = (${platforms.join(',')})`;
    }
    
    if (minRating) {
      whereClause += ` & rating >= ${minRating}`;
    }

    let body = `
      fields name,summary,rating,first_release_date,cover.image_id,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher;
      where ${whereClause};
      sort rating desc;
      limit ${limit};
    `.trim();

    if (query && query.trim()) {
      body = `
        search "${query}";
        ${body}
      `.trim();
    }

    try {
      const games = await this.makeIGDBRequest<IGDBGame[]>('games', body);
      return this.processGames(games);
    } catch (error) {
      console.error('Advanced search failed:', error);
      return [];
    }
  }

  /**
   * Process games data and format image URLs
   */
  private processGames(games: IGDBGame[]): IGDBGame[] {
    return games.map(game => ({
      ...game,
      cover: game.cover ? {
        ...game.cover,
        url: this.formatImageUrl(game.cover.image_id, 'cover_big'),
      } : undefined,
      screenshots: game.screenshots?.map(screenshot => ({
        ...screenshot,
        url: this.formatImageUrl(screenshot.image_id, 'screenshot_med'),
      })),
      artworks: game.artworks?.map(artwork => ({
        ...artwork,
        url: this.formatImageUrl(artwork.image_id, 'screenshot_big'),
      })),
    }));
  }

  /**
   * Format IGDB image URL with proper size
   */
  private formatImageUrl(imageId: string, size: string = 'cover_big'): string {
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('IGDB cache cleared');
  }

  /**
   * Clear local cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('Local IGDB cache cleared');
  }
}

export default IGDBService;