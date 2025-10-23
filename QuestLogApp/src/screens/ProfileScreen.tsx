import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Image, ActivityIndicator, Modal, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroTheme } from '../theme/RetroTheme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface ProfileScreenProps {
  gameCount: number;
  onBack: () => void;
  onSignOut: () => void;
  onNavigateToLibrary: () => void;
  onNavigateToSearch: () => void;
}

interface UserProfile {
  avatar_url: string | null;
  full_name: string | null;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  gameCount, 
  onBack, 
  onSignOut,
  onNavigateToLibrary,
  onNavigateToSearch,
}) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      } else if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.profileTitle}>Profile</Text>
          <TouchableOpacity style={styles.signOutIconButton} onPress={onSignOut}>
            <Text style={styles.signOutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Info Card - Hero Section */}
          <View style={styles.profileInfo}>
            <View style={styles.profileHeroContent}>
              {loading ? (
                <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
              ) : userProfile?.avatar_url ? (
                <Image 
                  source={{ uri: userProfile.avatar_url }} 
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
              )}
              {userProfile?.full_name && (
                <Text style={styles.profileName}>{userProfile.full_name}</Text>
              )}
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Gaming Stats */}
          <View style={styles.profileStats}>
            <Text style={styles.profileStatsTitle}>Gaming Stats</Text>
            <View style={styles.profileStatsGrid}>
              {/* Games Added - Clickable to Library */}
              <TouchableOpacity 
                style={styles.profileStatItem}
                onPress={onNavigateToLibrary}
              >
                <Text style={styles.profileStatNumber}>{gameCount}</Text>
                <Text style={styles.profileStatLabel}>Games Added</Text>
                <Text style={styles.statItemArrow}>→</Text>
              </TouchableOpacity>

              {/* Vault */}
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>0</Text>
                <Text style={styles.profileStatLabel}>Vault</Text>
              </View>

              {/* Reviews Written - Clickable to Add Game */}
              <TouchableOpacity 
                style={styles.profileStatItem}
                onPress={onNavigateToSearch}
              >
                <Text style={styles.profileStatNumber}>0</Text>
                <Text style={styles.profileStatLabel}>Reviews Written</Text>
                <Text style={styles.statItemArrow}>→</Text>
              </TouchableOpacity>

              {/* Current Level */}
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatNumber}>1</Text>
                <Text style={styles.profileStatLabel}>Current Level</Text>
              </View>
            </View>
          </View>

          {/* Achievements Section - Placeholder */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsPlaceholder}>
              <Text style={styles.achievementsPlaceholderText}>
                No achievements yet. Start logging games to unlock achievements!
              </Text>
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowPrivacyModal(true)}
            >
              <Text style={styles.settingLabel}>Privacy</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowAboutModal(true)}
            >
              <Text style={styles.settingLabel}>About</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Privacy Modal */}
        <Modal
          visible={showPrivacyModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowPrivacyModal(false)}
        >
          <View style={[styles.modalOverlay, { paddingTop: Platform.OS === 'android' ? 0 : 10 }]}>
            <View style={styles.modalHeaderContainer}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPrivacyModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalText}>
                  <Text style={styles.modalBold}>Your Privacy Matters</Text>
                  {'\n\n'}
                  QuestLog is committed to protecting your privacy and ensuring you have a positive experience on our platform.

                  {'\n\n'}<Text style={styles.modalBold}>Data Collection</Text>
                  {'\n'}
                  We collect information you provide directly, including your email address, username, and gaming preferences. We use this information to deliver, maintain, and improve our services.

                  {'\n\n'}<Text style={styles.modalBold}>Data Usage</Text>
                  {'\n'}
                  Your data is used solely to provide the QuestLog service. We do not sell, trade, or rent your personal information to third parties.

                  {'\n\n'}<Text style={styles.modalBold}>Data Security</Text>
                  {'\n'}
                  We implement appropriate technical and organizational measures to protect your data against unauthorized access and misuse.

                  {'\n\n'}<Text style={styles.modalBold}>Your Rights</Text>
                  {'\n'}
                  You have the right to access, correct, or delete your personal information at any time by contacting us.

                  {'\n\n'}For more information, please contact us at privacy@questlog.app
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* About Modal */}
        <Modal
          visible={showAboutModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowAboutModal(false)}
        >
          <View style={[styles.modalOverlay, { paddingTop: Platform.OS === 'android' ? 0 : 10 }]}>
            <View style={styles.modalHeaderContainer}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>About QuestLog</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalText}>
                  <Text style={styles.modalBold}>QuestLog v1.0.0</Text>
                  {'\n\n'}
                  Track your gaming journey like never before.

                  {'\n\n'}<Text style={styles.modalBold}>What is QuestLog?</Text>
                  {'\n'}
                  QuestLog is a game-like video game journal and tracker designed to feel like a retro handheld console. It's essentially "Letterboxd for games" with gamification elements and comprehensive game database integration.

                  {'\n\n'}<Text style={styles.modalBold}>Features</Text>
                  {'\n'}
                  • Search and log games from 500k+ titles{'\n'}
                  • Rate and review games{'\n'}
                  • Track your gaming library{'\n'}
                  • Earn XP and unlock achievements{'\n'}
                  • Compete with friends{'\n'}
                  • Discover new games

                  {'\n\n'}<Text style={styles.modalBold}>Game Data</Text>
                  {'\n'}
                  Game information and metadata provided by IGDB (Internet Game Database).

                  {'\n\n'}<Text style={styles.modalBold}>Contact & Support</Text>
                  {'\n'}
                  For support or feedback, please contact us at support@questlog.app

                  {'\n\n'}<Text style={styles.modalBold}>Made with ❤️ for gamers</Text>
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: RetroTheme.colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.borderLight,
    backgroundColor: RetroTheme.colors.layer2,
    ...RetroTheme.shadows.small,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  backButtonText: {
    color: RetroTheme.colors.primary,
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 28,
  },
  profileTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  signOutIconButton: {
    padding: 8,
    minWidth: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  signOutText: {
    color: RetroTheme.colors.text,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  content: {
    flex: 1,
    padding: 16,
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
  profileHeroContent: {
    alignItems: 'center' as const,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RetroTheme.colors.layer3,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  profileName: {
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    marginTop: 4,
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
    width: (screenWidth - 48) * 0.48,
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
  statItemArrow: {
    fontSize: 14,
    color: RetroTheme.colors.primary,
    marginTop: 6,
    fontWeight: 'bold' as const,
  },
  achievementsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    marginBottom: 12,
  },
  achievementsPlaceholder: {
    backgroundColor: RetroTheme.colors.layer3,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 20,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    alignItems: 'center' as const,
    ...RetroTheme.shadows.small,
  },
  achievementsPlaceholderText: {
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  settingsSection: {
    marginBottom: 40,
  },
  settingItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.small,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
  },
  settingArrow: {
    fontSize: 16,
    color: RetroTheme.colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: RetroTheme.colors.background,
  },
  modalHeaderContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.borderLight,
    backgroundColor: RetroTheme.colors.layer2,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalCloseButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 20,
    color: RetroTheme.colors.primary,
    fontWeight: 'bold' as const,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.primary,
    flex: 1,
    textAlign: 'center' as const,
  },
  modalScrollView: {
    flex: 1,
  },
  modalText: {
    fontSize: 14,
    color: RetroTheme.colors.text,
    lineHeight: 24,
  },
  modalBold: {
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.primary,
  },
};

export default ProfileScreen;
