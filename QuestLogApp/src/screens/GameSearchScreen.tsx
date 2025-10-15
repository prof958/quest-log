import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';
import IGDBService, { IGDBGame } from '../services/IGDBService';

interface GameSearchScreenProps {
  onGameSelect: (game: IGDBGame) => void;
  onBack?: () => void;
}

interface GameItemProps {
  game: IGDBGame;
  onSelect: (game: IGDBGame) => void;
}

const GameItem: React.FC<GameItemProps> = ({ game, onSelect }) => {
  const getCoverUrl = () => {
    if (game.cover?.url) {
      // IGDB service already provides formatted URLs
      return game.cover.url;
    }
    return null;
  };

  const getGenres = () => {
    if (game.genres && game.genres.length > 0) {
      return game.genres.slice(0, 2).map(g => g.name).join(', ');
    }
    return 'Unknown Genre';
  };

  const getReleaseYear = () => {
    if (game.first_release_date) {
      const date = new Date(game.first_release_date * 1000);
      return date.getFullYear().toString();
    }
    return 'Unknown';
  };

  const getRating = () => {
    if (game.rating) {
      return Math.round(game.rating);
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={styles.gameItem}
      onPress={() => onSelect(game)}
      activeOpacity={0.8}
    >
      <View style={styles.gameItemContent}>
        {/* Game Cover */}
        <View style={styles.coverContainer}>
          {getCoverUrl() ? (
            <Image
              source={{ uri: getCoverUrl()! }}
              style={styles.gameCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderCover}>
              <Text style={styles.placeholderText}>🎮</Text>
            </View>
          )}
        </View>

        {/* Game Info */}
        <View style={styles.gameInfo}>
          <Text style={styles.gameName} numberOfLines={2}>
            {game.name}
          </Text>
          
          <View style={styles.gameDetails}>
            <Text style={styles.gameGenre}>{getGenres()}</Text>
            <Text style={styles.gameYear}>{getReleaseYear()}</Text>
          </View>

          {game.summary && (
            <Text style={styles.gameSummary} numberOfLines={2}>
              {game.summary}
            </Text>
          )}

          <View style={styles.ratingContainer}>
            {getRating() && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{getRating()}%</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const GameSearchScreen: React.FC<GameSearchScreenProps> = ({ onGameSelect, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IGDBGame[]>([]);
  const [popularGames, setPopularGames] = useState<IGDBGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const igdbService = IGDBService.getInstance();

  useEffect(() => {
    loadPopularGames();
  }, []);

  const loadPopularGames = async () => {
    try {
      console.log('🔥 Loading popular games from IGDB...');
      setIsLoadingPopular(true);
      const games = await igdbService.getPopularGames(10);
      setPopularGames(games);
      console.log(`✅ Loaded ${games.length} popular games from IGDB`);
    } catch (error) {
      console.error('❌ Failed to load popular games:', error);
      Alert.alert(
        'Error', 
        'Unable to load popular games from IGDB. Please check your internet connection and try again.'
      );
      setPopularGames([]);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      console.log(`🔍 Searching IGDB for: "${query}"`);
      setIsLoading(true);
      const games = await igdbService.searchGames(query, 20);
      setSearchResults(games);
      console.log(`✅ IGDB search completed: ${games.length} results`);
      
      // If no results, show a helpful message
      if (games.length === 0) {
        Alert.alert(
          'No Results', 
          `No games found for "${query}" in IGDB database. Try a different search term or check the spelling.`
        );
      }
    } catch (error) {
      console.error('❌ IGDB search failed:', error);
      Alert.alert(
        'Search Error', 
        'Failed to search IGDB database. Please check your internet connection and try again.'
      );
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(text);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleGameSelect = (game: IGDBGame) => {
    console.log(`🎮 Game selected: ${game.name}`);
    onGameSelect(game);
  };

  const displayGames = searchQuery.trim() ? searchResults : popularGames;
  const displayTitle = searchQuery.trim() ? 'Search Results' : 'Popular Games';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Search Games (IGDB)</Text>
        <Text style={styles.subtitle}>500k+ games database</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for games..."
          placeholderTextColor={RetroTheme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => performSearch(searchQuery)}
        />
        {(isLoading || isLoadingPopular) && (
          <ActivityIndicator 
            style={styles.searchLoader} 
            color={RetroTheme.colors.primary} 
            size="small"
          />
        )}
      </View>

      {/* Games List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>{displayTitle}</Text>
        
        {displayGames.length > 0 ? (
          <FlatList
            data={displayGames}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <GameItem game={item} onSelect={handleGameSelect} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : !isLoading && !isLoadingPopular ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() ? 'No games found' : 'No popular games available'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery.trim() ? 'Try a different search term' : 'Check your connection and try again'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: RetroTheme.colors.background,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: RetroTheme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    position: 'relative' as const,
  },
  searchInput: {
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: RetroTheme.colors.text,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  searchLoader: {
    position: 'absolute' as const,
    right: 35,
    top: 15,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  gameItem: {
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  gameItemContent: {
    flexDirection: 'row' as const,
    padding: 12,
  },
  coverContainer: {
    marginRight: 12,
  },
  gameCover: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  placeholderCover: {
    width: 60,
    height: 80,
    backgroundColor: RetroTheme.colors.border,
    borderRadius: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  placeholderText: {
    fontSize: 24,
  },
  gameInfo: {
    flex: 1,
    justifyContent: 'space-between' as const,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    marginBottom: 4,
  },
  gameDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  gameGenre: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    flex: 1,
  },
  gameYear: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'right' as const,
  },
  gameSummary: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
  },
  ratingBadge: {
    backgroundColor: RetroTheme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
  },
};

export default GameSearchScreen;