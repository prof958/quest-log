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
import { UserRatingService, UserGameStatus, CategoryRatings } from '../services/UserRatingService';
import { useAuth } from '../context/AuthContext';
import ActivityLogService from '../services/ActivityLogService';
import { StarRating } from '../components/StarRating';
import { CategoryInfoModal, RATING_CATEGORIES, RatingCategory } from '../components/CategoryInfoModal';

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
              <ActivityIndicator size="small" color={RetroTheme.colors.primary} />
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
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>({
    story: 0,
    gameplay: 0,
    audio: 0,
    visual: 0,
    joy: 0,
  });
  const [userReview, setUserReview] = useState<string>('');
  const [userStatus, setUserStatus] = useState<UserGameStatus>('not_played');
  const [isInLibrary, setIsInLibrary] = useState(false);
  
  // UI states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RatingCategory | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);
  
  // QuestLog community rating
  const [questLogRating, setQuestLogRating] = useState<number | null>(null);
  const [questLogRatingCount, setQuestLogRatingCount] = useState<number>(0);
  const [showCommunityReviews, setShowCommunityReviews] = useState(false);
  const [communityReviews, setCommunityReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadGameDetails();
  }, [gameId]);

  useEffect(() => {
    if (user && game) {
      loadUserGameData();
    }
    loadQuestLogRating();
  }, [user, game, gameId]);

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
    if (!user) return;

    try {
      setLoadingUserData(true);
      console.log('👤 Loading user game data for game ID:', gameId);
      const userGame = await UserRatingService.getInstance().getUserGame(gameId);
      
      if (userGame) {
        console.log('✅ Found user game data:', userGame);
        
        // userGame.rating is a UserGameRating object or array
        const rating = userGame.rating;
        let ratingValue = 0;
        if (rating && Array.isArray(rating) && rating.length > 0) {
          ratingValue = rating[0].rating || 0;
          setUserReview(rating[0].review || '');
          // Load category ratings
          setCategoryRatings({
            story: rating[0].rating_story || 0,
            gameplay: rating[0].rating_gameplay || 0,
            audio: rating[0].rating_audio || 0,
            visual: rating[0].rating_visual || 0,
            joy: rating[0].rating_joy || 0,
          });
        } else if (rating && typeof rating === 'object' && 'rating' in rating) {
          ratingValue = rating.rating || 0;
          setUserReview(rating.review || '');
          // Load category ratings
          setCategoryRatings({
            story: rating.rating_story || 0,
            gameplay: rating.rating_gameplay || 0,
            audio: rating.rating_audio || 0,
            visual: rating.rating_visual || 0,
            joy: rating.rating_joy || 0,
          });
        }
        
        // Convert from 10-point scale to 5-star scale for display
        const starRating = Math.round(ratingValue / 2);
        console.log('⭐ Setting user rating:', starRating, 'stars (from', ratingValue, '/10)');
        setUserRating(starRating);
        
        console.log('📊 Setting user status:', userGame.status);
        setUserStatus(userGame.status as UserGameStatus);
        setIsInLibrary(true);
      } else {
        console.log('ℹ️ No user game data found - resetting to defaults');
        setUserRating(0);
        setCategoryRatings({
          story: 0,
          gameplay: 0,
          audio: 0,
          visual: 0,
          joy: 0,
        });
        setUserReview('');
        setUserStatus('not_played');
        setIsInLibrary(false);
      }
    } catch (err) {
      console.error('❌ Failed to load user game data:', err);
    } finally {
      setLoadingUserData(false);
    }
  };

  const loadCommunityReviews = async () => {
    try {
      setLoadingReviews(true);
      console.log('📚 Loading community reviews for game ID:', gameId);
      
      const reviews = await UserRatingService.getInstance().getCommunityReviews(gameId, 50);
      
      console.log('✅ Found', reviews.length, 'community reviews');
      setCommunityReviews(reviews);
    } catch (err) {
      console.error('❌ Failed to load community reviews:', err);
      setCommunityReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadQuestLogRating = async () => {
    try {
      console.log('📊 Loading QuestLog rating for game ID:', gameId);
      const stats = await UserRatingService.getInstance().getGameRatingStats(gameId);
      
      if (stats && stats.user_rating_count > 0) {
        console.log('✅ QuestLog rating found:', stats.user_rating_average, 'from', stats.user_rating_count, 'users');
        setQuestLogRating(stats.user_rating_average);
        setQuestLogRatingCount(stats.user_rating_count);
      } else {
        console.log('ℹ️ No QuestLog ratings yet');
        setQuestLogRating(null);
        setQuestLogRatingCount(0);
      }
    } catch (err) {
      console.error('❌ Failed to load QuestLog rating:', err);
      setQuestLogRating(null);
      setQuestLogRatingCount(0);
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
      setIsSaving(true);
      const previousStatus = userStatus;
      
      if (!isInLibrary) {
        // Add to library first
        await UserRatingService.getInstance().addGameToLibrary(gameId, newStatus);
        setIsInLibrary(true);
        
        // Log as "added" activity
        await ActivityLogService.getInstance().logActivity(
          user.id,
          gameId,
          game.name,
          'added',
          { status: newStatus }
        );
      } else {
        // Update existing entry
        await UserRatingService.getInstance().updateGameStatus(gameId, newStatus);
        
        // Log as "status_changed" activity
        await ActivityLogService.getInstance().logActivity(
          user.id,
          gameId,
          game.name,
          'status_changed',
          { status: newStatus, previousStatus }
        );
      }
      
      setUserStatus(newStatus);
      console.log('✅ Status updated successfully to:', newStatus);
    } catch (err) {
      console.error('Failed to update game status:', err);
      Alert.alert('Error', 'Failed to update game status');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate overall rating from category ratings
  const calculateOverallRating = (categories: CategoryRatings): number => {
    const ratings = Object.values(categories).filter(r => r >= 1);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  const handleSaveRating = async () => {
    if (!user || !game) {
      console.log('❌ Cannot save rating - user or game is null');
      console.log('User:', user ? 'exists' : 'null');
      console.log('Game:', game ? game.name : 'null');
      return;
    }

    // Validate at least one category is rated (must be >= 1)
    const hasRatings = Object.values(categoryRatings).some(r => r >= 1);
    if (!hasRatings) {
      console.log('❌ Cannot save - no category ratings selected');
      Alert.alert('Rating Required', 'Please rate at least one category before saving.');
      return;
    }

    // Validate all non-zero ratings are at least 1.0
    const invalidRatings = Object.entries(categoryRatings).filter(([_, r]) => r > 0 && r < 1);
    if (invalidRatings.length > 0) {
      console.log('❌ Cannot save - ratings below 1.0 detected:', invalidRatings);
      Alert.alert('Invalid Rating', 'Ratings must be between 1 and 5 stars.');
      return;
    }

    // Calculate overall rating from categories
    const overallRating = calculateOverallRating(categoryRatings);

    console.log('💾 Starting save rating process...');
    console.log('Game ID:', gameId);
    console.log('Category Ratings:', categoryRatings);
    console.log('Overall Rating:', overallRating);
    console.log('User Review:', userReview ? 'exists' : 'none');
    console.log('User Status:', userStatus);
    console.log('Is in Library:', isInLibrary);

    try {
      // Convert 5-star overall to 10-point scale for database
      const ratingOutOf10 = overallRating * 2;
      console.log('Converted rating (1-10 scale):', ratingOutOf10);

      setIsSaving(true);
      
      if (!isInLibrary) {
        console.log('📚 Adding to library first...');
        const libraryResult = await UserRatingService.getInstance().addGameToLibrary(gameId, userStatus);
        console.log('✅ Library add result:', libraryResult);
        setIsInLibrary(true);
      }
      
      // Save rating with category ratings
      console.log('⭐ Saving rating with categories...');
      const ratingResult = await UserRatingService.getInstance().rateGame(
        gameId,
        ratingOutOf10,  // Overall rating (1-10 scale)
        userReview,
        userStatus,
        undefined,  // hours_played
        categoryRatings  // Category ratings
      );
      console.log('✅ Rating save result:', ratingResult);
      
      // Update local state with overall
      setUserRating(overallRating);
      
      // Log rating activity
      await ActivityLogService.getInstance().logActivity(
        user.id,
        gameId,
        game.name,
        'rated',
        { rating: ratingOutOf10, review: userReview, status: userStatus }
      );
      
      setShowRatingModal(false);
      
      // Reload user game data and community rating to ensure UI reflects latest state
      await loadUserGameData();
      await loadQuestLogRating();
      
      Alert.alert('Success', 'Your rating has been saved!');
    } catch (err) {
      console.error('❌ Failed to save rating:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      Alert.alert('Error', `Failed to save rating: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
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
      case 'completed': return 'Completed';
      case 'playing': return 'Playing';
      case 'plan_to_play': return 'Plan to Play';
      case 'dropped': return 'Dropped';
      default: return 'Not Played';
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
              { color: star <= rating ? RetroTheme.colors.primary : RetroTheme.colors.secondary }
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
        <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {game.name}
        </Text>
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
                  <StarRating
                    rating={userRating}
                    size={20}
                    showNumber
                    color={RetroTheme.colors.primary}
                  />
                </View>
                
                {/* Compact Category Ratings Display */}
                {((categoryRatings.story || 0) >= 1 || (categoryRatings.gameplay || 0) >= 1 || 
                  (categoryRatings.audio || 0) >= 1 || (categoryRatings.visual || 0) >= 1 || 
                  (categoryRatings.joy || 0) >= 1) && (
                  <View style={styles.categoryRatingsCompact}>
                    {RATING_CATEGORIES.map((category) => {
                      const rating = categoryRatings[category.id as keyof CategoryRatings] || 0;
                      if (rating < 1) return null;
                      return (
                        <View key={category.id} style={styles.compactCategoryItem}>
                          <Text style={styles.compactCategoryIcon}>{category.icon}</Text>
                          <Text style={styles.compactCategoryRating}>{rating.toFixed(1)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Review Display (if exists) */}
            {userReview.length > 0 && (
              <View style={styles.reviewContainer}>
                <Text style={styles.reviewLabel}>Your Review:</Text>
                <Text style={styles.reviewText}>{userReview}</Text>
              </View>
            )}

            {/* Remove from Library Button (only show if in library) */}
            {isInLibrary && (
              <TouchableOpacity
                style={styles.removeFromLibraryButton}
                onPress={handleRemoveFromLibrary}
              >
                <Text style={styles.removeFromLibraryText}>🗑️ Remove from Library</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Ratings Section */}
        <View style={styles.ratingsSection}>
          <Text style={styles.sectionTitle}>Ratings</Text>
          <View style={styles.ratingsGrid}>
            {/* IGDB Rating */}
            {game.rating && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingSourceLabel}>IGDB</Text>
                <Text style={styles.ratingSourceValue}>{Math.round(game.rating)}</Text>
                <Text style={styles.ratingSourceMax}>/100</Text>
                {game.rating_count && (
                  <Text style={styles.ratingSourceVotes}>{game.rating_count} votes</Text>
                )}
              </View>
            )}

            {/* QuestLog Rating - Clickable */}
            <TouchableOpacity 
              style={styles.ratingCard}
              onPress={async () => {
                if (questLogRatingCount > 0) {
                  await loadCommunityReviews();
                  setShowCommunityReviews(true);
                }
              }}
              disabled={questLogRatingCount === 0}
            >
              <Text style={styles.ratingSourceLabel}>QuestLog</Text>
              <Text style={styles.ratingSourceValue}>
                {questLogRating !== null ? (questLogRating / 2).toFixed(1) : '-'}
              </Text>
              <Text style={styles.ratingSourceMax}>/5</Text>
              <Text style={styles.ratingSourceVotes}>
                {questLogRatingCount > 0 
                  ? `${questLogRatingCount} rating${questLogRatingCount !== 1 ? 's' : ''}`
                  : 'No ratings yet'}
              </Text>
              {questLogRatingCount > 0 && (
                <Text style={styles.tapToViewReviews}>Tap to view reviews</Text>
              )}
            </TouchableOpacity>

            {/* MetaCritic Rating - Placeholder */}
            <View style={styles.ratingCard}>
              <Text style={styles.ratingSourceLabel}>MetaCritic</Text>
              <Text style={styles.ratingSourceValue}>-</Text>
              <Text style={styles.ratingSourceMax}>/100</Text>
              <Text style={styles.ratingSourceVotes}>Not available</Text>
            </View>

            {/* OpenCritic Rating - Placeholder */}
            <View style={styles.ratingCard}>
              <Text style={styles.ratingSourceLabel}>OpenCritic</Text>
              <Text style={styles.ratingSourceValue}>-</Text>
              <Text style={styles.ratingSourceMax}>/100</Text>
              <Text style={styles.ratingSourceVotes}>Not available</Text>
            </View>
          </View>
        </View>

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
            <View style={styles.companiesContainer}>
              {game.involved_companies
                .filter(ic => ic.developer || ic.publisher)
                .map((company, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.companyChip}
                    onPress={() => Alert.alert(
                      company.company.name,
                      `${company.developer && company.publisher
                        ? 'Developer & Publisher'
                        : company.developer
                        ? 'Developer'
                        : 'Publisher'}`
                    )}
                  >
                    <Text style={styles.companyChipText}>{company.company.name}</Text>
                    <Text style={styles.companyChipRole}>
                      {company.developer && company.publisher
                        ? 'Dev & Pub'
                        : company.developer
                        ? 'Dev'
                        : 'Pub'}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
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
              {userRating > 0 ? 'Edit Rating & Review' : 'Rate & Review'}
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
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate {game?.name}</Text>
              
              {/* Category Ratings */}
              <View style={styles.categoriesContainer}>
                {RATING_CATEGORIES.map((category) => (
                  <View key={category.id} style={styles.categoryRow}>
                    <TouchableOpacity
                      style={styles.categoryHeader}
                      onPress={() => {
                        setSelectedCategory(category);
                        setShowCategoryInfo(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={styles.categoryName}>{category.shortName}</Text>
                      <Text style={styles.infoIcon}>ⓘ</Text>
                    </TouchableOpacity>
                    
                    <StarRating
                      rating={categoryRatings[category.id as keyof CategoryRatings] || 0}
                      interactive
                      onRatingChange={(rating) => {
                        setCategoryRatings(prev => ({
                          ...prev,
                          [category.id]: rating,
                        }));
                      }}
                      size={24}
                    />
                  </View>
                ))}
              </View>

              {/* Overall Rating Display */}
              <View style={styles.overallSection}>
                <Text style={styles.overallLabel}>Overall Rating</Text>
                <StarRating
                  rating={calculateOverallRating(categoryRatings)}
                  size={28}
                  showNumber
                  color={RetroTheme.colors.primary}
                />
              </View>

              {/* Review Section */}
              <View style={styles.modalReviewSection}>
                <Text style={styles.modalLabel}>Your Review (Optional):</Text>
                <TextInput
                  style={styles.reviewInput}
                  value={userReview}
                  onChangeText={setUserReview}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={RetroTheme.colors.secondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Action Buttons */}
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
                  disabled={isSaving}
                >
                  <Text style={styles.modalSaveText}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Category Info Modal */}
      <CategoryInfoModal
        visible={showCategoryInfo}
        category={selectedCategory}
        onClose={() => setShowCategoryInfo(false)}
      />

      {/* Community Reviews Modal */}
      <Modal
        visible={showCommunityReviews}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommunityReviews(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.communityReviewsModal}>
            <View style={styles.communityReviewsHeader}>
              <Text style={styles.communityReviewsTitle}>Community Reviews</Text>
              <TouchableOpacity onPress={() => setShowCommunityReviews(false)}>
                <Text style={styles.communityReviewsClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingReviews ? (
              <View style={styles.communityReviewsLoading}>
                <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : communityReviews.length === 0 ? (
              <View style={styles.communityReviewsEmpty}>
                <Text style={styles.emptyReviewsText}>No reviews yet</Text>
              </View>
            ) : (
              <ScrollView style={styles.communityReviewsList}>
                {communityReviews.map((review: any) => (
                  <View key={review.id} style={styles.communityReviewItem}>
                    <View style={styles.reviewItemHeader}>
                      <View style={styles.reviewUserInfo}>
                        {review.user_profiles?.avatar_url ? (
                          <Image 
                            source={{ uri: review.user_profiles.avatar_url }} 
                            style={styles.reviewUserAvatar}
                          />
                        ) : (
                          <View style={styles.reviewUserAvatarPlaceholder}>
                            <Text style={styles.reviewUserAvatarText}>
                              {(review.user_profiles?.username || 'U')[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.reviewUserDetails}>
                          <View style={styles.reviewUserNameRow}>
                            <Text style={styles.reviewUsername}>
                              {review.user_profiles?.username || 'User'}
                            </Text>
                            {review.play_status && (
                              <View style={styles.reviewStatusBadge}>
                                <Text style={styles.reviewStatusText}>
                                  {review.play_status === 'playing' && '🎮 Playing'}
                                  {review.play_status === 'completed' && '✅ Completed'}
                                  {review.play_status === 'plan_to_play' && '📋 Plan to Play'}
                                  {review.play_status === 'dropped' && '⏸️ Dropped'}
                                  {review.play_status === 'not_played' && '📦 Not Played'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <StarRating
                        rating={review.rating / 2}
                        size={16}
                        showNumber
                        color={RetroTheme.colors.primary}
                      />
                    </View>
                    
                    {/* Category Ratings Chips */}
                    {(review.rating_story || review.rating_gameplay || review.rating_audio || 
                      review.rating_visual || review.rating_joy) && (
                      <View style={styles.reviewCategoryChips}>
                        {RATING_CATEGORIES.map((category) => {
                          const categoryRating = review[`rating_${category.id}`];
                          if (!categoryRating || categoryRating < 1) return null;
                          return (
                            <View key={category.id} style={styles.reviewCategoryChip}>
                              <Text style={styles.reviewCategoryIcon}>{category.icon}</Text>
                              <Text style={styles.reviewCategoryValue}>{categoryRating.toFixed(1)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    
                    {review.review && (
                      <Text style={styles.reviewItemText}>{review.review}</Text>
                    )}
                    <Text style={styles.reviewItemDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
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

      {/* Loading Overlay */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
            <Text style={styles.loadingOverlayText}>Saving...</Text>
          </View>
        </View>
      )}

      {loadingUserData && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={RetroTheme.colors.primary} />
            <Text style={styles.loadingOverlayText}>Loading your data...</Text>
          </View>
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
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
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
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: RetroTheme.colors.primary,
    fontWeight: 'bold' as const,
    lineHeight: 28,
  },
  headerTitle: {
    ...RetroTheme.text.body,
    fontSize: 18,
    flex: 1,
    color: RetroTheme.colors.text,
    fontWeight: 'bold' as const,
    lineHeight: 24,
    paddingTop: 2,
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
    backgroundColor: RetroTheme.colors.layer2,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.borderLight,
  },
  coverImage: {
    width: 120,
    height: 160,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.medium,
  },
  coverPlaceholder: {
    width: 120,
    height: 160,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    backgroundColor: RetroTheme.colors.layer1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...RetroTheme.shadows.medium,
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
    marginTop: 20,
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
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  genreText: {
    ...RetroTheme.text.caption,
    fontSize: 10,
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
    lineHeight: 20,
  },
  ratingValue: {
    ...RetroTheme.text.h3,
    color: RetroTheme.colors.primary,
    marginRight: 4,
  },
  ratingCount: {
    ...RetroTheme.text.caption,
    color: RetroTheme.colors.secondary,
  },
  userSection: {
    padding: 16,
    backgroundColor: RetroTheme.colors.layer2,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.borderLight,
  },
  sectionTitle: {
    ...RetroTheme.text.h3,
    marginBottom: 12,
    color: RetroTheme.colors.secondary,
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
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    width: screenWidth * 0.43,
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
    borderTopColor: RetroTheme.colors.borderLight,
  },
  ratingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryRatingsCompact: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
    gap: 8,
  },
  compactCategoryItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.layer1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RetroTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: RetroTheme.colors.borderLight,
  },
  compactCategoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  compactCategoryRating: {
    ...RetroTheme.text.caption,
    fontSize: 12,
    fontWeight: '600' as const,
    color: RetroTheme.colors.primary,
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
    backgroundColor: RetroTheme.colors.layer1,
    padding: 12,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    marginTop: 8,
    ...RetroTheme.shadows.small,
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
  removeFromLibraryButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: '#F44336',
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
  },
  removeFromLibraryText: {
    ...RetroTheme.text.body,
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#F44336',
  },
  ratingsSection: {
    padding: 16,
    backgroundColor: RetroTheme.colors.layer2,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.borderLight,
  },
  ratingsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  ratingCard: {
    width: '48%' as const,
    backgroundColor: RetroTheme.colors.layer3,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center' as const,
    ...RetroTheme.shadows.small,
  },
  ratingSourceLabel: {
    ...RetroTheme.text.caption,
    fontSize: 11,
    color: RetroTheme.colors.textSecondary,
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  ratingSourceValue: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.primary,
    lineHeight: 36,
  },
  ratingSourceMax: {
    ...RetroTheme.text.body,
    fontSize: 14,
    color: RetroTheme.colors.textSecondary,
    marginTop: -4,
  },
  ratingSourceVotes: {
    ...RetroTheme.text.caption,
    fontSize: 10,
    color: RetroTheme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.borderLight,
    backgroundColor: RetroTheme.colors.layer2,
  },
  screenshotsList: {
    paddingVertical: 8,
  },
  screenshotItem: {
    marginRight: 12,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    overflow: 'hidden' as const,
    ...RetroTheme.shadows.medium,
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
    backgroundColor: RetroTheme.colors.layer1,
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
    color: RetroTheme.colors.primary,
    fontWeight: 'bold' as const,
  },
  platformsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  platformTag: {
    backgroundColor: RetroTheme.colors.layer3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RetroTheme.borderRadius.sm,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    marginRight: 8,
    marginBottom: 8,
    ...RetroTheme.shadows.small,
  },
  platformText: {
    ...RetroTheme.text.caption,
    color: RetroTheme.colors.text,
  },
  companiesContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  companyChip: {
    backgroundColor: RetroTheme.colors.layer3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    ...RetroTheme.shadows.small,
  },
  companyChipText: {
    ...RetroTheme.text.body,
    fontSize: 14,
    color: RetroTheme.colors.text,
    fontWeight: 'bold' as const,
    marginRight: 6,
  },
  companyChipRole: {
    ...RetroTheme.text.caption,
    fontSize: 11,
    color: RetroTheme.colors.textSecondary,
    backgroundColor: RetroTheme.colors.layer1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  companyRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.border,
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
    backgroundColor: RetroTheme.colors.layer2,
    borderTopWidth: 2,
    borderTopColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.large,
  },
  floatingRateButton: {
    ...RetroTheme.buttons.primary,
    paddingVertical: 14,
    borderRadius: RetroTheme.borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  floatingRateButtonText: {
    ...RetroTheme.text.button,
    fontSize: 16,
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
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.lg,
    padding: 16,
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.large,
  },
  modalTitle: {
    ...RetroTheme.text.h2,
    textAlign: 'center' as const,
    marginBottom: 12,
    color: RetroTheme.colors.primary,
  },
  modalRatingSection: {
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  modalLabel: {
    ...RetroTheme.text.body,
    fontWeight: 'bold' as const,
    marginBottom: 6,
  },
  modalReviewSection: {
    marginBottom: 12,
  },
  modalScrollView: {
    maxHeight: Dimensions.get('window').height * 0.9,
  },
  modalSubtitle: {
    ...RetroTheme.text.caption,
    textAlign: 'center' as const,
    marginBottom: 12,
    color: RetroTheme.colors.textSecondary,
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoryRow: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: RetroTheme.colors.borderLight,
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryName: {
    ...RetroTheme.text.body,
    fontWeight: '600' as const,
    flex: 1,
    color: RetroTheme.colors.text,
    fontSize: 14,
  },
  infoIcon: {
    fontSize: 14,
    color: RetroTheme.colors.primary,
    paddingHorizontal: 6,
  },
  overallSection: {
    alignItems: 'center' as const,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: RetroTheme.colors.layer1,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.primary,
  },
  overallLabel: {
    ...RetroTheme.text.body,
    fontWeight: 'bold' as const,
    marginBottom: 6,
    color: RetroTheme.colors.primary,
    fontSize: 14,
  },
  reviewInput: {
    backgroundColor: RetroTheme.colors.layer1,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    borderRadius: RetroTheme.borderRadius.md,
    padding: 10,
    ...RetroTheme.text.body,
    color: RetroTheme.colors.text,
    textAlignVertical: 'top' as const,
    minHeight: 60,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  modalCancelButton: {
    ...RetroTheme.buttons.outlined,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RetroTheme.borderRadius.md,
    flex: 0.45,
  },
  modalCancelText: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.primary,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  modalSaveButton: {
    ...RetroTheme.buttons.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RetroTheme.borderRadius.md,
    flex: 0.45,
  },
  modalSaveText: {
    ...RetroTheme.text.button,
    textAlign: 'center' as const,
  },
  tapToViewReviews: {
    ...RetroTheme.text.caption,
    fontSize: 10,
    color: RetroTheme.colors.primary,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  // Community Reviews Modal Styles
  communityReviewsModal: {
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.lg,
    width: Dimensions.get('window').width * 0.92,
    maxHeight: Dimensions.get('window').height * 0.8,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.large,
  },
  communityReviewsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: RetroTheme.colors.borderLight,
  },
  communityReviewsTitle: {
    ...RetroTheme.text.h2,
    color: RetroTheme.colors.primary,
  },
  communityReviewsClose: {
    fontSize: 24,
    color: RetroTheme.colors.text,
    fontWeight: 'bold' as const,
    padding: 4,
  },
  communityReviewsLoading: {
    padding: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  communityReviewsEmpty: {
    padding: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyReviewsText: {
    ...RetroTheme.text.body,
    color: RetroTheme.colors.textSecondary,
  },
  communityReviewsList: {
    padding: 16,
  },
  communityReviewItem: {
    backgroundColor: RetroTheme.colors.layer1,
    borderRadius: RetroTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    padding: 12,
    marginBottom: 12,
    ...RetroTheme.shadows.small,
  },
  reviewItemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  reviewUserInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  reviewUserDetails: {
    flexDirection: 'column' as const,
    gap: 2,
    flex: 1,
  },
  reviewUserNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  reviewUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
  },
  reviewUserAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RetroTheme.colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
  },
  reviewUserAvatarText: {
    ...RetroTheme.text.body,
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.background,
  },
  reviewUsername: {
    ...RetroTheme.text.body,
    fontWeight: 'bold' as const,
    color: RetroTheme.colors.text,
    fontSize: 14,
  },
  reviewStatusBadge: {
    backgroundColor: RetroTheme.colors.layer2,
    borderRadius: RetroTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: RetroTheme.colors.borderLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  reviewStatusText: {
    ...RetroTheme.text.body,
    fontSize: 9,
    color: RetroTheme.colors.primary,
    fontWeight: '600' as const,
  },
  reviewCategoryChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 8,
  },
  reviewCategoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: RetroTheme.colors.layer2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RetroTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: RetroTheme.colors.borderLight,
  },
  reviewCategoryIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  reviewCategoryValue: {
    ...RetroTheme.text.caption,
    fontSize: 11,
    fontWeight: '600' as const,
    color: RetroTheme.colors.primary,
  },
  reviewItemText: {
    ...RetroTheme.text.body,
    lineHeight: 20,
    marginBottom: 8,
    color: RetroTheme.colors.text,
  },
  reviewItemDate: {
    ...RetroTheme.text.caption,
    fontSize: 11,
    color: RetroTheme.colors.textSecondary,
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
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: RetroTheme.colors.layer2,
    padding: 24,
    borderRadius: RetroTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: RetroTheme.colors.borderLight,
    ...RetroTheme.shadows.large,
    alignItems: 'center' as const,
  },
  loadingOverlayText: {
    ...RetroTheme.text.body,
    marginTop: 12,
    color: RetroTheme.colors.text,
  },
};

export default GameDetailsScreen;