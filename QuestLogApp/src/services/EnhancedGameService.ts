import { IGDBGame } from './LocalGameService';

// RAWG API Configuration
const RAWG_BASE_URL = 'https://api.rawg.io/api';
const RAWG_API_KEY = process.env.EXPO_PUBLIC_RAWG_API_KEY || '';

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MONTH: 18000, // Leave buffer from 20k limit
  MAX_REQUESTS_PER_HOUR: 200,    // Conservative hourly limit
  MAX_REQUESTS_PER_MINUTE: 5,    // Prevent burst requests
};

interface RAWGGame {
  id: number;
  name: string;
  background_image?: string;
  metacritic?: number;
  rating: number;
  rating_top: number;
  released?: string;
  genres?: Array<{ id: number; name: string }>;
  platforms?: Array<{
    platform: { id: number; name: string };
    released_at?: string;
  }>;
  short_screenshots?: Array<{ image: string }>;
  description_raw?: string;
  esrb_rating?: { name: string };
}

interface RAWGSearchResponse {
  count: number;
  results: RAWGGame[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface UsageTracking {
  requestsThisMonth: number;
  requestsThisHour: number;
  requestsThisMinute: number;
  lastResetMonth: number;
  lastResetHour: number;
  lastResetMinute: number;
}

/**
 * Enhanced Game Service combining local database with RAWG API
 * Provides comprehensive game search with intelligent caching and rate limiting
 */
export class EnhancedGameService {
  private static instance: EnhancedGameService;
  private cache = new Map<string, CacheEntry<any>>();
  private usageTracking: UsageTracking = {
    requestsThisMonth: 0,
    requestsThisHour: 0,
    requestsThisMinute: 0,
    lastResetMonth: new Date().getMonth(),
    lastResetHour: new Date().getHours(),
    lastResetMinute: new Date().getMinutes(),
  };
  
  // Import local games from existing service
  private localGames: IGDBGame[] = [];

  constructor() {
    this.initializeUsageTracking();
    this.loadLocalGames();
  }

  public static getInstance(): EnhancedGameService {
    if (!EnhancedGameService.instance) {
      EnhancedGameService.instance = new EnhancedGameService();
    }
    return EnhancedGameService.instance;
  }

  private initializeUsageTracking(): void {
    const stored = localStorage.getItem('rawg-usage-tracking');
    if (stored) {
      this.usageTracking = JSON.parse(stored);
    } else {
      this.usageTracking = {
        requestsThisMonth: 0,
        requestsThisHour: 0,
        requestsThisMinute: 0,
        lastResetMonth: new Date().getMonth(),
        lastResetHour: new Date().getHours(),
        lastResetMinute: new Date().getMinutes(),
      };
    }
    this.resetCountersIfNeeded();
  }

  private resetCountersIfNeeded(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Reset monthly counter
    if (currentMonth !== this.usageTracking.lastResetMonth) {
      this.usageTracking.requestsThisMonth = 0;
      this.usageTracking.lastResetMonth = currentMonth;
    }

    // Reset hourly counter
    if (currentHour !== this.usageTracking.lastResetHour) {
      this.usageTracking.requestsThisHour = 0;
      this.usageTracking.lastResetHour = currentHour;
    }

    // Reset minute counter
    if (currentMinute !== this.usageTracking.lastResetMinute) {
      this.usageTracking.requestsThisMinute = 0;
      this.usageTracking.lastResetMinute = currentMinute;
    }

    this.saveUsageTracking();
  }

  private saveUsageTracking(): void {
    localStorage.setItem('rawg-usage-tracking', JSON.stringify(this.usageTracking));
  }

  private canMakeAPIRequest(): boolean {
    this.resetCountersIfNeeded();
    
    return (
      this.usageTracking.requestsThisMonth < RATE_LIMIT.MAX_REQUESTS_PER_MONTH &&
      this.usageTracking.requestsThisHour < RATE_LIMIT.MAX_REQUESTS_PER_HOUR &&
      this.usageTracking.requestsThisMinute < RATE_LIMIT.MAX_REQUESTS_PER_MINUTE
    );
  }

  private incrementUsageCounters(): void {
    this.usageTracking.requestsThisMonth++;
    this.usageTracking.requestsThisHour++;
    this.usageTracking.requestsThisMinute++;
    this.saveUsageTracking();
  }

  private async loadLocalGames(): Promise<void> {
    try {
      // Import from existing LocalGameService popular games
      const LocalGameService = await import('./LocalGameService');
      const localService = LocalGameService.default.getInstance();
      this.localGames = await localService.getPopularGames(100);
    } catch (error) {
      console.error('Failed to load local games:', error);
      this.localGames = [];
    }
  }

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}_${JSON.stringify(params)}`;
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
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem(`rawg-cache-${key}`, JSON.stringify(entry));
    } catch (error) {
      // Handle storage quota exceeded
      console.warn('Cache storage full, clearing old entries');
      this.clearOldCacheEntries();
    }
  }

  private getCache<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.cache.get(key) as CacheEntry<T>;
    if (memoryEntry && this.isValidCache(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check localStorage cache
    try {
      const stored = localStorage.getItem(`rawg-cache-${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValidCache(entry)) {
          // Restore to memory cache
          this.cache.set(key, entry);
          return entry.data;
        } else {
          // Remove expired entry
          localStorage.removeItem(`rawg-cache-${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read cache:', error);
    }

    return null;
  }

  private clearOldCacheEntries(): void {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('rawg-cache-'));
    
    // Sort by age and remove oldest entries
    const entries = cacheKeys.map(key => ({
      key,
      entry: JSON.parse(localStorage.getItem(key) || '{}'),
    }));
    
    entries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.25));
    toRemove.forEach(({ key }) => {
      localStorage.removeItem(key);
      this.cache.delete(key.replace('rawg-cache-', ''));
    });
  }

  private convertRAWGToIGDB(rawgGame: RAWGGame): IGDBGame {
    return {
      id: rawgGame.id,
      name: rawgGame.name,
      summary: rawgGame.description_raw || '',
      rating: rawgGame.rating * 20, // Convert 0-5 to 0-100
      first_release_date: rawgGame.released ? 
        Math.floor(new Date(rawgGame.released).getTime() / 1000) : undefined,
      cover: rawgGame.background_image ? {
        id: rawgGame.id,
        url: rawgGame.background_image,
        image_id: rawgGame.id.toString(),
      } : undefined,
      genres: rawgGame.genres?.map(g => ({ id: g.id, name: g.name })),
      platforms: rawgGame.platforms?.map(p => ({
        id: p.platform.id,
        name: p.platform.name,
      })),
      screenshots: rawgGame.short_screenshots?.map((s, index) => ({ 
        id: index,
        url: s.image,
        image_id: `${rawgGame.id}_${index}`,
      })),
    };
  }

  private async makeRAWGRequest<T>(endpoint: string, params: any = {}): Promise<T> {
    if (!RAWG_API_KEY) {
      throw new Error('RAWG API key not configured');
    }

    if (!this.canMakeAPIRequest()) {
      throw new Error('API rate limit exceeded');
    }

    const url = new URL(`${RAWG_BASE_URL}${endpoint}`);
    url.searchParams.append('key', RAWG_API_KEY);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    try {
      this.incrementUsageCounters();
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`RAWG API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('RAWG API request failed:', error);
      throw error;
    }
  }

  /**
   * Search games with hybrid local/RAWG approach
   */
  public async searchGames(query: string, limit: number = 20): Promise<IGDBGame[]> {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    
    // First, search local games for instant results
    const localResults = this.localGames.filter(game =>
      game.name.toLowerCase().includes(normalizedQuery)
    ).slice(0, 5); // Limit local results to make room for API results

    // Check cache for this search
    const cacheKey = this.getCacheKey('/games', { search: query, page_size: limit });
    const cachedResults = this.getCache<IGDBGame[]>(cacheKey);
    
    if (cachedResults) {
      // Combine local results with cached API results, avoiding duplicates
      const combinedResults = [...localResults];
      const localIds = new Set(localResults.map(g => g.id));
      
      cachedResults.forEach(game => {
        if (!localIds.has(game.id) && combinedResults.length < limit) {
          combinedResults.push(game);
        }
      });
      
      return combinedResults;
    }

    // If we can make API requests, search RAWG
    if (this.canMakeAPIRequest()) {
      try {
        const response = await this.makeRAWGRequest<RAWGSearchResponse>('/games', {
          search: query,
          page_size: limit,
        });

        const apiResults = response.results.map(game => this.convertRAWGToIGDB(game));
        
        // Cache the API results
        this.setCache(cacheKey, apiResults, 60); // Cache for 1 hour
        
        // Combine results, avoiding duplicates
        const combinedResults = [...localResults];
        const localIds = new Set(localResults.map(g => g.id));
        
        apiResults.forEach(game => {
          if (!localIds.has(game.id) && combinedResults.length < limit) {
            combinedResults.push(game);
          }
        });
        
        return combinedResults;
      } catch (error) {
        console.warn('RAWG API search failed, using local results only:', error);
        return localResults;
      }
    }

    // Fallback to local results only
    return localResults;
  }

  /**
   * Get popular games (enhanced with RAWG data)
   */
  public async getPopularGames(limit: number = 20): Promise<IGDBGame[]> {
    // Start with local popular games for instant response
    const localResults = this.localGames.slice(0, Math.min(limit, 10));
    
    // Check cache for popular games from RAWG
    const cacheKey = this.getCacheKey('/games', { 
      ordering: '-rating',
      page_size: limit,
      metacritic: '70,100' // Only high-rated games
    });
    
    const cachedResults = this.getCache<IGDBGame[]>(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    // Fetch from RAWG if possible
    if (this.canMakeAPIRequest()) {
      try {
        const response = await this.makeRAWGRequest<RAWGSearchResponse>('/games', {
          ordering: '-rating',
          page_size: limit,
          metacritic: '70,100',
        });

        const apiResults = response.results.map(game => this.convertRAWGToIGDB(game));
        
        // Cache results for 24 hours
        this.setCache(cacheKey, apiResults, 1440);
        
        return apiResults;
      } catch (error) {
        console.warn('Failed to fetch popular games from RAWG:', error);
        return localResults;
      }
    }

    return localResults;
  }

  /**
   * Get game details by ID
   */
  public async getGameDetails(id: number): Promise<IGDBGame | null> {
    // Check local games first
    const localGame = this.localGames.find(game => game.id === id);
    if (localGame) {
      return localGame;
    }

    // Check cache
    const cacheKey = this.getCacheKey(`/games/${id}`, {});
    const cachedGame = this.getCache<IGDBGame>(cacheKey);
    if (cachedGame) {
      return cachedGame;
    }

    // Fetch from RAWG
    if (this.canMakeAPIRequest()) {
      try {
        const rawgGame = await this.makeRAWGRequest<RAWGGame>(`/games/${id}`, {});
        const game = this.convertRAWGToIGDB(rawgGame);
        
        // Cache for 24 hours
        this.setCache(cacheKey, game, 1440);
        
        return game;
      } catch (error) {
        console.warn(`Failed to fetch game details for ID ${id}:`, error);
        return null;
      }
    }

    return null;
  }

  /**
   * Get usage statistics for monitoring
   */
  public getUsageStats() {
    this.resetCountersIfNeeded();
    return {
      monthly: {
        used: this.usageTracking.requestsThisMonth,
        limit: RATE_LIMIT.MAX_REQUESTS_PER_MONTH,
        percentage: (this.usageTracking.requestsThisMonth / RATE_LIMIT.MAX_REQUESTS_PER_MONTH) * 100,
      },
      hourly: {
        used: this.usageTracking.requestsThisHour,
        limit: RATE_LIMIT.MAX_REQUESTS_PER_HOUR,
      },
    };
  }
}

export default EnhancedGameService;