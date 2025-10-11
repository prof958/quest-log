/**
 * Local Game Database Service
 * Uses a curated JSON database instead of external APIs
 * - No CORS issues
 * - No API keys needed
 * - Works offline
 * - Fast and reliable
 */

import popularGames from '../data/popular-games.json';

interface LocalGame {
  id: number;
  name: string;
  summary: string;
  genres: string[];
  platforms: string[];
  release_date: string;
  rating: number;
  cover_url: string;
}

// Convert to match IGDBGame interface for compatibility
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

class LocalGameService {
  private static instance: LocalGameService;
  private games: LocalGame[] = popularGames as LocalGame[];

  private constructor() {
    console.log(`🎮 [LocalGameService] Loaded ${this.games.length} games from local database`);
  }

  public static getInstance(): LocalGameService {
    if (!LocalGameService.instance) {
      LocalGameService.instance = new LocalGameService();
    }
    return LocalGameService.instance;
  }

  /**
   * Convert local game format to IGDB format for compatibility
   */
  private convertToIGDBFormat(localGame: LocalGame): IGDBGame {
    return {
      id: localGame.id,
      name: localGame.name,
      summary: localGame.summary,
      first_release_date: new Date(localGame.release_date).getTime() / 1000,
      genres: localGame.genres.map((genre, index) => ({ id: index + 1, name: genre })),
      platforms: localGame.platforms.map((platform, index) => ({ id: index + 1, name: platform })),
      cover: {
        id: localGame.id,
        url: localGame.cover_url,
        image_id: `game_${localGame.id}`,
      },
      rating: localGame.rating,
      rating_count: Math.floor(Math.random() * 1000) + 100, // Mock rating count
    };
  }

  /**
   * Search for games by name
   */
  async searchGames(query: string, limit: number = 10): Promise<IGDBGame[]> {
    console.log(`🔍 [LocalGameService] Searching for games: "${query}"`);

    if (!query.trim()) {
      return [];
    }

    const filteredGames = this.games
      .filter(game => 
        game.name.toLowerCase().includes(query.toLowerCase()) ||
        game.summary.toLowerCase().includes(query.toLowerCase()) ||
        game.genres.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, limit)
      .map(game => this.convertToIGDBFormat(game));

    console.log(`🎮 [LocalGameService] Found ${filteredGames.length} games for "${query}"`);
    return filteredGames;
  }

  /**
   * Get game details by ID
   */
  async getGameById(gameId: number): Promise<IGDBGame | null> {
    console.log(`🎮 [LocalGameService] Getting game details for ID: ${gameId}`);

    const game = this.games.find(g => g.id === gameId);
    if (!game) {
      console.log(`❌ [LocalGameService] Game not found for ID: ${gameId}`);
      return null;
    }

    console.log(`✅ [LocalGameService] Retrieved game: ${game.name}`);
    return this.convertToIGDBFormat(game);
  }

  /**
   * Get popular/trending games
   */
  async getPopularGames(limit: number = 20): Promise<IGDBGame[]> {
    console.log(`🔥 [LocalGameService] Getting popular games (limit: ${limit})`);

    // Sort by rating and return top games
    const popularGames = this.games
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map(game => this.convertToIGDBFormat(game));

    console.log(`🎮 [LocalGameService] Retrieved ${popularGames.length} popular games`);
    return popularGames;
  }

  /**
   * Get recently released games
   */
  async getRecentGames(limit: number = 20): Promise<IGDBGame[]> {
    console.log(`⏰ [LocalGameService] Getting recent games (limit: ${limit})`);

    // Sort by release date and return recent games
    const recentGames = this.games
      .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
      .slice(0, limit)
      .map(game => this.convertToIGDBFormat(game));

    console.log(`🎮 [LocalGameService] Retrieved ${recentGames.length} recent games`);
    return recentGames;
  }

  /**
   * Get games by genre
   */
  async getGamesByGenre(genre: string, limit: number = 20): Promise<IGDBGame[]> {
    console.log(`🏷️ [LocalGameService] Getting games by genre: ${genre}`);

    const filteredGames = this.games
      .filter(game => game.genres.some(g => g.toLowerCase() === genre.toLowerCase()))
      .slice(0, limit)
      .map(game => this.convertToIGDBFormat(game));

    console.log(`🎮 [LocalGameService] Found ${filteredGames.length} games for genre "${genre}"`);
    return filteredGames;
  }

  /**
   * Get games by platform
   */
  async getGamesByPlatform(platform: string, limit: number = 20): Promise<IGDBGame[]> {
    console.log(`🎮 [LocalGameService] Getting games by platform: ${platform}`);

    const filteredGames = this.games
      .filter(game => game.platforms.some(p => p.toLowerCase().includes(platform.toLowerCase())))
      .slice(0, limit)
      .map(game => this.convertToIGDBFormat(game));

    console.log(`🎮 [LocalGameService] Found ${filteredGames.length} games for platform "${platform}"`);
    return filteredGames;
  }

  /**
   * Get all unique genres
   */
  getAllGenres(): string[] {
    const genres = new Set<string>();
    this.games.forEach(game => {
      game.genres.forEach(genre => genres.add(genre));
    });
    return Array.from(genres).sort();
  }

  /**
   * Get all unique platforms
   */
  getAllPlatforms(): string[] {
    const platforms = new Set<string>();
    this.games.forEach(game => {
      game.platforms.forEach(platform => platforms.add(platform));
    });
    return Array.from(platforms).sort();
  }

  /**
   * Format image URL - for local database, we can use placeholder or CDN
   */
  formatImageUrl(imageId: string, size: 'thumb' | 'cover_small' | 'cover_big' | 'screenshot_med' | 'screenshot_big' = 'cover_small'): string {
    // For now, return a placeholder. In production, you could use a CDN or local images
    return `https://via.placeholder.com/264x374/6366f1/ffffff?text=${encodeURIComponent(imageId)}`;
  }

  /**
   * Format release date from timestamp or date string
   */
  formatReleaseDate(timestamp?: number | string): string {
    if (!timestamp) return 'Unknown';
    
    if (typeof timestamp === 'string') {
      return new Date(timestamp).getFullYear().toString();
    }
    
    return new Date(timestamp * 1000).getFullYear().toString();
  }

  /**
   * Add a custom game to the local database (for user-added games)
   */
  addCustomGame(gameData: Partial<LocalGame>): LocalGame {
    const newId = Math.max(...this.games.map(g => g.id)) + 1;
    const newGame: LocalGame = {
      id: newId,
      name: gameData.name || 'Unknown Game',
      summary: gameData.summary || 'No description available',
      genres: gameData.genres || ['Unknown'],
      platforms: gameData.platforms || ['Unknown'],
      release_date: gameData.release_date || new Date().toISOString().split('T')[0],
      rating: gameData.rating || 0,
      cover_url: gameData.cover_url || 'https://via.placeholder.com/264x374/6366f1/ffffff?text=No+Image',
    };

    this.games.push(newGame);
    console.log(`➕ [LocalGameService] Added custom game: ${newGame.name}`);
    return newGame;
  }
}

export default LocalGameService;
export type { IGDBGame };