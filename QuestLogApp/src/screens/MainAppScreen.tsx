import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Image } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';

const { width: screenWidth } = Dimensions.get('window');
import { useAuth } from '../context/AuthContext';
import GameSearchScreen from './GameSearchScreen';
import GameDetailsScreen from './GameDetailsScreen';
import LibraryScreen from './LibraryScreen';
import IGDBService, { IGDBGame } from '../services/IGDBService';
import UserRatingService, { UserGameLibraryEntry } from '../services/UserRatingService';

type MainAppView = 'home' | 'search' | 'library' | 'profile' | 'gameDetails';

interface LibraryGameData {
  igdbGameId: number;
  game?: IGDBGame;
  status: string;
  rating?: number;
  addedAt: string;
}

const MainAppScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<MainAppView>('home');
  const [userGames, setUserGames] = useState<LibraryGameData[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

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

  // Load library when switching to library or home view
  useEffect(() => {
    if (user && (currentView === 'library' || currentView === 'home')) {
      loadUserLibrary();
    }
  }, [user, currentView]);

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
              rating = entry.rating[0].rating;
            } else if (typeof entry.rating === 'object' && 'rating' in entry.rating) {
              rating = entry.rating.rating;
            }
          }

          gamesWithData.push({
            igdbGameId: entry.igdb_game_id,
            game: gameData || undefined,
            status: entry.status,
            rating: rating,
            addedAt: entry.added_at,
          });
        } catch (err) {
          console.error(`Failed to load game ${entry.igdb_game_id}:`, err);
        }
      }

      setUserGames(gamesWithData);
      console.log(`✅ Loaded ${gamesWithData.length} games with IGDB data`);
    } catch (error) {
      console.error('❌ Failed to load user library:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleGameSelect = (game: IGDBGame) => {
    console.log(`🎮 Opening game details: ${game.name}`);
    setSelectedGameId(game.id);
    setCurrentView('gameDetails');
  };

  const handleBackFromGameDetails = () => {
    console.log('⬅️ Returning from game details');
    setSelectedGameId(null);
    setCurrentView('search');
    // Reload library when coming back from game details
    if (user) {
      loadUserLibrary();
    }
  };

  const handleLibraryGameSelect = (gameId: number) => {
    console.log(`🎮 Game selected from library: ${gameId}`);
    setSelectedGameId(gameId);
    setCurrentView('gameDetails');
  };

  const handleSignOut = async () => {
    try {
      console.log('👋 Signing out...');
      await signOut();
    } catch (error) {
      console.error('❌ Sign out failed:', error);
    }
  };

  // Show GameDetailsScreen when a game is selected
  if (currentView === 'gameDetails' && selectedGameId) {
    return (
      <GameDetailsScreen
        gameId={selectedGameId}
        onBack={handleBackFromGameDetails}
      />
    );
  }

  if (currentView === 'search') {
    return (
      <GameSearchScreen
        onGameSelect={handleGameSelect}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'library') {
    return (
      <LibraryScreen
        onGameSelect={handleLibraryGameSelect}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Only show for home and profile views */}
      {(currentView === 'home' || currentView === 'profile') && (
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.username}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentView === 'home' && (
          <>
            {/* Stats Overview */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userGames.length}</Text>
                  <Text style={styles.statLabel}>Games</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>XP</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>1</Text>
                  <Text style={styles.statLabel}>Level</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setCurrentView('search')}
              >
                <Text style={styles.actionIcon}>🔍</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Add Game</Text>
                  <Text style={styles.actionSubtitle}>Search and log a new game</Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setCurrentView('library')}
              >
                <Text style={styles.actionIcon}>📚</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>View Library</Text>
                  <Text style={styles.actionSubtitle}>Browse your game collection</Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setCurrentView('profile')}
              >
                <Text style={styles.actionIcon}>👤</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Profile</Text>
                  <Text style={styles.actionSubtitle}>Manage your gaming profile</Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Activity */}
            <View style={styles.recentContainer}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {loadingLibrary ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={RetroTheme.colors.primary} />
                </View>
              ) : userGames.length > 0 ? (
                userGames.slice(-3).reverse().map((gameData, index) => (
                  <View key={`${gameData.igdbGameId}-${index}`} style={styles.recentItem}>
                    <Text style={styles.recentIcon}>🎮</Text>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentTitle}>
                        Added {gameData.game?.name || 'Unknown Game'}
                      </Text>
                      <Text style={styles.recentTime}>
                        {new Date(gameData.addedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRecent}>
                  <Text style={styles.emptyRecentText}>No recent activity</Text>
                  <Text style={styles.emptyRecentSubtext}>Start by adding your first game!</Text>
                </View>
              )}
            </View>
          </>
        )}

        {currentView === 'profile' && (
          <View style={styles.profileContainer}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('home')}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Profile</Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileJoined}>Joined today</Text>
            </View>

            <View style={styles.profileStats}>
              <Text style={styles.profileStatsTitle}>Gaming Stats</Text>
              <View style={styles.profileStatsGrid}>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatNumber}>{userGames.length}</Text>
                  <Text style={styles.profileStatLabel}>Games Added</Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatNumber}>0</Text>
                  <Text style={styles.profileStatLabel}>Hours Played</Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatNumber}>0</Text>
                  <Text style={styles.profileStatLabel}>Reviews Written</Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatNumber}>1</Text>
                  <Text style={styles.profileStatLabel}>Current Level</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.border,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  username: {
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: RetroTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  signOutText: {
    color: RetroTheme.colors.text,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginTop: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    padding: 20,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 25,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 18,
    color: RetroTheme.colors.textSecondary,
  },
  recentContainer: {
    marginBottom: 25,
  },
  recentItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  recentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    color: RetroTheme.colors.text,
    fontWeight: 'bold' as const,
  },
  recentTime: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center' as const,
    padding: 20,
  },
  emptyRecent: {
    alignItems: 'center' as const,
    padding: 20,
  },
  emptyRecentText: {
    fontSize: 16,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
  },
  emptyRecentSubtext: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  libraryContainer: {
    flex: 1,
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
  libraryHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  libraryTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
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
    marginRight: 12,
  },
  libraryGameCoverPlaceholder: {
    width: 70,
    height: 90,
    borderRadius: RetroTheme.borderRadius.sm,
    marginRight: 12,
    backgroundColor: RetroTheme.colors.layer1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  libraryGameCoverPlaceholderText: {
    fontSize: 28,
  },
  libraryGameInfo: {
    flex: 1,
    justifyContent: 'space-between' as const,
  },
  libraryStatusBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  libraryStatusText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  libraryRating: {
    marginTop: 4,
  },
  libraryRatingText: {
    fontSize: 14,
    color: RetroTheme.colors.secondary,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  backButtonText: {
    color: RetroTheme.colors.primary,
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 28,
  },
  libraryItem: {
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.medium,
  },
  libraryItemContent: {
    flex: 1,
  },
  libraryGameName: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    lineHeight: 18,
  },
  libraryGameDate: {
    fontSize: 10,
    color: RetroTheme.colors.textSecondary,
    marginTop: 4,
  },
  emptyLibrary: {
    alignItems: 'center' as const,
    padding: 40,
  },
  emptyLibraryText: {
    fontSize: 18,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
  },
  emptyLibrarySubtext: {
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 8,
    marginBottom: 20,
  },
  addGameButton: {
    ...RetroTheme.buttons.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RetroTheme.borderRadius.md,
  },
  addGameButtonText: {
    ...RetroTheme.text.button,
    fontSize: 16,
  },
  profileContainer: {
    paddingTop: 20,
  },
  profileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  profileInfo: {
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    alignItems: 'center' as const,
    ...RetroTheme.shadows.medium,
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  profileJoined: {
    fontSize: 12,
    color: RetroTheme.colors.textSecondary,
    marginTop: 4,
  },
  profileStats: {
    marginBottom: 20,
  },
  profileStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    marginBottom: 15,
  },
  profileStatsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  profileStatItem: {
    backgroundColor: RetroTheme.colors.layer3,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 15,
    width: (screenWidth - 60) * 0.48,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    alignItems: 'center' as const,
    ...RetroTheme.shadows.small,
  },
  profileStatNumber: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.primary,
  },
  profileStatLabel: {
    fontSize: 10,
    color: RetroTheme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
  },
};

export default MainAppScreen;