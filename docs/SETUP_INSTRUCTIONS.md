# Database Setup Instructions

## Step 1: Run Database Migration in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qrksbnjfqxknzedncdde
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `docs/user_rating_database_setup.sql` and paste it into the query editor
5. Click **Run** to execute the migration

This will create:
- `user_game_ratings` table for user ratings and reviews
- `user_game_library` table for user's game collections
- `user_profiles` table for user profile information
- All necessary indexes, RLS policies, and helper functions
- Views for statistics and community activity

## Step 2: Verify Edge Function Deployment

✅ **COMPLETED**: The IGDB proxy Edge Function has been deployed to:
`https://qrksbnjfqxknzedncdde.supabase.co/functions/v1/igdb-proxy`

Environment variables have been set:
- `IGDB_CLIENT_ID`
- `IGDB_CLIENT_SECRET`

## Step 3: Test the Integration

After running the database migration, you can test the IGDB integration:

1. Start the React Native app: `npm start` in the QuestLogApp directory
2. Try searching for games to verify IGDB API connection works
3. Test user authentication and rating functionality

## Current Status

✅ **Completed:**
- IGDBService implementation
- UserRatingService implementation
- Edge Function deployment
- Database migration scripts created

🔄 **Next Steps:**
1. Run database migration in Supabase Dashboard
2. Update GameSearchScreen to use IGDB data
3. Create GameDetailsScreen with rating system
4. End-to-end testing

## Architecture Overview

```
React Native App (IGDBService)
    ↓ HTTPS Request
Supabase Edge Function (igdb-proxy)
    ↓ OAuth + API Call
IGDB API (Twitch Gaming Database)
    ↓ Game Data Response
User Rating System (Supabase Database)
    ↓ Combined Data
Enhanced Game Information + Community Ratings
```

The system now provides:
- Comprehensive game data from IGDB (500k+ games)
- User-generated ratings and reviews
- Personal game library management
- Community statistics and recommendations
- Mobile-optimized architecture with offline caching