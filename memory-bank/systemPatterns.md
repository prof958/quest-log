# QuestLog - System Patterns

## Enhanced Architecture with Multi-Layer Caching
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │────│    Supabase      │────│ Enhanced Edge   │
│   (Frontend)    │    │ (User Data &     │    │   Functions     │
│ + Local Cache   │    │  Authentication) │    │ + DB Caching    │
│   (30min TTL)   │    │ + Cache Tables   │    │ + Rate Queue    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │              ┌─────────────────┐                │
        │              │ Enhanced Cache  │                │
        │              │ Management:     │                │
        │              │ • igdb_cache    │                │
        │              │ • cache_stats   │                │
        │              │ • rate_log      │                │
        │              └─────────────────┘                │
        │                        │                        │
        │              ┌─────────────────┐                │
        │              │ User Rating     │                │
        │              │ System Tables   │                │
        │              └─────────────────┘                │
        │                                                 │
        │              ┌─────────────────┐                │
        └──────────────│ Enhanced IGDB   │────────────────┘
                       │ Service:        │
                       │ • Dual Caching  │
                       │ • Performance   │
                       │ • Monitoring    │
                       └─────────────────┘
                                │
                    ┌──────────────────────┐
                    │ Rate-Limited Queue   │
                    │ (4 req/sec max)      │
                    │ ↓                    │
                    │ IGDB API (500k+)     │
                    └──────────────────────┘
```

**Production-Ready Hybrid Cloud Architecture**: 
- **Multi-layer caching**: Client (30min) + Server (variable TTL) + Database cache
- **Rate limit compliance**: Request queue ensuring 4 req/sec IGDB limits never exceeded
- **Performance monitoring**: Real-time cache statistics and automated insights
- **Scalable design**: Handles 50+ concurrent users with 5.7x+ performance improvements
- **Error resilience**: Cache failures don't break app functionality

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

### Mobile-Optimized Authentication Flow
1. **Entry Point**: LoginScreen with progressive disclosure (Begin Adventure button)
2. **OAuth Option**: Google OAuth button with mobile-optimized signInWithGoogle() method
3. **Mobile OAuth Process**: 
   - WebBrowser.openAuthSessionAsync() opens OAuth session (not regular browser)
   - User authenticates with Google in OAuth session
   - WebBrowser returns callback URL with tokens to app
   - Manual session creation using QueryParams parsing and supabase.auth.setSession()
4. **Session Management**: AuthContext provides global auth state with automatic session handling
5. **Protected Routes**: Auth state guards for authenticated-only screens  
6. **Fallback**: Email/password authentication available as alternative
7. **Error Handling**: Clean error states without false failure popups

### Game Discovery & Selection Flow
1. **Game Search**: IGDBService provides comprehensive search through 500k+ games from IGDB API
2. **Popular Games**: Dynamic popular games list based on IGDB ratings and user community ratings
3. **Advanced Search**: Filter by genres, platforms, ratings, release dates via IGDB API
4. **Game Selection**: Choose from search results with rich metadata (cover art, screenshots, ratings)
5. **Library Addition**: Save to user's personal game library with status tracking via Supabase
6. **User Ratings**: Community-driven rating system separate from IGDB professional ratings
7. **Status Tracking**: Mark games as not_played, playing, completed, dropped, plan_to_play

### Enhanced Game Database Pattern with Production Caching
- **IGDB API**: Comprehensive gaming database with 500k+ games via Twitch authentication
- **Enhanced Edge Function**: `igdb-proxy` with database caching, rate limiting, and queue management
- **Multi-Layer Caching**: 
  - Client cache (30 minutes) for instant responses
  - Database cache (variable TTL: Popular 3 days, Search 4 hours, Regular 24 hours)
  - Request queue system maintaining 4 req/sec IGDB compliance
- **Performance Monitoring**: Real-time cache statistics, hit rates, response times

## Clean Project Organization Pattern

### Documentation Structure (Organized & Professional)
```
docs/
├── README.md              # Documentation index and navigation
├── oauth/                 # Authentication & OAuth documentation
│   ├── OAUTH_PRODUCTION_GUIDE.md
│   ├── OAUTH_SETUP.md
│   └── OAUTH_TROUBLESHOOTING.md
├── sql/                   # Database schemas and migrations
│   ├── database_schema.sql
│   ├── COMPLETE_FIX_NEW_USER_OAUTH.sql
│   └── igdb_cache_system_migration.sql
├── setup/                 # Environment and project setup
│   ├── SUPABASE_SETUP.md
│   └── SETUP_INSTRUCTIONS.md
├── database/              # Architecture and implementation
│   ├── IGDB_INTEGRATION_ARCHITECTURE.md
│   └── ENHANCED_CACHING_IMPLEMENTATION.md
└── testing/               # Testing utilities and scripts
```

### Service Layer Clean Architecture
- **AuthService**: Mobile OAuth + email authentication (clean, no demo code)
- **IGDBService**: Production IGDB integration with caching (no LocalGameService)
- **UserRatingService**: User ratings and library management
- **No Legacy Code**: Removed obsolete LocalGameService, DemoAuthService, test utilities
- **Service Layer**: Enhanced `IGDBService` with performance tracking and dual-layer caching
- **Search Functionality**: Advanced search with filters, now cached for optimal performance
- **Metadata Structure**: Rich game data (name, summary, cover art, screenshots, videos, companies, ratings)
- **Production Performance**: 5.7x+ speed improvements, 90%+ cache hit rate capability
- **Scalability**: Handles 50+ concurrent users without exceeding rate limits
- **Monitoring**: Real-time dashboard with cache performance insights and recommendations

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