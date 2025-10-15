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
- **IGDB API Integration**: Comprehensive gaming database (500k+ games) via Twitch OAuth
- **Supabase Edge Functions**: Serverless proxy (`igdb-proxy`) handling authentication and CORS
- **IGDBService**: Full-featured service with caching, error handling, and mobile optimization
- **UserRatingService**: Separate user rating system with community reviews and library management
- **Intelligent Caching**: Multi-layer cache system with TTL management for offline support
- **Rate Limit Compliance**: Built-in handling of IGDB's 4 requests/second limit

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

## Infrastructure Setup
- **Supabase Project**: Database, Auth, and Edge Functions deployed
- **IGDB Credentials**: Twitch OAuth configured with Edge Function secrets
- **Database Schema**: User rating tables with RLS policies deployed
- **Edge Function**: `igdb-proxy` deployed and configured for IGDB API access

## Local Development Setup
- **Node.js**: Required for npm and development tools
- **Supabase CLI**: For Edge Function deployment and management
- **Web Testing**: http://localhost:8081 for browser-based testing  
- **Mobile Testing**: Expo Go app for device testing
- **Environment Variables**: IGDB credentials and Supabase configuration

## Development Workflow
- **Environment**: Local development with Expo Go
- **Database**: Supabase cloud database with local development
- **Edge Functions**: Deployed to Supabase for IGDB API integration
- **Deployment**: EAS Build for production apps
- **Version Control**: Git with conventional commits and memory bank updates
- **Documentation**: README + inline code comments