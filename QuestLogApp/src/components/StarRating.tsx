import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import { RetroTheme } from '../theme/RetroTheme';

interface StarRatingProps {
  rating: number; // 0-5, supports 0.5 increments
  maxStars?: number; // Default 5
  size?: number; // Star size in pixels
  interactive?: boolean; // If true, allows user to tap and change rating
  onRatingChange?: (rating: number) => void; // Callback when rating changes
  showNumber?: boolean; // Show numeric rating next to stars
  color?: string; // Star color
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 24,
  interactive = false,
  onRatingChange,
  showNumber = false,
  color = RetroTheme.colors.primary,
}) => {
  const containerRef = useRef<View>(null);

  const calculateRatingFromPosition = (x: number, containerWidth: number) => {
    if (!interactive || !onRatingChange) return;
    
    // Calculate which star and whether it's half or full
    const starWidth = containerWidth / maxStars;
    const starIndex = Math.floor(x / starWidth);
    const positionInStar = (x % starWidth) / starWidth;
    
    // Determine if it's a half star or full star
    let newRating: number;
    if (positionInStar < 0.5) {
      newRating = starIndex + 0.5;
    } else {
      newRating = starIndex + 1;
    }
    
    // Clamp between 1.0 and maxStars (minimum 1 star)
    newRating = Math.max(1.0, Math.min(maxStars, newRating));
    
    if (newRating !== rating) {
      onRatingChange(newRating);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      onPanResponderGrant: (evt) => {
        if (!interactive) return;
        containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          calculateRatingFromPosition(touchX, width);
        });
      },
      onPanResponderMove: (evt) => {
        if (!interactive) return;
        containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          calculateRatingFromPosition(touchX, width);
        });
      },
    })
  ).current;

  const handleStarPress = (starIndex: number, isHalf: boolean) => {
    if (!interactive || !onRatingChange) return;
    
    const newRating = starIndex + (isHalf ? 0.5 : 1);
    // Ensure minimum rating of 1.0
    if (newRating >= 1.0) {
      onRatingChange(newRating);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const isFilled = rating >= starValue;
    const isHalfFilled = rating >= starValue - 0.5 && rating < starValue;

    if (!interactive) {
      // Display-only mode - show star state using overlapping technique
      return (
        <View key={index} style={styles.starContainer}>
          {isHalfFilled ? (
            // Half star: empty star with filled star clipped to 50%
            <View style={{ position: 'relative' }}>
              <Text style={[styles.star, { fontSize: size, color: RetroTheme.colors.borderLight }]}>
                ☆
              </Text>
              <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
                <Text style={[styles.star, { fontSize: size, color }]}>
                  ★
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.star, { fontSize: size, color: isFilled ? color : RetroTheme.colors.borderLight }]}>
              {isFilled ? '★' : '☆'}
            </Text>
          )}
        </View>
      );
    }

    // Interactive mode - star with invisible overlay
    return (
      <View key={index} style={styles.starContainer}>
        {/* Background star (shows current state) */}
        {isHalfFilled ? (
          <View style={{ position: 'relative' }}>
            <Text style={[styles.star, { fontSize: size, color: RetroTheme.colors.borderLight }]}>
              ☆
            </Text>
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
              <Text style={[styles.star, { fontSize: size, color }]}>
                ★
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.star, { fontSize: size, color: isFilled ? color : RetroTheme.colors.borderLight }]}>
            {isFilled ? '★' : '☆'}
          </Text>
        )}
        
        {/* Invisible touchable overlay split in half */}
        <View style={styles.touchableOverlay}>
          {/* Left half - for half star */}
          <TouchableOpacity
            onPress={() => handleStarPress(index, true)}
            style={[styles.halfTouch, { width: size / 2, height: size }]}
            activeOpacity={0.5}
          />
          {/* Right half - for full star */}
          <TouchableOpacity
            onPress={() => handleStarPress(index, false)}
            style={[styles.halfTouch, { width: size / 2, height: size }]}
            activeOpacity={0.5}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View 
        ref={containerRef}
        style={styles.starsRow}
        {...(interactive ? panResponder.panHandlers : {})}
      >
        {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
      </View>
      {showNumber && (
        <Text style={[styles.numberText, { fontSize: size * 0.8 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starContainer: {
    position: 'relative',
  },
  star: {
    lineHeight: undefined,
    includeFontPadding: false,
  },
  touchableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
  },
  halfTouch: {
    // Invisible touchable areas
  },
  numberText: {
    color: RetroTheme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
});
