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

### External APIs
- **RAWG API**: Game database, metadata, artwork
- **Rate Limiting**: Caching strategy for API calls
- **Offline Support**: Local storage for critical data

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
  "react-native-reanimated": "^3.x"
}
```

## Development Workflow
- **Environment**: Local development with Expo Go
- **Database**: Supabase local development setup
- **Deployment**: EAS Build for production apps
- **Version Control**: Git with conventional commits
- **Documentation**: README + inline code comments