import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';
import { useAuth } from '../context/AuthContext';
import GameSearchScreen from './GameSearchScreen';
import { IGDBGame } from '../services/IGDBService';

type MainAppView = 'home' | 'search' | 'library' | 'profile';

const MainAppScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<MainAppView>('home');
  const [userGames, setUserGames] = useState<IGDBGame[]>([]);

  const handleGameSelect = (game: IGDBGame) => {
    console.log(`🎮 Adding game to library: ${game.name}`);
    // TODO: Implement Supabase database integration for user game library
    // This will be handled in the next iteration
    setUserGames(prev => [...prev, game]);
    setCurrentView('library');
  };

  const handleSignOut = async () => {
    try {
      console.log('👋 Signing out...');
      await signOut();
    } catch (error) {
      console.error('❌ Sign out failed:', error);
    }
  };

  if (currentView === 'search') {
    return (
      <GameSearchScreen
        onGameSelect={handleGameSelect}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.username}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

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
              {userGames.length > 0 ? (
                userGames.slice(-3).reverse().map((game, index) => (
                  <View key={`${game.id}-${index}`} style={styles.recentItem}>
                    <Text style={styles.recentIcon}>🎮</Text>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentTitle}>Added {game.name}</Text>
                      <Text style={styles.recentTime}>Just now</Text>
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

        {currentView === 'library' && (
          <View style={styles.libraryContainer}>
            <View style={styles.libraryHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('home')}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>My Library</Text>
            </View>
            
            {userGames.length > 0 ? (
              userGames.map((game, index) => (
                <View key={`${game.id}-${index}`} style={styles.libraryItem}>
                  <Text style={styles.libraryGameName}>{game.name}</Text>
                  <Text style={styles.libraryGameInfo}>
                    Added to library • Just now
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyLibrary}>
                <Text style={styles.emptyLibraryText}>Your library is empty</Text>
                <Text style={styles.emptyLibrarySubtext}>Add games to start tracking your gaming journey!</Text>
                <TouchableOpacity
                  style={styles.addGameButton}
                  onPress={() => setCurrentView('search')}
                >
                  <Text style={styles.addGameButtonText}>Add Your First Game</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {currentView === 'profile' && (
          <View style={styles.profileContainer}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('home')}
              >
                <Text style={styles.backButtonText}>← Back</Text>
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
    paddingBottom: 20,
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
    fontSize: 18,
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
    paddingTop: 20,
  },
  libraryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: RetroTheme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  libraryItem: {
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
  },
  libraryGameName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  libraryGameInfo: {
    fontSize: 12,
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
    backgroundColor: RetroTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
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
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
    alignItems: 'center' as const,
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
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 8,
    padding: 15,
    width: '48%' as const,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: RetroTheme.colors.border,
    alignItems: 'center' as const,
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