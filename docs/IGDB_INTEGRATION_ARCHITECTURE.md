# IGDB Integration Architecture Design

## Overview
Integration architecture for IGDB API using Supabase Edge Functions as a CORS proxy, enabling direct mobile app access to comprehensive game data while implementing user-specific ratings.

## Architecture Diagram

```
Mobile App (React Native)
├── IGDBService (Client)
├── UserRatingService (Client)
└── Supabase Integration
    ├── Edge Function: igdb-proxy
    │   ├── Authentication (Twitch OAuth)
    │   ├── CORS Headers
    │   ├── Rate Limiting
    │   └── Response Caching
    └── Database Tables
        ├── user_game_ratings
        ├── user_game_library 
        └── cached_games (optional)
```

## Components

### 1. Supabase Edge Function: `igdb-proxy`
**Purpose**: Acts as authenticated proxy between mobile app and IGDB API
- **Authentication**: Manages Twitch OAuth client credentials
- **CORS Handling**: Enables browser/mobile app requests
- **Rate Limiting**: Respects IGDB's 4 req/sec limit
- **Caching**: Optional response caching to reduce API calls
- **Error Handling**: Graceful fallbacks and error responses

### 2. IGDB Service (Client)
**Purpose**: Mobile app service for game data operations
- **Search Games**: Query IGDB via proxy for game search
- **Get Game Details**: Fetch comprehensive game information
- **Popular Games**: Get trending/popular games
- **Genre/Platform Filtering**: Advanced search capabilities
- **Format Conversion**: Convert IGDB response to app-compatible format

### 3. User Rating System
**Purpose**: User-generated ratings separate from IGDB ratings
- **Database Tables**:
  - `user_game_ratings`: Individual user ratings for games
  - `user_game_library`: User's personal game collection
  - `user_rating_aggregates`: Computed average user ratings per game

### 4. Hybrid Rating Display
**Purpose**: Show both IGDB official ratings and user community ratings
- **IGDB Rating**: Professional critics and IGDB user ratings
- **Community Rating**: Our app's user-generated ratings
- **Combined Score**: Weighted combination for discovery

## Database Schema

### User Game Ratings Table
```sql
CREATE TABLE user_game_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  igdb_game_id INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  gameplay_hours INTEGER,
  completion_status TEXT CHECK (completion_status IN ('playing', 'completed', 'dropped', 'wishlist')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, igdb_game_id)
);
```

### User Game Library Table
```sql
CREATE TABLE user_game_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  igdb_game_id INTEGER NOT NULL,
  game_name TEXT NOT NULL,
  game_cover_url TEXT,
  status TEXT DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'playing', 'completed', 'dropped')),
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_started TIMESTAMP WITH TIME ZONE,
  date_completed TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, igdb_game_id)
);
```

### User Rating Aggregates (Materialized View)
```sql
CREATE MATERIALIZED VIEW user_rating_aggregates AS
SELECT 
  igdb_game_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(*) FILTER (WHERE completion_status = 'completed') as completed_count
FROM user_game_ratings 
GROUP BY igdb_game_id;
```

## Implementation Strategy

### Phase 1: IGDB Proxy Setup
1. **Create Supabase Edge Function**
   - Handle Twitch OAuth authentication
   - Implement CORS headers
   - Add basic rate limiting
   - Proxy common IGDB endpoints

2. **Environment Configuration**
   - Store Twitch Client ID/Secret in Supabase secrets
   - Configure Edge Function deployment

### Phase 2: Mobile Service Integration
1. **Update IGDBService**
   - Replace RAWG endpoints with IGDB proxy calls
   - Handle IGDB response format
   - Implement error handling and retries
   - Add offline/fallback behavior

2. **Implement Caching Strategy**
   - Local storage for popular games
   - Session caching for search results
   - Background refresh for cached data

### Phase 3: User Rating System
1. **Database Setup**
   - Create user rating tables
   - Set up RLS policies
   - Create database functions for aggregates

2. **Rating UI Components**
   - Star rating component
   - Review input form
   - Rating display with IGDB + user ratings
   - Library management interface

### Phase 4: Advanced Features
1. **Smart Recommendations**
   - Based on user ratings and library
   - Similar games suggestions
   - Community trending games

2. **Social Features**
   - Share game libraries
   - Compare ratings with friends
   - Community game discussions

## Technical Benefits

### Performance
- **Fast Local Responses**: Cached popular games for instant loading
- **Optimized API Usage**: Intelligent caching reduces IGDB calls
- **Mobile Optimized**: Compressed responses and efficient data structures

### Scalability
- **Serverless Architecture**: Supabase Edge Functions scale automatically
- **Rate Limit Compliant**: Built-in handling of IGDB rate limits
- **Cost Effective**: Pay-per-use model, no fixed server costs

### User Experience
- **Comprehensive Data**: 500k+ games with rich metadata
- **Personalized Ratings**: User community ratings alongside professional ratings
- **Offline Capability**: Cached data enables offline browsing
- **Cross-Platform Sync**: User data syncs across devices

## Security & Privacy
- **API Key Protection**: Twitch credentials stored securely in Supabase
- **User Data Privacy**: RLS policies ensure users only access their own data
- **Rate Limit Protection**: Prevents abuse and API quota exhaustion
- **HTTPS Only**: All communications encrypted

## Migration Path
1. **Parallel Implementation**: Build IGDB integration alongside existing local database
2. **Gradual Migration**: Start with search, then popular games, then full catalog
3. **User Migration**: Import existing user data to new rating system
4. **Performance Testing**: Ensure mobile performance meets standards
5. **Full Cutover**: Switch to IGDB as primary data source

This architecture provides comprehensive game data while enabling user-specific features and maintaining excellent mobile performance.