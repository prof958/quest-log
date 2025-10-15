# Mobile OAuth Setup Instructions

## Problem
Google OAuth works on web but gets stuck on mobile - user clicks Google button, gets redirected to Google auth page, but doesn't return to the app after authentication.

## Root Cause
The issue is that mobile OAuth requires proper configuration of:
1. Supabase client with `detectSessionInUrl: false` for mobile
2. Redirect URLs configured in Supabase dashboard  
3. Using the simple `signInWithOAuth` approach without custom WebBrowser handling

## Solution Steps

### 1. Configure Supabase Client for Mobile
✅ **FIXED**: Updated `supabase.ts` with proper mobile configuration:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Only detect URL sessions on web
  },
})
```

### 2. Configure Supabase Redirect URLs
In your Supabase Dashboard > Authentication > URL Configuration, add:
- **For development**: Use tunnel URL from `npx expo start --tunnel`
- **For production**: Your app's production domain
- **Mobile deep links**: `questlog://` (matches app.json scheme)

### 3. Use Simple OAuth Flow  
✅ **FIXED**: Updated AuthService to use basic `signInWithOAuth` without complex WebBrowser handling:
```typescript
// Mobile OAuth - let Supabase handle everything
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

### 4. Test with Tunnel URL
For local development on mobile:
```bash
npx expo start --tunnel
```
This creates an HTTPS URL that mobile devices can access.

### 5. App Configuration
Ensure `app.json` has the correct scheme:
```json
{
  "expo": {
    "scheme": "questlog"
  }
}
```

## Current Status
- ✅ Supabase client configured for mobile
- ✅ AsyncStorage installed and configured  
- ✅ OAuth flow simplified to use Supabase's built-in handling
- ⏳ Need to test with tunnel URL and verify redirect URLs in dashboard

## Testing Steps
1. Run `npx expo start --tunnel`
2. Configure the tunnel URL in Supabase dashboard redirect URLs
3. Test OAuth on mobile device
4. Check that session is persisted in AsyncStorage

## References
- [Supabase React Native with Expo Social Auth Guide](https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth)
- [Reddit discussion on mobile OAuth issues](https://www.reddit.com/r/Supabase/comments/18cxs4u/auth_callback_url_not_working_on_mobile_devices/)