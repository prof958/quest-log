import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log('IGDB Proxy function started')

// IGDB API constants
const IGDB_BASE_URL = 'https://api.igdb.com/v4'
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token'

interface TwitchTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

// Global token cache
let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken(): Promise<string> {
  console.log('🔑 Getting IGDB access token...')
  
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    console.log('✅ Using cached access token')
    return cachedToken
  }

  const clientId = Deno.env.get('IGDB_CLIENT_ID')
  const clientSecret = Deno.env.get('IGDB_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials not configured in environment variables')
  }

  try {
    console.log('🌐 Requesting new Twitch token...')
    const response = await fetch(TWITCH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Twitch token request failed:', response.status, errorText)
      throw new Error(`Failed to get Twitch token: ${response.status}`)
    }

    const data: TwitchTokenResponse = await response.json()
    console.log('✅ Twitch token obtained, expires in:', data.expires_in, 'seconds')
    
    cachedToken = data.access_token
    // Set expiry to 90% of actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in * 1000 * 0.9)

    return cachedToken
  } catch (error) {
    console.error('❌ Failed to get access token:', error)
    throw error
  }
}

async function makeIGDBRequest(endpoint: string, body: string): Promise<any> {
  const accessToken = await getAccessToken()
  const clientId = Deno.env.get('IGDB_CLIENT_ID')

  console.log(`🌐 Making IGDB request to ${endpoint}`)

  const response = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId!,
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ IGDB API request failed: ${response.status}`, errorText)
    throw new Error(`IGDB API request failed: ${response.status}`)
  }

  const data = await response.json()
  console.log(`✅ IGDB request successful, received ${Array.isArray(data) ? data.length : 1} items`)
  return data
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint') || 'games'
    
    // Get the request body (Apicalypse query)
    const body = await req.text()
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Request body (Apicalypse query) is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`📨 Received request for endpoint: ${endpoint}`)
    console.log(`📝 Query body: ${body}`)

    // Make the IGDB API request
    const data = await makeIGDBRequest(endpoint, body)

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})