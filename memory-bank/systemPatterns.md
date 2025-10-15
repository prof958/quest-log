# QuestLog - System Patterns

## Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │────│    Supabase      │────│ Supabase Edge   │
│   (Frontend)    │    │ (User Data &     │    │   Functions     │
│                 │    │  Authentication) │    │  (IGDB Proxy)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        │              ┌─────────────────┐                │
        │              │ User Rating     │                │
        │              │ System Tables   │                │
        │              └─────────────────┘                │
        │                                                 │
        │              ┌─────────────────┐                │
        └──────────────│   IGDBService   │────────────────┘
                       │ (Game Search &  │
                       │  Data Access)   │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   IGDB API      │
                       │ (500k+ Games)   │
                       └─────────────────┘
```

**Hybrid Cloud Architecture**: 
- Game data from IGDB API (500k+ games) via Supabase Edge Functions proxy
- User data (ratings, libraries, progress) stored in Supabase with RLS policies
- Edge Function handles CORS restrictions and API authentication
- Comprehensive caching system for optimal mobile performance

## Key Design Patterns

### Component Architecture
- **Atomic Design**: Atoms → Molecules → Organisms → Templates
- **Composition over Inheritance**: Reusable component patterns
- **Custom Hooks**: Business logic separation from UI
- **Context Providers**: Global state management

### Data Flow
- **Unidirectional**: Props down, callbacks up
- **Optimistic Updates**: Immediate UI feedback
- **Background Sync**: Queue offline actions
- **Cache-First**: Local data with server sync

### State Management
```typescript
// Global State Structure
{
  user: UserProfile,
  games: GameCollection,
  quests: QuestProgress,
  xp: ExperienceData,
  ui: UIState
}
```

## Critical Implementation Paths

### Authentication Flow
1. **Entry Point**: LoginScreen with progressive disclosure (Begin Adventure button)
2. **OAuth Option**: Google OAuth button with signInWithGoogle() service method
3. **OAuth Process**: Supabase OAuth redirect → Google Console → Return with session
4. **Session Management**: AuthContext provides global auth state with comprehensive logging
5. **Protected Routes**: Auth state guards for authenticated-only screens
6. **Fallback**: Email/password authentication available as alternative

### Game Discovery & Selection Flow
1. **Game Search**: IGDBService provides comprehensive search through 500k+ games from IGDB API
2. **Popular Games**: Dynamic popular games list based on IGDB ratings and user community ratings
3. **Advanced Search**: Filter by genres, platforms, ratings, release dates via IGDB API
4. **Game Selection**: Choose from search results with rich metadata (cover art, screenshots, ratings)
5. **Library Addition**: Save to user's personal game library with status tracking via Supabase
6. **User Ratings**: Community-driven rating system separate from IGDB professional ratings
7. **Status Tracking**: Mark games as not_played, playing, completed, dropped, plan_to_play

### Game Database Pattern
- **IGDB API**: Comprehensive gaming database with 500k+ games via Twitch authentication
- **Supabase Edge Function**: `igdb-proxy` handles API authentication and CORS restrictions
- **Service Layer**: `IGDBService` provides comprehensive game data access with caching
- **Search Functionality**: Advanced search with filters (genres, platforms, ratings, release dates)
- **Metadata Structure**: Rich game data (name, summary, cover art, screenshots, videos, companies, ratings)
- **Performance**: Intelligent caching system with 1-hour TTL for optimal mobile performance
- **Offline Support**: Cached results provide offline functionality for recently accessed games

### XP System
- **Action Types**: Log game, write review, complete quest, daily login
- **Multipliers**: Streak bonuses, event multipliers
- **Level Formula**: Exponential curve (100, 250, 500, 1000...)
- **Rewards**: Badge unlocks, feature access, customization

### Retro UI Framework
- **Typography**: Pixel perfect fonts (PressStart2P, PixelOperator)
- **Color Palette**: Limited, high-contrast colors
- **Animations**: Scanline effects, CRT distortion
- **Sound Design**: 8-bit style feedback sounds
- **Layout**: Grid-based, console-inspired navigation

## Component Relationships
```
App
├── AuthProvider (AuthContext with comprehensive session logging)
├── ThemeProvider (Retro styling)
├── NavigationContainer
│   ├── AuthFlow (Unauthenticated)
│   │   ├── LoginScreen (Progressive disclosure + OAuth)
│   │   ├── SignUpScreen (Email/password fallback)
│   │   └── AuthSuccessScreen (OAuth return handling)
│   ├── TabNavigator (Bottom tabs - Authenticated)
│   │   ├── GameLibrary
│   │   ├── QuestLog
│   │   ├── Profile
│   └── StackNavigator (Modals)
│       ├── GameDetail
│       ├── AddGame
│       └── Settings
```

## Service Layer Architecture

### AuthService
- **signInWithGoogle()**: Supabase OAuth integration with comprehensive logging
- **signInWithEmail()**: Email/password authentication
- **signUp()**: User registration handling
- **signOut()**: Session cleanup and state reset

### IGDBService
- **searchGames()**: Search IGDB database with query and filters
- **getPopularGames()**: Retrieve highly-rated games from IGDB
- **getGameById()**: Get detailed game information including screenshots, videos, companies
- **searchGamesAdvanced()**: Advanced filtering by genres, platforms, ratings
- **getAllGenres()**: Get complete IGDB genres list
- **getAllPlatforms()**: Get complete IGDB platforms list
- **Caching**: Intelligent cache with TTL for performance optimization
- **Error Handling**: Graceful fallbacks and comprehensive error management

### UserRatingService
- **rateGame()**: Add or update user ratings (1-10 scale) with reviews
- **getUserRating()**: Get user's rating for specific game
- **getGameRatingStats()**: Community rating statistics and distribution
- **getCommunityReviews()**: Recent user reviews with profile information
- **addToLibrary()**: Manage user's game library with status tracking
- **getUserLibrary()**: Get user's complete game library with filtering
- **getTopRatedGames()**: Community-driven top-rated games list

### AuthContext
- **Global State**: User session management across app
- **Session Monitoring**: Real-time auth state changes with detailed logging
- **Protected Routes**: Authentication guards for secure screens

## Performance Optimizations
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: IGDB CDN integration with optimized image sizes
- **List Virtualization**: FlatList for large game datasets
- **Memory Management**: Cleanup on unmount, cache size management
- **API Caching**: Multi-layer caching system (memory cache + TTL management)
- **Edge Function Optimization**: Supabase Edge Functions for serverless scaling
- **Database Optimization**: Indexed queries, RLS policies, and database views for user ratings
- **Offline Support**: Intelligent cache fallbacks for offline functionality
- **Rate Limiting**: Built-in IGDB API rate limiting compliance (4 requests/second)