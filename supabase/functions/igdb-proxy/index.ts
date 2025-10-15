import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface IGDBRequest {
  endpoint: string;
  body: string;
  method?: string;
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Initialize Supabase client for caching
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Rate limiting queue
let requestQueue: Array<() => Promise<void>> = []
let isProcessingQueue = false
let lastRequestTime = 0
const REQUEST_INTERVAL = 250 // 4 requests per second = 250ms between requests

// Cache for access token to avoid frequent token requests
let accessTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

// Cache configuration
const CACHE_TTL = {
  games: 60 * 60 * 24, // 24 hours for game data
  search: 60 * 60 * 4, // 4 hours for search results
  popular: 60 * 60 * 24 * 3, // 3 days for popular content
  trending: 60 * 60 * 2 // 2 hours for trending data
}

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return
  
  isProcessingQueue = true
  
  while (requestQueue.length > 0) {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    
    if (timeSinceLastRequest < REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, REQUEST_INTERVAL - timeSinceLastRequest)
      )
    }
    
    const request = requestQueue.shift()
    if (request) {
      await request()
      lastRequestTime = Date.now()
    }
  }
  
  isProcessingQueue = false
}

async function generateCacheKey(endpoint: string, body: string): Promise<string> {
  const queryString = body || ''
  const encoder = new TextEncoder()
  const data = encoder.encode(endpoint + queryString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function determineCacheTTL(endpoint: string, body: string): number {
  // Popular games get longer cache
  if (body?.includes?.('rating >= 80') || body?.includes?.('follows >= 100')) {
    return CACHE_TTL.popular
  }
  
  // Search results
  if (endpoint === 'games' && body?.includes?.('search')) {
    return CACHE_TTL.search
  }
  
  // Trending content
  if (body?.includes?.('follows') || body?.includes?.('rating')) {
    return CACHE_TTL.trending
  }
  
  // Default game data
  return CACHE_TTL.games
}

async function getCachedResponse(cacheKey: string) {
  try {
    const { data, error } = await supabase
      .from('igdb_cache')
      .select('response_data, expires_at, hit_count')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) return null

    // Update hit count asynchronously
    supabase
      .from('igdb_cache')
      .update({ 
        hit_count: data.hit_count + 1,
        last_accessed: new Date().toISOString()
      })
      .eq('cache_key', cacheKey)
      .then(() => {}) // Fire and forget

    return data.response_data
  } catch (error) {
    console.error('Cache retrieval error:', error)
    return null
  }
}

async function setCachedResponse(
  cacheKey: string, 
  endpoint: string, 
  body: string, 
  responseData: any
) {
  try {
    const ttlSeconds = determineCacheTTL(endpoint, body)
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
    
    // Extract search terms and game IDs for optimization
    const searchTerms = extractSearchTerms(body)
    const gameIds = extractGameIds(body)
    
    await supabase
      .from('igdb_cache')
      .upsert({
        cache_key: cacheKey,
        endpoint: endpoint,
        query_hash: cacheKey,
        original_query: body,
        response_data: responseData,
        expires_at: expiresAt,
        response_size: JSON.stringify(responseData).length,
        search_terms: searchTerms,
        game_ids: gameIds
      })
  } catch (error) {
    console.error('Cache storage error:', error)
    // Don't fail the request if caching fails
  }
}

function extractSearchTerms(queryStr: string): string[] {
  if (!queryStr) return []
  const searchMatch = queryStr.match(/search\s+"([^"]+)"/i)
  if (searchMatch) {
    return [searchMatch[1].toLowerCase()]
  }
  return []
}

function extractGameIds(queryStr: string): number[] {
  if (!queryStr) return []
  const idMatches = queryStr.match(/id\s*=\s*\(([^)]+)\)/i)
  if (idMatches) {
    return idMatches[1].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
  }
  return []
}

async function updateCacheStats(isHit: boolean, endpoint: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: existing } = await supabase
      .from('igdb_cache_stats')
      .select('*')
      .eq('date', today)
      .single()

    if (existing) {
      await supabase
        .from('igdb_cache_stats')
        .update({
          total_requests: existing.total_requests + 1,
          cache_hits: existing.cache_hits + (isHit ? 1 : 0),
          cache_misses: existing.cache_misses + (isHit ? 0 : 1),
          api_calls_saved: existing.api_calls_saved + (isHit ? 1 : 0)
        })
        .eq('date', today)
    } else {
      await supabase
        .from('igdb_cache_stats')
        .insert({
          date: today,
          total_requests: 1,
          cache_hits: isHit ? 1 : 0,
          cache_misses: isHit ? 0 : 1,
          api_calls_saved: isHit ? 1 : 0
        })
    }
  } catch (error) {
    console.error('Cache stats update error:', error)
  }
}

/**
 * Supabase Edge Function to proxy IGDB API requests with intelligent caching
 * Handles Twitch OAuth authentication, rate limiting, and database caching
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let requestData: IGDBRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { endpoint, body, method = 'POST' } = requestData;

    // Validate required fields
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: endpoint' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate cache key
    const cacheKey = await generateCacheKey(endpoint, body)
    
    // Try to get cached response first
    const cachedResponse = await getCachedResponse(cacheKey)
    if (cachedResponse) {
      await updateCacheStats(true, endpoint)
      return new Response(
        JSON.stringify(cachedResponse),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey.substring(0, 8)
          } 
        }
      )
    }

    // Cache miss - need to make API request
    await updateCacheStats(false, endpoint)

    // Get environment variables
    const clientId = Deno.env.get('IGDB_CLIENT_ID');
    const clientSecret = Deno.env.get('IGDB_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing IGDB credentials in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate endpoint
    const allowedEndpoints = [
      'games',
      'genres', 
      'platforms',
      'companies',
      'covers',
      'screenshots',
      'artworks',
      'release_dates',
      'involved_companies',
      'search'
    ];

    if (!allowedEndpoints.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Endpoint '${endpoint}' is not allowed` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a promise for the API request that will be queued
    let resolveRequest: (value: any) => void
    let rejectRequest: (error: any) => void
    
    const requestPromise = new Promise((resolve, reject) => {
      resolveRequest = resolve
      rejectRequest = reject
    })

    // Add to rate-limited queue
    requestQueue.push(async () => {
      try {
        // Get valid access token
        const accessToken = await getValidAccessToken(clientId, clientSecret);
        if (!accessToken) {
          throw new Error('Failed to authenticate with IGDB')
        }

        // Make request to IGDB API
        const igdbUrl = `https://api.igdb.com/v4/${endpoint}`;
        
        console.log(`Making IGDB request to: ${igdbUrl} (Cache Key: ${cacheKey.substring(0, 8)})`)

        const igdbResponse = await fetch(igdbUrl, {
          method: method,
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
          },
          body: body || undefined,
        });

        if (!igdbResponse.ok) {
          console.error(`IGDB API error: ${igdbResponse.status} ${igdbResponse.statusText}`);
          
          // Handle specific IGDB error codes
          if (igdbResponse.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.')
          }
          
          throw new Error(`IGDB API error: ${igdbResponse.status} ${igdbResponse.statusText}`)
        }

        // Get response data
        const responseData = await igdbResponse.json();
        
        console.log(`IGDB response received: ${Array.isArray(responseData) ? responseData.length : 1} items`);

        // Cache the response asynchronously
        setCachedResponse(cacheKey, endpoint, body, responseData)
        
        resolveRequest(responseData)
      } catch (error) {
        rejectRequest(error)
      }
    })

    // Process the queue
    processQueue()

    // Wait for our request to complete
    const data = await requestPromise

    // Return successful response with CORS headers and cache info
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey.substring(0, 8),
        'X-Queue-Size': requestQueue.length.toString()
      },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Get a valid access token for IGDB API
 * Implements caching to avoid frequent token requests
 */
async function getValidAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  const now = Date.now();

  // Check if we have a valid cached token
  if (accessTokenCache && accessTokenCache.expiresAt > now + 300000) { // 5 minute buffer
    console.log('Using cached access token');
    return accessTokenCache.token;
  }

  // Request new access token from Twitch
  console.log('Requesting new access token from Twitch');
  
  try {
    const tokenUrl = 'https://id.twitch.tv/oauth2/token';
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      console.error(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
      return null;
    }

    const tokenData: TwitchTokenResponse = await tokenResponse.json();
    
    // Cache the token with expiration
    accessTokenCache = {
      token: tokenData.access_token,
      expiresAt: now + (tokenData.expires_in * 1000), // Convert to milliseconds
    };

    console.log(`Access token obtained, expires in ${tokenData.expires_in} seconds`);
    return tokenData.access_token;

  } catch (error) {
    console.error('Error obtaining access token:', error);
    return null;
  }
}

/* To invoke this function locally with caching:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Set up cache tables with igdb_cache_system_migration.sql
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/igdb-proxy' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoQ2jJAbK2fJSoZjRL8JHnzWc5w8K6rCek' \
    --header 'Content-Type: application/json' \
    --data '{"endpoint":"games","body":"fields name,rating,summary; limit 5;"}'

  Check cache performance:
  SELECT * FROM igdb_cache_performance;

*/