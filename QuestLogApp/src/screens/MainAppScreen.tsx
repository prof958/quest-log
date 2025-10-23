import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Image, BackHandler } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');
import { useAuth } from '../context/AuthContext';
import GameSearchScreen from './GameSearchScreen';
import GameDetailsScreen from './GameDetailsScreen';
import LibraryScreen from './LibraryScreen';
import IGDBService, { IGDBGame } from '../services/IGDBService';
import UserRatingService, { UserGameLibraryEntry } from '../services/UserRatingService';
import ActivityLogService, { ActivityLogEntry } from '../services/ActivityLogService';

type MainAppView = 'home' | 'search' | 'library' | 'profile' | 'gameDetails';

type ActivityType = 'added' | 'status_changed' | 'rated';

interface LibraryGameData {
  igdbGameId: number;
  game?: IGDBGame;
  status: string;
  rating?: number;
  review?: string;
  addedAt: string;
  activityType?: ActivityType;
  previousStatus?: string;
}

const MainAppScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<MainAppView>('home');
  const [userGames, setUserGames] = useState<LibraryGameData[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [previousView, setPreviousView] = useState<MainAppView>('search');
  const [gameCount, setGameCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<ActivityLogEntry[]>([]);

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

  const getActivityMessage = (gameData: LibraryGameData) => {
    const gameName = gameData.game?.name || 'Unknown Game';
    
    // Use the activityType we determined from timestamps
    switch (gameData.activityType) {
      case 'rated':
        const ratingText = gameData.rating ? `${gameData.rating / 2} stars` : 'No rating';
        let detail = ratingText;
        
        // If there's a review, show shortened version (max 60 chars)
        if (gameData.review && gameData.review.trim()) {
          const shortened = gameData.review.length > 60 
            ? gameData.review.substring(0, 57) + '...' 
            : gameData.review;
          detail = `${ratingText} • "${shortened}"`;
        }
        
        return {
          icon: '⭐',
          message: `Rated ${gameName}`,
          detail: detail
        };
      
      case 'status_changed':
        return {
          icon: '🔄',
          message: `Changed status of ${gameName}`,
          detail: `Now: ${getStatusLabel(gameData.status)}`
        };
      
      case 'added':
      default:
        return {
          icon: '➕',
          message: `Added ${gameName}`,
          detail: `Status: ${getStatusLabel(gameData.status)}`
        };
    }
  };

  const getActivityDisplay = (activity: ActivityLogEntry) => {
    const icons = {
      added: '➕',
      rated: '⭐',
      status_changed: '🔄'
    };
    
    const messages = {
      added: `Added ${activity.gameName}`,
      rated: `Rated ${activity.gameName}`,
      status_changed: `Changed status of ${activity.gameName}`
    };
    
    let detail = '';
    if (activity.action === 'rated' && activity.rating) {
      detail = `${activity.rating / 2} stars`;
      if (activity.review) {
        const shortened = activity.review.length > 60 
          ? activity.review.substring(0, 57) + '...' 
          : activity.review;
        detail += ` • "${shortened}"`;
      }
    } else if (activity.action === 'status_changed' && activity.status) {
      detail = `Now: ${getStatusLabel(activity.status)}`;
    } else if (activity.action === 'added' && activity.status) {
      detail = `Status: ${getStatusLabel(activity.status)}`;
    }
    
    return {
      icon: icons[activity.action],
      message: messages[activity.action],
      detail
    };
  };

  // Load library only when explicitly viewing library
  useEffect(() => {
    if (user && currentView === 'library') {
      loadUserLibrary();
    }
  }, [user, currentView]);

  // Load game count for home screen (lightweight)
  useEffect(() => {
    if (user && currentView === 'home') {
      loadGameCount();
      loadRecentActivities();
    }
  }, [user, currentView]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (currentView === 'gameDetails') {
        handleBackFromGameDetails();
        return true; // Prevent default behavior
      } else if (currentView !== 'home') {
        setCurrentView('home');
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior (exit app) when on home
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentView, previousView]);

  const loadGameCount = async () => {
    if (!user) return;
    try {
      const libraryEntries = await UserRatingService.getInstance().getUserLibrary();
      setGameCount(libraryEntries.length);
    } catch (error) {
      console.error('Failed to load game count:', error);
    }
  };

  const loadRecentActivities = async () => {
    if (!user) return;
    try {
      const activities = await ActivityLogService.getInstance().getActivities(user.id);
      setRecentActivities(activities);
      console.log(`✅ Loaded ${activities.length} recent activities`);
    } catch (error) {
      console.error('Failed to load recent activities:', error);
    }
  };

  const loadUserLibrary = async () => {
    if (!user) return;

    try {
      console.log('📚 Loading user library from database...');
      setLoadingLibrary(true);
      
      // Try to load from cache first for instant display
      const cachedData = await AsyncStorage.getItem(`library_${user.id}`);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setUserGames(cached);
        console.log('✅ Loaded from cache:', cached.length, 'games');
      }
      
      // Get library entries from database
      const libraryEntries = await UserRatingService.getInstance().getUserLibrary();
      console.log(`✅ Found ${libraryEntries.length} games in library`);

      if (libraryEntries.length === 0) {
        setUserGames([]);
        await AsyncStorage.removeItem(`library_${user.id}`);
        return;
      }

      // Fetch IGDB data with parallel requests (limit to 5 concurrent)
      const igdbService = IGDBService.getInstance();
      const gamesWithData: LibraryGameData[] = [];
      const batchSize = 5;

      for (let i = 0; i < libraryEntries.length; i += batchSize) {
        const batch = libraryEntries.slice(i, i + batchSize);
        const batchPromises = batch.map(async (entry) => {
          try {
            const gameData = await igdbService.getGameDetails(entry.igdb_game_id);
            
            let rating = 0;
            let ratingUpdatedAt: string | null = null;
            let review: string | undefined = undefined;
            if (entry.rating) {
              if (Array.isArray(entry.rating) && entry.rating.length > 0) {
                rating = entry.rating[0].rating;
                ratingUpdatedAt = entry.rating[0].updated_at;
                review = entry.rating[0].review;
              } else if (typeof entry.rating === 'object' && 'rating' in entry.rating) {
                rating = entry.rating.rating;
                ratingUpdatedAt = entry.rating.updated_at;
                review = entry.rating.review;
              }
            }

            // Determine activity type based on what was most recently updated
            const addedTime = new Date(entry.added_at).getTime();
            const libraryUpdatedTime = new Date(entry.updated_at).getTime();
            const timeSinceAdded = libraryUpdatedTime - addedTime;
            
            let activityType: ActivityType = 'added';
            
            // Check if there's a rating that was recently updated
            if (ratingUpdatedAt) {
              const ratingUpdatedTime = new Date(ratingUpdatedAt).getTime();
              const ratingAge = libraryUpdatedTime - ratingUpdatedTime;
              
              // If rating was updated within 60 seconds of library update, it was a rating action
              if (Math.abs(ratingAge) < 60000) {
                activityType = 'rated';
              } else if (timeSinceAdded < 10000) {
                // Entry was added recently but rating is old = new addition
                activityType = 'added';
              } else {
                // Library was updated but rating wasn't recent = status change
                activityType = 'status_changed';
              }
            } else if (timeSinceAdded < 10000) {
              // No rating and was just added = new addition
              activityType = 'added';
            } else {
              // No rating but entry was updated after being added = status change
              activityType = 'status_changed';
            }

            return {
              igdbGameId: entry.igdb_game_id,
              game: gameData || undefined,
              status: entry.status,
              rating: rating,
              review: review,
              addedAt: entry.updated_at,
              activityType: activityType,
            };
          } catch (err) {
            console.error(`Failed to load game ${entry.igdb_game_id}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        gamesWithData.push(...batchResults.filter(g => g !== null) as LibraryGameData[]);
        
        // Update UI progressively
        setUserGames([...gamesWithData]);
      }

      // Cache the results
      await AsyncStorage.setItem(`library_${user.id}`, JSON.stringify(gamesWithData));
      
      console.log(`✅ Loaded and cached ${gamesWithData.length} games`);
      
    } catch (error) {
      console.error('❌ Failed to load user library:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleGameSelect = (game: IGDBGame) => {
    console.log(`🎮 Opening game details: ${game.name}`);
    setPreviousView('search');
    setSelectedGameId(game.id);
    setCurrentView('gameDetails');
  };

  const handleBackFromGameDetails = async () => {
    console.log('⬅️ Returning from game details to:', previousView);
    setSelectedGameId(null);
    setCurrentView(previousView);
    // Invalidate cache and reload appropriate data
    if (user) {
      // Clear both cache keys to force refresh on next library view
      await AsyncStorage.removeItem(`library_${user.id}`); // MainAppScreen cache
      await AsyncStorage.removeItem(`library_full_${user.id}`); // LibraryScreen cache
      
      // Always refresh recent activities since they appear on home screen
      await loadRecentActivities();
      
      // If going back to library, reload it
      if (previousView === 'library') {
        await loadUserLibrary();
      } else {
        // For home or search views, reload game count
        await loadGameCount();
      }
    }
  };

  const handleLibraryGameSelect = (gameId: number) => {
    console.log(`🎮 Game selected from library: ${gameId}`);
    setPreviousView('library');
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
                  <Text style={styles.statNumber}>{gameCount}</Text>
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
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const display = getActivityDisplay(activity);
                  return (
                    <View key={activity.id} style={styles.recentItem}>
                      <Text style={styles.recentIcon}>{display.icon}</Text>
                      <View style={styles.recentContent}>
                        <Text style={styles.recentTitle}>
                          {display.message}
                        </Text>
                        {display.detail && (
                          <Text style={styles.recentDetail}>
                            {display.detail}
                          </Text>
                        )}
                        <Text style={styles.recentTime}>
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.welcomeBox}>
                  <Text style={styles.welcomeText}>
                    You have {gameCount} game{gameCount !== 1 ? 's' : ''} in your library.
                  </Text>
                  <Text style={styles.welcomeSubtext}>
                    Start tracking your gaming journey!
                  </Text>
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
              <Text style={styles.profileTitle}>Profile</Text>
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
    backgroundColor: RetroTheme.colors.layer3,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.small,
  },
  recentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    ...RetroTheme.text.body,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  recentDetail: {
    ...RetroTheme.text.caption,
    fontSize: 12,
    color: RetroTheme.colors.primary,
    marginTop: 2,
    fontWeight: '600' as const,
  },
  recentTime: {
    ...RetroTheme.text.caption,
    fontSize: 11,
    color: RetroTheme.colors.textSecondary,
    marginTop: 4,
  },
  welcomeBox: {
    backgroundColor: RetroTheme.colors.layer3,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 20,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    alignItems: 'center' as const,
    ...RetroTheme.shadows.small,
  },
  welcomeText: {
    ...RetroTheme.text.body,
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  welcomeSubtext: {
    ...RetroTheme.text.caption,
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
  },
  loadingContainer: {
    alignItems: 'center' as const,
    padding: 20,
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
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
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