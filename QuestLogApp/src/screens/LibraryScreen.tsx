import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';
import { useAuth } from '../context/AuthContext';
import IGDBService, { IGDBGame } from '../services/IGDBService';
import UserRatingService from '../services/UserRatingService';

interface LibraryScreenProps {
  onBack: () => void;
  onGameSelect: (gameId: number) => void;
}

interface LibraryGameData {
  igdbGameId: number;
  game?: IGDBGame;
  status: string;
  rating?: number;
  addedAt: string;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ onBack, onGameSelect }) => {
  const { user } = useAuth();
  const [userGames, setUserGames] = useState<LibraryGameData[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Helper functions for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'playing': return '#2196F3';
      case 'plan_to_play': return '#FF9800';
      case 'dropped': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'playing': return 'Playing';
      case 'plan_to_play': return 'Plan to Play';
      case 'dropped': return 'Dropped';
      default: return 'Not Played';
    }
  };

  // Load library on mount
  useEffect(() => {
    if (user) {
      loadUserLibrary();
    }
  }, [user]);

  const loadUserLibrary = async () => {
    if (!user) return;

    try {
      console.log('📚 Loading user library from database...');
      setLoadingLibrary(true);
      
      // Get library entries from database
      const libraryEntries = await UserRatingService.getInstance().getUserLibrary();
      console.log(`✅ Found ${libraryEntries.length} games in library`);

      // Fetch IGDB data for each game
      const igdbService = IGDBService.getInstance();
      const gamesWithData: LibraryGameData[] = [];

      for (const entry of libraryEntries) {
        try {
          const gameData = await igdbService.getGameDetails(entry.igdb_game_id);
          
          // Extract rating if available
          let rating = 0;
          if (entry.rating) {
            if (Array.isArray(entry.rating) && entry.rating.length > 0) {
              rating = entry.rating[0].rating || 0;
            } else if (typeof entry.rating === 'object' && 'rating' in entry.rating) {
              rating = entry.rating.rating || 0;
            }
          }

          gamesWithData.push({
            igdbGameId: entry.igdb_game_id,
            game: gameData,
            status: entry.status,
            rating: rating,
            addedAt: entry.added_at
          });
        } catch (gameError) {
          console.error(`Failed to load game ${entry.igdb_game_id}:`, gameError);
        }
      }

      setUserGames(gamesWithData);
    } catch (error) {
      console.error('Failed to load user library:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const filteredGames = userGames.filter(game => 
    libraryFilter === 'all' || game.status === libraryFilter
  );

  return (
    <View style={styles.container}>
      {/* Library Header */}
      <View style={styles.libraryHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.libraryHeaderContent}>
          <Text style={styles.libraryTitle}>My Library</Text>
          <Text style={styles.libraryCount}>{userGames.length} games</Text>
        </View>
      </View>

      {/* Filter Dropdown */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterDropdownButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <Text style={styles.filterDropdownLabel}>Filter:</Text>
          <Text style={styles.filterDropdownValue}>
            {libraryFilter === 'all' ? 'All Games' :
             libraryFilter === 'playing' ? 'Playing' :
             libraryFilter === 'completed' ? 'Completed' :
             libraryFilter === 'plan_to_play' ? 'Plan to Play' :
             'Dropped'}
          </Text>
          <Text style={styles.filterDropdownArrow}>{showFilterDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showFilterDropdown && (
          <View style={styles.filterDropdownMenu}>
            {[
              { key: 'all', label: 'All Games' },
              { key: 'playing', label: 'Playing' },
              { key: 'completed', label: 'Completed' },
              { key: 'plan_to_play', label: 'Plan to Play' },
              { key: 'dropped', label: 'Dropped' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterDropdownItem,
                  libraryFilter === option.key && styles.filterDropdownItemActive
                ]}
                onPress={() => {
                  setLibraryFilter(option.key);
                  setShowFilterDropdown(false);
                }}
              >
                <Text style={[
                  styles.filterDropdownItemText,
                  libraryFilter === option.key && styles.filterDropdownItemTextActive
                ]}>
                  {option.label}
                </Text>
                {option.key !== 'all' && (
                  <Text style={styles.filterDropdownItemCount}>
                    {userGames.filter(g => g.status === option.key).length}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* Library Content */}
      {loadingLibrary ? (
        <View style={styles.emptyLibrary}>
          <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
          <Text style={styles.emptyLibrarySubtext}>Loading your library...</Text>
        </View>
      ) : filteredGames.length > 0 ? (
        <ScrollView 
          style={styles.libraryScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.libraryScrollContent}
        >
          {filteredGames.map((gameData, index) => (
            <TouchableOpacity
              key={`${gameData.igdbGameId}-${index}`}
              style={styles.libraryGameCard}
              onPress={() => onGameSelect(gameData.igdbGameId)}
              activeOpacity={0.7}
            >
              {/* Game Cover Image */}
              {gameData.game?.cover?.url ? (
                <Image
                  source={{ uri: gameData.game.cover.url.replace('t_cover_big', 't_cover_small') }}
                  style={styles.libraryGameCover}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.libraryGameCoverPlaceholder}>
                  <Text style={styles.libraryGameCoverPlaceholderText}>🎮</Text>
                </View>
              )}
              
              {/* Game Info */}
              <View style={styles.libraryGameInfo}>
                <Text style={styles.libraryGameName} numberOfLines={2}>
                  {gameData.game?.name || 'Loading...'}
                </Text>
                
                {/* Status Badge */}
                <View style={[
                  styles.libraryStatusBadge,
                  { backgroundColor: getStatusColor(gameData.status) }
                ]}>
                  <Text style={styles.libraryStatusText}>
                    {getStatusLabel(gameData.status)}
                  </Text>
                </View>
                
                {/* Rating */}
                {gameData.rating ? (
                  <View style={styles.libraryRating}>
                    <Text style={styles.libraryRatingText}>
                      {'★'.repeat(Math.round(gameData.rating / 2))}
                      {'☆'.repeat(5 - Math.round(gameData.rating / 2))}
                    </Text>
                  </View>
                ) : null}
                
                {/* Added Date */}
                <Text style={styles.libraryGameDate}>
                  Added {new Date(gameData.addedAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyLibrary}>
          <Text style={styles.emptyLibraryText}>
            {libraryFilter === 'all' ? 'Your library is empty' : `No ${libraryFilter} games`}
          </Text>
          <Text style={styles.emptyLibrarySubtext}>
            {libraryFilter === 'all' 
              ? 'Add games to start tracking your gaming journey!' 
              : 'Try a different filter or add more games'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: RetroTheme.colors.background,
  },
  libraryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: RetroTheme.colors.layer2,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.small,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  backButtonText: {
    fontSize: 28,
    color: RetroTheme.colors.primary,
    fontWeight: 'bold' as const,
    lineHeight: 28,
  },
  libraryHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  libraryTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    lineHeight: 28,
  },
  libraryCount: {
    fontSize: 13,
    color: RetroTheme.colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: RetroTheme.colors.layer2,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.border,
  },
  filterDropdownButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.surface,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    borderRadius: RetroTheme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...RetroTheme.shadows.small,
  },
  filterDropdownLabel: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.textSecondary,
    marginRight: 8,
  },
  filterDropdownValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  filterDropdownArrow: {
    fontSize: 12,
    color: RetroTheme.colors.primary,
    marginLeft: 8,
  },
  filterDropdownMenu: {
    marginTop: 8,
    backgroundColor: RetroTheme.colors.surface,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    borderRadius: RetroTheme.borderRadius.md,
    ...RetroTheme.shadows.medium,
  },
  filterDropdownItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.border,
  },
  filterDropdownItemActive: {
    backgroundColor: RetroTheme.colors.primary + '20',
  },
  filterDropdownItemText: {
    fontSize: 14,
    color: RetroTheme.colors.text,
  },
  filterDropdownItemTextActive: {
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.primary,
  },
  filterDropdownItemCount: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.textSecondary,
    backgroundColor: RetroTheme.colors.layer3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 24,
    textAlign: 'center' as const,
  },
  libraryScroll: {
    flex: 1,
  },
  libraryScrollContent: {
    padding: 16,
  },
  libraryGameCard: {
    flexDirection: 'row' as const,
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.medium,
  },
  libraryGameCover: {
    width: 70,
    height: 90,
    borderRadius: RetroTheme.borderRadius.sm,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
  },
  libraryGameCoverPlaceholder: {
    width: 70,
    height: 90,
    borderRadius: RetroTheme.borderRadius.sm,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    backgroundColor: RetroTheme.colors.layer1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  libraryGameCoverPlaceholderText: {
    fontSize: 32,
  },
  libraryGameInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between' as const,
  },
  libraryGameName: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  libraryStatusBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  libraryStatusText: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  libraryRating: {
    marginBottom: 4,
  },
  libraryRatingText: {
    fontSize: 14,
    color: RetroTheme.colors.accent,
  },
  libraryGameDate: {
    fontSize: 11,
    color: RetroTheme.colors.textSecondary,
  },
  emptyLibrary: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },
  emptyLibraryText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyLibrarySubtext: {
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
  },
};

export default LibraryScreen;
