# QuestLog - System Patterns

## Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │────│    Supabase      │    │   Local Game    │
│   (Frontend)    │    │  (User Data)     │    │   Database      │
└─────────────────┘    └──────────────────┘    │ (popular-games  │
        │                        │             │     .json)      │
        │              ┌─────────────────┐     └─────────────────┘
        └──────────────│ LocalGameService│             │
                       │  (Game Search)  │─────────────┘
                       └─────────────────┘
```

**Local-First Architecture**: 
- Game data served from local JSON database for instant performance
- User data (libraries, progress) stored in Supabase for persistence
- No external API dependencies for core game search functionality

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
1. **Game Search**: LocalGameService provides instant search from local JSON database
2. **Popular Games**: Curated list of 20+ games with rich metadata (ratings, genres, platforms)
3. **Game Selection**: Choose from search results or popular games
4. **Library Addition**: Save to user's personal game library via Supabase
5. **Status Tracking**: Mark games as wishlist, playing, completed, etc.

### Game Database Pattern
- **Local JSON**: `src/data/popular-games.json` contains curated game collection
- **Service Layer**: `LocalGameService` provides IGDB-compatible interface
- **Search Functionality**: Title-based search with instant results
- **Metadata Structure**: ID, name, summary, rating, genres, platforms, cover art
- **Performance**: Zero latency, no network dependencies, mobile-optimized

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

### LocalGameService
- **searchGames()**: Search local database by title
- **getPopularGames()**: Retrieve curated popular games list
- **convertToIGDBFormat()**: Maintain compatibility with IGDB interface
- **getAllGenres()**: Get available game genres for filtering
- **Performance**: All operations are synchronous and instant

### AuthContext
- **Global State**: User session management across app
- **Session Monitoring**: Real-time auth state changes with detailed logging
- **Protected Routes**: Authentication guards for secure screens

## Performance Optimizations
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: WebP format, progressive loading
- **List Virtualization**: FlatList for large datasets
- **Memory Management**: Cleanup on unmount
- **API Batching**: Combine related requests
- **OAuth Caching**: Efficient session management and renewal