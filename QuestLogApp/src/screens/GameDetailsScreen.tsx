import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';
import { IGDBGame, IGDBService } from '../services/IGDBService';
import { UserRatingService, UserGameStatus } from '../services/UserRatingService';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface GameDetailsScreenProps {
  gameId: number;
  onBack: () => void;
}

interface ScreenshotItemProps {
  screenshot: {
    id: number;
    url: string;
    image_id: string;
  };
  onPress: (url: string) => void;
}

const ScreenshotItem: React.FC<ScreenshotItemProps> = ({ screenshot, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const imageUrl = useMemo(() => {
    if (screenshot.url) {
      return screenshot.url.replace('t_screenshot_med', 't_thumb');
    }
    return null;
  }, [screenshot.url]);

  const handlePress = useCallback(() => {
    if (screenshot.url) {
      onPress(screenshot.url.replace('t_thumb', 't_screenshot_big'));
    }
  }, [screenshot.url, onPress]);

  return (
    <TouchableOpacity style={styles.screenshotItem} onPress={handlePress}>
      {imageUrl && !imageError ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={styles.screenshotImage}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
          {imageLoading && (
            <View style={styles.screenshotLoader}>
              <ActivityIndicator size="small" color={RetroTheme.colors.accent} />
            </View>
          )}
        </>
      ) : (
        <View style={styles.screenshotPlaceholder}>
          <Text style={styles.screenshotPlaceholderText}>📷</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const GameDetailsScreen: React.FC<GameDetailsScreenProps> = ({ gameId, onBack }) => {
  const { user } = useAuth();
  const [game, setGame] = useState<IGDBGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User interaction states
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>('');
  const [userStatus, setUserStatus] = useState<UserGameStatus>('not_played');
  const [isInLibrary, setIsInLibrary] = useState(false);
  
  // UI states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    loadGameDetails();
    if (user) {
      loadUserGameData();
    }
  }, [gameId, user]);

  const loadGameDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const gameData = await IGDBService.getInstance().getGameDetails(gameId);
      if (gameData) {
        setGame(gameData);
      } else {
        setError('Game not found');
      }
    } catch (err) {
      console.error('Failed to load game details:', err);
      setError('Failed to load game details');
    } finally {
      setLoading(false);
    }
  };

  const loadUserGameData = async () => {
    if (!user || !game) return;

    try {
      const userGame = await UserRatingService.getInstance().getUserGame(gameId);
      if (userGame) {
        // userGame.rating is a UserGameRating object or array
        const rating = userGame.rating;
        let ratingValue = 0;
        if (rating && Array.isArray(rating) && rating.length > 0) {
          ratingValue = rating[0].rating || 0;
          setUserReview(rating[0].review || '');
        } else if (rating && typeof rating === 'object' && 'rating' in rating) {
          ratingValue = rating.rating || 0;
          setUserReview(rating.review || '');
        }
        // Convert from 10-point scale to 5-star scale for display
        setUserRating(Math.round(ratingValue / 2));
        setUserStatus(userGame.status as UserGameStatus);
        setIsInLibrary(true);
      }
    } catch (err) {
      console.error('Failed to load user game data:', err);
    }
  };

  const handleAddToLibrary = async () => {
    if (!user || !game) return;

    try {
      await UserRatingService.getInstance().addGameToLibrary(game.id, 'plan_to_play');
      
      setIsInLibrary(true);
      setUserStatus('plan_to_play');
      Alert.alert('Success', 'Game added to your library!');
    } catch (err) {
      console.error('Failed to add game to library:', err);
      Alert.alert('Error', 'Failed to add game to library');
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!user || !game) return;

    Alert.alert(
      'Remove Game',
      'Are you sure you want to remove this game from your library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserRatingService.getInstance().removeGameFromLibrary(gameId);
              setIsInLibrary(false);
              setUserRating(0);
              setUserReview('');
              setUserStatus('not_played');
              Alert.alert('Success', 'Game removed from your library');
            } catch (err) {
              console.error('Failed to remove game from library:', err);
              Alert.alert('Error', 'Failed to remove game from library');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus: UserGameStatus) => {
    if (!user || !game) return;

    try {
      if (!isInLibrary) {
        // Add to library first
        await UserRatingService.getInstance().addGameToLibrary(gameId, newStatus);
        setIsInLibrary(true);
      } else {
        // Update existing entry
        await UserRatingService.getInstance().updateGameStatus(gameId, newStatus);
      }
      
      setUserStatus(newStatus);
    } catch (err) {
      console.error('Failed to update game status:', err);
      Alert.alert('Error', 'Failed to update game status');
    }
  };

  const handleSaveRating = async () => {
    if (!user || !game) {
      console.log('❌ Cannot save rating - user or game is null');
      console.log('User:', user ? 'exists' : 'null');
      console.log('Game:', game ? game.name : 'null');
      return;
    }

    if (userRating === 0) {
      console.log('❌ Cannot save - no rating selected');
      Alert.alert('Rating Required', 'Please select a rating (1-5 stars) before saving.');
      return;
    }

    console.log('💾 Starting save rating process...');
    console.log('Game ID:', gameId);
    console.log('User Rating:', userRating);
    console.log('User Review:', userReview ? 'exists' : 'none');
    console.log('User Status:', userStatus);
    console.log('Is in Library:', isInLibrary);

    try {
      // Convert 5-star rating to 10-point scale for database
      const ratingOutOf10 = userRating * 2;
      console.log('Converted rating (1-10 scale):', ratingOutOf10);

      if (!isInLibrary) {
        console.log('📚 Adding to library first...');
        const libraryResult = await UserRatingService.getInstance().addGameToLibrary(gameId, userStatus);
        console.log('✅ Library add result:', libraryResult);
        setIsInLibrary(true);
      }
      
      // Always update/add the rating regardless of library status
      console.log('⭐ Saving rating...');
      const ratingResult = await UserRatingService.getInstance().updateGameRating(
        gameId, 
        ratingOutOf10,  // Use converted rating
        userReview, 
        userStatus
      );
      console.log('✅ Rating save result:', ratingResult);
      
      setShowRatingModal(false);
      Alert.alert('Success', 'Your rating has been saved!');
    } catch (err) {
      console.error('❌ Failed to save rating:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      Alert.alert('Error', `Failed to save rating: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleScreenshotPress = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  }, []);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: UserGameStatus) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'playing': return '#2196F3';
      case 'plan_to_play': return '#FF9800';
      case 'dropped': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: UserGameStatus) => {
    switch (status) {
      case 'completed': return '✅ Completed';
      case 'playing': return '🎮 Playing';
      case 'plan_to_play': return '📋 Plan to Play';
      case 'dropped': return '❌ Dropped';
      default: return '⚪ Not Played';
    }
  };

  const getStatusTextColor = (status: UserGameStatus, isSelected: boolean) => {
    if (isSelected) {
      return '#FFFFFF';
    }
    return getStatusColor(status);
  };

  const renderStars = (rating: number, onPress?: (star: number) => void, interactive = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => onPress?.(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.star,
              { color: star <= rating ? RetroTheme.colors.accent : RetroTheme.colors.secondary }
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RetroTheme.colors.accent} />
        <Text style={styles.loadingText}>Loading game details...</Text>
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Game not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coverUrl = game.cover?.url?.replace('t_cover_big', 't_cover_big_2x');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {game.name}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cover and Basic Info */}
        <View style={styles.heroSection}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>🎮</Text>
            </View>
          )}
          
          <View style={styles.basicInfo}>
            <Text style={styles.gameTitle}>{game.name}</Text>
            
            {/* Release Date */}
            {game.first_release_date && (
              <Text style={styles.releaseDate}>
                Released: {formatDate(game.first_release_date)}
              </Text>
            )}

            {/* Genres */}
            {game.genres && game.genres.length > 0 && (
              <View style={styles.genresContainer}>
                {game.genres.slice(0, 3).map((genre) => (
                  <View key={genre.id} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* IGDB Rating */}
            {game.rating && (
              <View style={styles.igdbRating}>
                <Text style={styles.ratingLabel}>IGDB Rating:</Text>
                <Text style={styles.ratingValue}>{Math.round(game.rating)}/100</Text>
                {game.rating_count && (
                  <Text style={styles.ratingCount}>({game.rating_count} votes)</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* User Actions */}
        {user && (
          <View style={styles.userSection}>
            {/* Library Status - No Label, just chips */}
            <View style={styles.statusContainer}>
              <View style={styles.statusChipsContainer}>
                {(['plan_to_play', 'playing', 'completed', 'dropped', 'not_played'] as UserGameStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusChip,
                      { 
                        backgroundColor: userStatus === status ? getStatusColor(status) : 'transparent',
                        borderColor: getStatusColor(status),
                      }
                    ]}
                    onPress={() => handleStatusChange(status)}
                  >
                    <Text style={[
                      styles.statusChipText,
                      { color: getStatusTextColor(status, userStatus === status) }
                    ]}>
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating Display (if exists) */}
            {userRating > 0 && (
              <View style={styles.ratingDisplaySection}>
                <View style={styles.ratingHeader}>
                  <Text style={styles.ratingLabel}>Your Rating:</Text>
                  {renderStars(userRating)}
                </View>
              </View>
            )}

            {/* Review Display (if exists) */}
            {userReview.length > 0 && (
              <View style={styles.reviewContainer}>
                <Text style={styles.reviewLabel}>Your Review:</Text>
                <Text style={styles.reviewText}>{userReview}</Text>
              </View>
            )}
          </View>
        )}

        {/* Screenshots */}
        {game.screenshots && game.screenshots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screenshots</Text>
            <FlatList
              data={game.screenshots.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ScreenshotItem screenshot={item} onPress={handleScreenshotPress} />
              )}
              contentContainerStyle={styles.screenshotsList}
            />
          </View>
        )}

        {/* Description */}
        {game.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={expandedDescription ? undefined : 4}
            >
              {game.summary}
            </Text>
            {game.summary.length > 200 && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setExpandedDescription(!expandedDescription)}
              >
                <Text style={styles.expandButtonText}>
                  {expandedDescription ? 'Show Less' : 'Show More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Platforms */}
        {game.platforms && game.platforms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platforms</Text>
            <View style={styles.platformsContainer}>
              {game.platforms.map((platform) => (
                <View key={platform.id} style={styles.platformTag}>
                  <Text style={styles.platformText}>{platform.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Companies */}
        {game.involved_companies && game.involved_companies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Companies</Text>
            {game.involved_companies
              .filter(ic => ic.developer || ic.publisher)
              .map((company, index) => (
                <View key={index} style={styles.companyRow}>
                  <Text style={styles.companyName}>{company.company.name}</Text>
                  <Text style={styles.companyRole}>
                    {company.developer && company.publisher
                      ? 'Developer, Publisher'
                      : company.developer
                      ? 'Developer'
                      : 'Publisher'}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Rate & Review Button */}
      {user && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.floatingRateButton}
            onPress={() => setShowRatingModal(true)}
          >
            <Text style={styles.floatingRateButtonText}>
              {userRating > 0 ? '⭐ Edit Rating & Review' : '⭐ Rate & Review'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate & Review</Text>
            
            <View style={styles.modalRatingSection}>
              <Text style={styles.modalLabel}>Your Rating:</Text>
              {renderStars(userRating, setUserRating, true)}
            </View>

            <View style={styles.modalReviewSection}>
              <Text style={styles.modalLabel}>Your Review (Optional):</Text>
              <TextInput
                style={styles.reviewInput}
                value={userReview}
                onChangeText={setUserReview}
                placeholder="Share your thoughts about this game..."
                placeholderTextColor={RetroTheme.colors.secondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveRating}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
          >
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
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
    borderBottomColor: RetroTheme.colors.primary,
    backgroundColor: RetroTheme.colors.surface,
  },
  backButton: {
    padding: 8,
    minWidth: 60,
  },
  backButtonText: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.accent,
    fontWeight: 'bold' as const,
  },
  headerTitle: {
    ...RetroTheme.text.body,
    fontSize: 16,
    flex: 1,
    textAlign: 'center' as const,
    marginHorizontal: 8,
    color: RetroTheme.colors.text,
    fontWeight: 'bold' as const,
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for floating button
  },
  heroSection: {
    flexDirection: 'row' as const,
    padding: 16,
    backgroundColor: RetroTheme.colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.primary,
  },
  coverImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: RetroTheme.colors.primary,
  },
  coverPlaceholder: {
    width: 120,
    height: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: RetroTheme.colors.primary,
    backgroundColor: RetroTheme.colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  coverPlaceholderText: {
    fontSize: 40,
  },
  basicInfo: {
    flex: 1,
    marginLeft: 16,
  },
  gameTitle: {
    ...RetroTheme.text.h2,
    marginBottom: 8,
  },
  releaseDate: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.secondary,
    marginBottom: 8,
  },
  genresContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: 12,
  },
  genreTag: {
    backgroundColor: RetroTheme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  genreText: {
    ...RetroTheme.text.caption,
    color: RetroTheme.colors.background,
    fontWeight: 'bold' as const,
  },
  igdbRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  ratingLabel: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.secondary,
    marginRight: 8,
  },
  ratingValue: {
    ...RetroTheme.text.h3,
    color: RetroTheme.colors.accent,
    marginRight: 4,
  },
  ratingCount: {
    ...RetroTheme.text.caption,
    color: RetroTheme.colors.secondary,
  },
  userSection: {
    padding: 16,
    backgroundColor: RetroTheme.colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.primary,
  },
  sectionTitle: {
    ...RetroTheme.text.h3,
    marginBottom: 12,
    color: RetroTheme.colors.accent,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusChipsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    width: screenWidth * 0.45,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  statusChipText: {
    ...RetroTheme.text.caption,
    fontSize: 12,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  ratingDisplaySection: {
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: RetroTheme.colors.primary + '30',
  },
  ratingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  starsContainer: {
    flexDirection: 'row' as const,
    marginLeft: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 20,
  },
  reviewContainer: {
    backgroundColor: RetroTheme.colors.background,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: RetroTheme.colors.primary,
    marginTop: 8,
  },
  reviewLabel: {
    ...RetroTheme.text.caption,
    color: RetroTheme.colors.secondary,
    marginBottom: 4,
  },
  reviewText: {
    ...RetroTheme.text.body,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.primary,
  },
  screenshotsList: {
    paddingVertical: 8,
  },
  screenshotItem: {
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: RetroTheme.colors.primary,
    overflow: 'hidden' as const,
  },
  screenshotImage: {
    width: 120,
    height: 80,
  },
  screenshotLoader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  screenshotPlaceholder: {
    width: 120,
    height: 80,
    backgroundColor: RetroTheme.colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  screenshotPlaceholderText: {
    fontSize: 24,
  },
  descriptionText: {
    ...RetroTheme.text.body,
    lineHeight: 22,
    marginBottom: 8,
  },
  expandButton: {
    alignSelf: 'flex-start' as const,
  },
  expandButtonText: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.accent,
    fontWeight: 'bold' as const,
  },
  platformsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  platformTag: {
    backgroundColor: RetroTheme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: RetroTheme.colors.primary,
    marginRight: 8,
    marginBottom: 8,
  },
  platformText: {
    ...RetroTheme.text.caption,
    color: RetroTheme.colors.text,
  },
  companyRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.primary + '30',
  },
  companyName: {
    ...RetroTheme.text.body,
    flex: 1,
  },
  companyRole: {
    ...RetroTheme.text.caption,
    color: RetroTheme.colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.background,
  },
  loadingText: {
    ...RetroTheme.text.body,
    marginTop: 16,
    color: RetroTheme.colors.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.background,
    padding: 20,
  },
  errorText: {
    ...RetroTheme.text.h3,
    color: RetroTheme.colors.secondary,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  // Floating Button styles
  floatingButtonContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: RetroTheme.colors.surface,
    borderTopWidth: 2,
    borderTopColor: RetroTheme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingRateButton: {
    backgroundColor: RetroTheme.colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: RetroTheme.colors.primary,
  },
  floatingRateButtonText: {
    ...RetroTheme.text.body,
    fontSize: 16,
    color: RetroTheme.colors.background,
    fontWeight: 'bold' as const,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: RetroTheme.colors.surface,
    borderRadius: 12,
    padding: 20,
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
    borderWidth: 3,
    borderColor: RetroTheme.colors.primary,
  },
  modalTitle: {
    ...RetroTheme.text.h2,
    textAlign: 'center' as const,
    marginBottom: 20,
    color: RetroTheme.colors.accent,
  },
  modalRatingSection: {
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  modalLabel: {
    ...RetroTheme.text.body,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  modalReviewSection: {
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: RetroTheme.colors.background,
    borderWidth: 2,
    borderColor: RetroTheme.colors.primary,
    borderRadius: 6,
    padding: 12,
    ...RetroTheme.text.body,
    color: RetroTheme.colors.text,
    textAlignVertical: 'top' as const,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: RetroTheme.colors.secondary,
    flex: 0.45,
  },
  modalCancelText: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.secondary,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  modalSaveButton: {
    backgroundColor: RetroTheme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 0.45,
  },
  modalSaveText: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.background,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  imageModalClose: {
    position: 'absolute' as const,
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  imageModalCloseText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  fullScreenImage: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.7,
  },
};

export default GameDetailsScreen;