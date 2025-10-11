# QuestLog - Technical Context

## Technology Stack

### Frontend - React Native
- **Platform**: Cross-platform mobile (iOS/Android)
- **Navigation**: React Navigation for screen management
- **State Management**: TBD (Context API vs Redux Toolkit)
- **UI Framework**: Custom components with retro styling
- **Animations**: Reanimated for smooth micro-interactions

### Backend - Supabase
- **Database**: PostgreSQL with RLS (Row Level Security)
- **Authentication**: Built-in auth with social providers
- **Real-time**: Subscriptions for live updates
- **Storage**: File uploads for user avatars, game screenshots
- **Edge Functions**: Custom logic processing

### Game Data Strategy
- **Local Database**: JSON file with curated popular games (20+ titles)
- **LocalGameService**: Custom service providing IGDB-compatible interface
- **No External APIs**: Eliminates CORS issues, rate limits, and network dependencies
- **Instant Performance**: All game searches and data access are synchronous
- **Offline First**: Complete functionality without internet connection

## Development Environment
- **Package Manager**: npm/yarn
- **Development**: Expo CLI for rapid iteration
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript throughout

## Technical Constraints
- **Mobile Performance**: 60fps target, minimal bundle size
- **Offline Capability**: Core features work without internet
- **Battery Optimization**: Efficient API calls, background processing
- **Platform Guidelines**: iOS/Android design standards
- **Accessibility**: Screen reader support, color contrast

## Key Dependencies
```json
{
  "react-native": "latest",
  "expo": "~49.0.0",
  "@supabase/supabase-js": "^2.x",
  "react-navigation": "^6.x",
  "react-native-reanimated": "^3.x",
  "react-dom": "web platform support",
  "react-native-web": "web platform support"
}
```

## Local Development Setup
- **Node.js**: Required for npm and development tools
- **Web Testing**: http://localhost:8081 for browser-based testing
- **Mobile Testing**: Expo Go app for device testing
- **No Server Dependencies**: All game data served from local JSON files

## Development Workflow
- **Environment**: Local development with Expo Go
- **Database**: Supabase local development setup
- **Deployment**: EAS Build for production apps
- **Version Control**: Git with conventional commits
- **Documentation**: README + inline code comments