# QuestLog App - Screen Flow & Integration Analysis

## Complete Screen Structure

### 1. **Authentication Flow**
```
LoginScreen
├── SignUpScreen (email/password registration)
└── AuthSuccessScreen (OAuth redirect handling)
```

### 2. **Main App Flow** (Post-Authentication)
```
MainAppScreen (Hub)
├── Home View (default)
│   ├── Stats Overview (games count, XP, level)
│   ├── Quick Actions
│   │   ├── Add Game → GameSearchScreen
│   │   ├── View Library → Library View
│   │   └── Profile → Profile View
│   └── Recent Activity
├── GameSearchScreen
│   ├── Search Bar (Enter to search IGDB)
│   ├── Popular Games List
│   └── Search Results → GameDetailsScreen
├── GameDetailsScreen
│   ├── Game Information (from IGDB)
│   ├── User Rating & Review Modal
│   ├── Library Status Buttons
│   └── Back → GameSearchScreen
├── Library View
│   └── User's Game Collection (from database)
└── Profile View
    └── User Stats & Settings
```

## Screen Integration Points

### Flow 1: Adding a Game & Rating It

```
Home → Search → Select Game → GameDetails → Rate → Save ✓
```

**Step by Step:**
1. User taps "Add Game" on Home
2. `MainAppScreen` sets `currentView = 'search'`
3. `GameSearchScreen` renders with IGDB games
4. User taps a game
5. `handleGameSelect(game)` called
6. `MainAppScreen` sets `selectedGameId` and `currentView = 'gameDetails'`
7. `GameDetailsScreen` renders with game data
8. User taps "Rate & Review" button
9. Rating modal opens
10. User selects stars (1-5) → converted to 1-10 scale
11. User writes review (optional)
12. User taps "Save"
13. `handleSaveRating()` → `UserRatingService.rateGame()`
14. Data saved to `user_game_ratings` table in Supabase
15. Game added to `user_game_library` if not already there

### Flow 2: Managing Library Status

```
GameDetails → Status Button → Database Update ✓
```

**Status Options:**
- 🎮 Playing
- ✅ Completed  
- 📋 Plan to Play
- ❌ Dropped
- ⚪ Not Played

**Database Operations:**
- Tapping status → `handleStatusChange(status)`
- Calls `UserRatingService.updateGameStatus()`
- Updates `user_game_library.status` field

### Flow 3: Navigation Back

```
GameDetails → Back → GameSearch → Back → Home ✓
```

## Data Flow Architecture

### IGDB Integration (Game Data)
```
GameSearchScreen/GameDetailsScreen
    ↓
IGDBService.getInstance()
    ↓
Supabase Edge Function (igdb-proxy)
    ↓
Multi-Layer Caching
    ↓
IGDB API (500k+ games)
```

### User Data Persistence (Ratings & Library)
```
GameDetailsScreen
    ↓
UserRatingService.getInstance()
    ↓
Supabase Client (supabase-js)
    ↓
PostgreSQL Database
    ├── user_game_ratings (ratings & reviews)
    ├── user_game_library (game collection)
    └── user_profiles (user info)
```

## Key State Management

### MainAppScreen State
```typescript
currentView: 'home' | 'search' | 'library' | 'profile' | 'gameDetails'
selectedGameId: number | null
userGames: IGDBGame[] // Local state (not persisted yet)
```

### GameDetailsScreen State
```typescript
game: IGDBGame | null          // From IGDB
userRating: number             // 1-5 stars (converted to/from 1-10 for DB)
userReview: string             // User's review text
userStatus: UserGameStatus     // Library status
isInLibrary: boolean           // Whether game is in user's library
showRatingModal: boolean       // Modal visibility
```

### AuthContext State (Global)
```typescript
user: User | null              // Current authenticated user
session: Session | null        // Auth session
loading: boolean               // Auth loading state
```

## Database Schema Integration

### Tables Used

**user_game_ratings** (9 columns)
- `id` (UUID)
- `user_id` (UUID) - FK to auth.users
- `igdb_game_id` (INTEGER) - Game ID from IGDB
- `rating` (INTEGER 1-10) - User's rating
- `review` (TEXT) - Optional review
- `play_status` (TEXT) - Status enum
- `hours_played` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**user_game_library** (6 columns)
- `id` (UUID)
- `user_id` (UUID) - FK to auth.users
- `igdb_game_id` (INTEGER)
- `status` (TEXT) - Library status enum
- `added_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**user_profiles** (6 columns)
- `id` (UUID) - PK, FK to auth.users
- `email` (TEXT)
- `username` (TEXT)
- `level` (INTEGER)
- `total_xp` (INTEGER)
- `created_at` / `updated_at`

## Current Issues & Solutions

### ✅ FIXED: Rating Conversion
- **Problem**: UI uses 1-5 stars, DB expects 1-10
- **Solution**: Convert on save (`rating * 2`) and load (`rating / 2`)

### ✅ FIXED: Validation
- **Problem**: Users could save without selecting stars
- **Solution**: Added validation to require rating > 0

### ✅ WORKING: Library Management
- **Status**: Games successfully added to library
- **Confirmed**: Database updates working

### 🔧 PENDING: Library View Integration
- **Current**: Library view shows local `userGames` state (not persistent)
- **Next**: Fetch from `user_game_library` table via `UserRatingService.getUserLibrary()`

### 🔧 PENDING: MainAppScreen State
- **Current**: `userGames` is local state that resets on app restart
- **Next**: Load from database on mount

## Next Steps for Full Integration

1. **Update Library View** to fetch from database:
```typescript
useEffect(() => {
  if (user && currentView === 'library') {
    loadUserLibrary();
  }
}, [user, currentView]);

const loadUserLibrary = async () => {
  const library = await UserRatingService.getInstance().getUserLibrary();
  // Fetch IGDB data for each game
  // Display with ratings and statuses
};
```

2. **Update Home Stats** to show real data from database

3. **Add Profile Data** loading from `user_profiles` table

4. **Implement Recent Activity** from database queries

## Testing Checklist

- [x] Authentication (Email & Google OAuth)
- [x] Game Search (IGDB Integration)
- [x] Game Details Display
- [x] Navigation between screens
- [x] Add game to library
- [x] Update library status
- [x] Rating validation
- [ ] Save rating & review (TEST THIS NOW)
- [ ] Load saved ratings on re-visit
- [ ] Library view from database
- [ ] Profile stats from database

## Current Status

**Working:**
- ✅ Full authentication system
- ✅ IGDB game search (500k+ games)
- ✅ Game details with rich metadata
- ✅ Library status updates
- ✅ Navigation flow

**Needs Testing:**
- 🧪 Rating & review save (validation fixed, ready to test)
- 🧪 Rating persistence and reload

**Needs Implementation:**
- 📋 Library view database integration
- 📋 Home screen database stats
- 📋 Profile data loading
