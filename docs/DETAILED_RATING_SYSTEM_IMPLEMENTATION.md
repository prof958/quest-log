# Detailed Rating System Implementation Guide

## Overview
Upgraded QuestLog's rating system from simple 1-5 stars to a comprehensive 5-category rating system with half-star support.

## ✅ Completed Components

### 1. Database Schema ✅
**File:** `docs/sql/detailed_rating_system_migration.sql`

Added 5 new columns to `user_game_ratings`:
- `rating_story` (DECIMAL 1-5 with 0.5 increments)
- `rating_gameplay` (DECIMAL 1-5 with 0.5 increments)
- `rating_audio` (DECIMAL 1-5 with 0.5 increments)
- `rating_visual` (DECIMAL 1-5 with 0.5 increments)
- `rating_joy` (DECIMAL 1-5 with 0.5 increments)

**To Deploy:**
```bash
# Run this SQL in Supabase SQL Editor
psql -h [your-supabase-host] -d postgres < docs/sql/detailed_rating_system_migration.sql
```

### 2. StarRating Component ✅
**File:** `QuestLogApp/src/components/StarRating.tsx`

Features:
- ✅ 1-5 stars with half-star support (⯨ symbol)
- ✅ Interactive mode for user input
- ✅ Display-only mode for showing ratings
- ✅ Customizable size, color
- ✅ Optional numeric display
- ✅ Half-star tap zones (left half = 0.5, right half = 1.0)

Usage:
```tsx
// Display mode
<StarRating rating={4.5} size={24} />

// Interactive mode
<StarRating 
  rating={userRating}
  interactive
  onRatingChange={(rating) => setUserRating(rating)}
  showNumber
/>
```

### 3. CategoryInfoModal Component ✅
**File:** `QuestLogApp/src/components/CategoryInfoModal.tsx`

Features:
- ✅ Modal popup with category description
- ✅ Pre-defined 5 categories with icons
- ✅ Short names for UI, full descriptions in modal
- ✅ Clean, themed design

Categories defined:
```typescript
export const RATING_CATEGORIES = [
  { id: 'story', shortName: 'Story', fullName: 'Story & Worldbuilding', ... },
  { id: 'gameplay', shortName: 'Gameplay', fullName: 'Gameplay & Mechanics', ... },
  { id: 'audio', shortName: 'Audio', fullName: 'Audio & Atmosphere', ... },
  { id: 'visual', shortName: 'Visual', fullName: 'Visual & Artistic Value', ... },
  { id: 'joy', shortName: 'Joy Factor', fullName: 'Joy Factor', ... },
];
```

### 4. UserRatingService Updates ✅
**File:** `QuestLogApp/src/services/UserRatingService.ts`

Changes:
- ✅ Added `CategoryRatings` interface
- ✅ Updated `UserGameRating` interface with category fields
- ✅ Updated `rateGame()` method signature:
  ```typescript
  public async rateGame(
    igdbGameId: number,
    rating: number,
    review?: string,
    playStatus?: UserGameRating['play_status'],
    hoursPlayed?: number,
    categoryRatings?: CategoryRatings  // NEW
  )
  ```
- ✅ Auto-calculates overall rating from categories (average * 2 for 1-10 scale)
- ✅ Database insert/update includes all category fields

## 🚧 Remaining Work

### 5. GameDetailsScreen UI Refactor
**File:** `QuestLogApp/src/screens/GameDetailsScreen.tsx`

**Current State:**
- Single 1-5 star rating input
- Simple modal with TextInput for review

**Needed Changes:**

#### A. Add State for Category Ratings
```typescript
const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>({
  story: 0,
  gameplay: 0,
  audio: 0,
  visual: 0,
  joy: 0,
});
const [selectedCategory, setSelectedCategory] = useState<RatingCategory | null>(null);
const [showCategoryInfo, setShowCategoryInfo] = useState(false);
```

#### B. Update `loadUserGameData()` 
Load category ratings from database:
```typescript
if (userGame?.rating) {
  setCategoryRatings({
    story: userGame.rating.rating_story || 0,
    gameplay: userGame.rating.rating_gameplay || 0,
    audio: userGame.rating.rating_audio || 0,
    visual: userGame.rating.rating_visual || 0,
    joy: userGame.rating.rating_joy || 0,
  });
}
```

#### C. Redesign Rating Modal
Replace current modal with:
```tsx
<Modal visible={showRatingModal}>
  <ScrollView>
    {/* Header */}
    <Text style={styles.modalTitle}>Rate {game?.name}</Text>
    
    {/* Category Ratings */}
    {RATING_CATEGORIES.map(category => (
      <View key={category.id} style={styles.categoryRow}>
        {/* Category name with info button */}
        <TouchableOpacity onPress={() => {
          setSelectedCategory(category);
          setShowCategoryInfo(true);
        }}>
          <Text>{category.icon} {category.shortName}</Text>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </TouchableOpacity>
        
        {/* Star rating for this category */}
        <StarRating
          rating={categoryRatings[category.id] || 0}
          interactive
          onRatingChange={(rating) => {
            setCategoryRatings(prev => ({
              ...prev,
              [category.id]: rating
            }));
          }}
          size={28}
        />
      </View>
    ))}
    
    {/* Overall Rating (calculated) */}
    <View style={styles.overallRow}>
      <Text>Overall Rating</Text>
      <StarRating 
        rating={calculateOverallRating(categoryRatings)} 
        size={32}
      />
    </View>
    
    {/* Review TextInput */}
    <TextInput
      value={userReview}
      onChangeText={setUserReview}
      placeholder="Write your review..."
      multiline
    />
    
    {/* Save Button */}
    <TouchableOpacity onPress={handleSaveRating}>
      <Text>Save Rating</Text>
    </TouchableOpacity>
  </ScrollView>
  
  {/* Category Info Modal */}
  <CategoryInfoModal
    visible={showCategoryInfo}
    category={selectedCategory}
    onClose={() => setShowCategoryInfo(false)}
  />
</Modal>
```

#### D. Update `handleSaveRating()`
Pass category ratings to service:
```typescript
const handleSaveRating = async () => {
  // Validate at least one category is rated
  const hasRatings = Object.values(categoryRatings).some(r => r > 0);
  if (!hasRatings) {
    Alert.alert('Please rate at least one category');
    return;
  }
  
  // Calculate overall from categories
  const overall = calculateOverallRating(categoryRatings);
  
  // Save with categories
  const result = await UserRatingService.getInstance().rateGame(
    gameId,
    overall,
    userReview,
    userStatus,
    undefined,
    categoryRatings  // Pass categories
  );
  
  // Log activity
  await ActivityLogService.logActivity(
    user.id,
    gameId,
    game.name,
    'rated',
    { rating: overall, categoryRatings, review: userReview }
  );
};
```

#### E. Helper Function
```typescript
const calculateOverallRating = (categories: CategoryRatings): number => {
  const ratings = Object.values(categories).filter(r => r > 0);
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
};
```

### 6. Display Category Ratings
**Location:** Game details screen, below game info

**Current:** Shows single star rating  
**New:** Show all 5 categories in compact view

```tsx
{/* User Rating Section */}
{isInLibrary && categoryRatings && (
  <View style={styles.userRatingSection}>
    <Text style={styles.sectionTitle}>Your Rating</Text>
    
    {/* Compact category display */}
    <View style={styles.categoriesGrid}>
      {RATING_CATEGORIES.map(cat => (
        <View key={cat.id} style={styles.categoryMini}>
          <Text style={styles.categoryIcon}>{cat.icon}</Text>
          <StarRating 
            rating={categoryRatings[cat.id] || 0}
            size={16}
          />
        </View>
      ))}
    </View>
    
    {/* Overall */}
    <View style={styles.overallRating}>
      <Text>Overall</Text>
      <StarRating 
        rating={calculateOverallRating(categoryRatings)}
        size={24}
        showNumber
      />
    </View>
  </View>
)}
```

### 7. LibraryScreen Integration
**File:** `QuestLogApp/src/screens/LibraryScreen.tsx`

**Changes Needed:**
- Show category ratings in expanded game cards
- Display overall rating badge on cards
- Optional: Filter/sort by specific categories

**Suggested UI:**
```tsx
{/* In game card */}
<View style={styles.ratingBadge}>
  <StarRating rating={game.rating?.overall} size={14} showNumber />
</View>

{/* When expanded */}
{expanded && game.rating && (
  <View style={styles.categoryRatings}>
    {RATING_CATEGORIES.map(cat => (
      <View key={cat.id}>
        <Text>{cat.shortName}</Text>
        <StarRating rating={game.rating[`rating_${cat.id}`]} size={12} />
      </View>
    ))}
  </View>
)}
```

## Implementation Checklist

- [x] Create database migration SQL
- [x] Create StarRating component  
- [x] Create CategoryInfoModal component
- [x] Update UserRatingService interfaces
- [x] Update UserRatingService.rateGame() method
- [ ] Update GameDetailsScreen state management
- [ ] Redesign GameDetailsScreen rating modal
- [ ] Update handleSaveRating() to pass categories
- [ ] Add category ratings display to game details
- [ ] Update LibraryScreen to show category ratings
- [ ] Test database save/load
- [ ] Test UI interactions
- [ ] Deploy database migration to Supabase

## Testing Plan

1. **Database:**
   - Run migration in Supabase
   - Verify columns exist with correct constraints
   - Test insert with category ratings

2. **Components:**
   - Test StarRating half-star selection
   - Test CategoryInfoModal display
   - Verify touch targets work properly

3. **End-to-End:**
   - Rate a game with all 5 categories
   - Verify overall is calculated correctly
   - Reload game details, verify ratings persist
   - Check LibraryScreen displays correctly
   - Verify activity log records categories

## Migration Strategy

### Option A: Immediate Cutover (Recommended for Early Access)
- Deploy all changes at once
- Existing ratings become "overall only" (no category breakdown)
- New ratings use full system

### Option B: Gradual Migration
- Support both old (simple) and new (detailed) rating UI
- Add "Use detailed ratings" toggle
- Migrate users gradually

**Recommendation:** Option A - Clean break, better UX, simpler code

## Estimated Effort

- GameDetailsScreen refactor: 2-3 hours
- LibraryScreen updates: 1 hour
- Testing & polish: 1-2 hours
- **Total: 4-6 hours**

## Next Steps

1. Run database migration in Supabase
2. Update GameDetailsScreen with new rating UI
3. Test thoroughly on device
4. Update LibraryScreen display
5. Deploy and validate

---

**Status:** Components ready, GameDetailsScreen refactor in progress  
**Last Updated:** 2025-10-23
