# IGDB Proxy Setup with Supabase Edge Functions

This document explains how to set up and deploy the IGDB API proxy using Supabase Edge Functions to solve CORS issues.

## Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g @supabase/cli
   ```

2. **Docker**: Required for local development
   - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

3. **IGDB API Credentials**: 
   - Client ID: `gsze9i35e02dozgjm8w397mmv6tj9q`
   - Client Secret: `o4zfr61x70szfcp5gbzlh4cg0j37jc`

## Local Development Setup

1. **Initialize Supabase** (if not already done):
   ```bash
   cd quest-log
   supabase init
   ```

2. **Start Supabase locally**:
   ```bash
   supabase start
   ```

3. **Set environment variables** for the Edge Function:
   ```bash
   # Copy the example env file
   cp supabase/.env.example supabase/.env
   
   # Edit supabase/.env with your IGDB credentials
   IGDB_CLIENT_ID=gsze9i35e02dozgjm8w397mmv6tj9q
   IGDB_CLIENT_SECRET=o4zfr61x70szfcp5gbzlh4cg0j37jc
   ```

4. **Deploy the function locally**:
   ```bash
   supabase functions serve igdb-proxy --env-file supabase/.env
   ```

## Testing Locally

1. **Test the Edge Function**:
   ```bash
   curl -X POST 'http://localhost:54321/functions/v1/igdb-proxy?endpoint=games' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: text/plain' \
     -d 'fields name; limit 5;'
   ```

2. **Test from your React Native app**:
   - Make sure your app is using the updated IGDBService
   - The service will automatically use your local Supabase instance

## Production Deployment

1. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Set production environment variables**:
   ```bash
   supabase secrets set IGDB_CLIENT_ID=gsze9i35e02dozgjm8w397mmv6tj9q
   supabase secrets set IGDB_CLIENT_SECRET=o4zfr61x70szfcp5gbzlh4cg0j37jc
   ```

3. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy igdb-proxy
   ```

## How It Works

1. **Client Request**: Your React Native app calls the IGDBService
2. **Edge Function**: IGDBService sends requests to our Supabase Edge Function
3. **IGDB API**: The Edge Function authenticates with Twitch and calls IGDB API
4. **Response**: Data flows back through the Edge Function to your app

```
React Native App → Supabase Edge Function → IGDB API
                ←                        ←
```

## Benefits

- ✅ **Solves CORS**: Edge Function runs server-side
- ✅ **Secure**: API credentials stored safely in Supabase
- ✅ **Token Management**: Automatic token refresh and caching
- ✅ **Error Handling**: Proper error responses and logging
- ✅ **Performance**: Token caching reduces API calls

## File Structure

```
quest-log/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   └── cors.ts
│   │   └── igdb-proxy/
│   │       └── index.ts
│   ├── config.toml
│   ├── .env
│   └── .env.example
└── QuestLogApp/
    └── src/
        └── services/
            └── IGDBService.ts  # Updated to use Edge Function
```

## Troubleshooting

1. **Function not found**: Make sure you've deployed the function
2. **Authentication errors**: Check your IGDB credentials in Supabase secrets
3. **CORS errors**: Ensure you're using the Edge Function, not direct IGDB calls
4. **Local development**: Make sure Docker is running and Supabase is started

## Next Steps

1. Test the local setup
2. Deploy to production
3. Monitor Edge Function logs in Supabase dashboard
4. Add additional endpoints as needed (upcoming games, detailed game info, etc.)