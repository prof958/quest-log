# QuestLog - System Patterns

## Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │────│    Supabase      │────│   RAWG API      │
│   (Frontend)    │    │   (Backend)      │    │ (Game Data)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │              ┌─────────────────┐                │
        └──────────────│ Local Storage   │────────────────┘
                       │ (SQLite/MMKV)   │
                       └─────────────────┘
```

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

### Game Logging Flow
1. Search games (RAWG API + local cache)
2. Select game → Pre-populate metadata
3. User input → Status, rating, notes
4. Save → Local storage + Supabase sync
5. XP calculation → Quest progress update

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
├── AuthProvider
├── ThemeProvider (Retro styling)
├── NavigationContainer
│   ├── TabNavigator (Bottom tabs)
│   │   ├── GameLibrary
│   │   ├── QuestLog
│   │   ├── Profile
│   └── StackNavigator (Modals)
│       ├── GameDetail
│       ├── AddGame
│       └── Settings
```

## Performance Optimizations
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: WebP format, progressive loading
- **List Virtualization**: FlatList for large datasets
- **Memory Management**: Cleanup on unmount
- **API Batching**: Combine related requests