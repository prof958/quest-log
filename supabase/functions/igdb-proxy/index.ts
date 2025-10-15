import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

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

// Cache for access token to avoid frequent token requests
let accessTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

/**
 * Supabase Edge Function to proxy IGDB API requests
 * Handles Twitch OAuth authentication and CORS for mobile app access
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

    // Get valid access token
    const accessToken = await getValidAccessToken(clientId, clientSecret);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with IGDB' }),
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

    // Make request to IGDB API
    const igdbUrl = `https://api.igdb.com/v4/${endpoint}`;
    
    console.log(`Making IGDB request to: ${igdbUrl}`);
    console.log(`Request body: ${body}`);

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
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: `IGDB API error: ${igdbResponse.status} ${igdbResponse.statusText}` 
        }),
        {
          status: igdbResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get response data
    const responseData = await igdbResponse.json();
    
    console.log(`IGDB response received: ${JSON.stringify(responseData).substring(0, 200)}...`);

    // Return successful response with CORS headers
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
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

/* To invoke this function locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/igdb-proxy' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoQ2jJAbK2fJSoZjRL8JHnzWc5w8K6rCek' \
    --header 'Content-Type: application/json' \
    --data '{"endpoint":"games","body":"fields name,rating,summary; limit 5;"}'

*/