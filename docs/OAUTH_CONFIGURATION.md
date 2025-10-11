# OAuth Configuration Guide

This document provides complete setup instructions for Google OAuth authentication in QuestLog, including both Google Console and Supabase configurations.

## Overview

QuestLog uses **Supabase's built-in OAuth** integration with Google as the identity provider. This approach simplifies the authentication flow while maintaining security and reliability.

### Architecture
```
User → QuestLog App → Supabase Auth → Google OAuth → Back to QuestLog
```

## Google Cloud Console Setup

### Step 1: Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Project name: `QuestLog` (or your preferred name)

### Step 2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services → OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   ```
   App name: QuestLog
   User support email: [your-email]
   Developer contact information: [your-email]
   ```
4. **Scopes**: Add the following scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. **Test users**: Add your email for testing

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client IDs**
3. Configure:
   ```
   Application type: Web application
   Name: QuestLog Web Client
   ```

#### Authorized JavaScript Origins
```
http://localhost:8081
https://your-production-domain.com
```

#### Authorized Redirect URIs
```
https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback
http://localhost:8081
```
*Replace `qrksbnjfqxknzedncdde` with your actual Supabase project ID*

### Step 4: Save Credentials
After creation, save these values:
- **Client ID**: `1001871042129-qns63ld8i8vqtk08dk2cvvavbs05hr85.apps.googleusercontent.com`
- **Client Secret**: `[YOUR_CLIENT_SECRET]`

## Supabase Configuration

### Step 1: Enable Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication → Providers**
4. Find **Google** and toggle **Enable Sign in with Google**

### Step 2: Configure Google OAuth
Add your Google credentials:
```
Client ID (for OAuth): 1001871042129-qns63ld8i8vqtk08dk2cvvavbs05hr85.apps.googleusercontent.com
Client Secret (for OAuth): [YOUR_CLIENT_SECRET]
```

### Step 3: URL Configuration
Navigate to **Authentication → URL Configuration**:

#### Site URL
```
http://localhost:8081  # For development
https://your-domain.com  # For production
```

#### Redirect URLs
```
questlog://auth/callback
http://localhost:8081/
```

## Environment Configuration

### Required Environment Variables
Ensure these are set in your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://qrksbnjfqxknzedncdde.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Implementation Details

### AuthService Method
The OAuth flow is implemented in `src/services/AuthService.ts`:

```typescript
static async signInWithGoogle(): Promise<{ data: any; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  return { data, error };
}
```

### UI Integration
Google OAuth button is available in:
- Initial action buttons (after "Begin Adventure")
- Login form (below email/password fields)

### Authentication Flow
1. User clicks "🚀 Continue with Google"
2. App calls `AuthService.signInWithGoogle()`
3. Supabase generates OAuth URL
4. User redirected to Google OAuth consent screen
5. After consent, Google redirects back to Supabase
6. Supabase processes the OAuth response
7. User returned to app with authentication tokens
8. `AuthContext` automatically updates user state

## Testing

### Development Testing
1. Start development server: `npm run web`
2. Open `http://localhost:8081`
3. Click "Begin Adventure" → "🚀 Continue with Google"
4. Complete Google OAuth flow
5. Check browser console for detailed logs

### Debug Logging
The implementation includes comprehensive logging:
- OAuth initiation details
- Redirect URLs and parameters
- Auth state changes
- Error details
- Success confirmations

### Console Logs to Monitor
```javascript
🚀 Starting Google OAuth sign in...
📍 Current URL: http://localhost:8081
📍 Redirect URL will be: http://localhost:8081/auth/callback
✅ Google OAuth initiated successfully
🔄 Auth state changed: SIGNED_IN
📝 Session details: { hasSession: true, userEmail: "user@example.com" }
```

## Troubleshooting

### Common Issues

#### 1. "redirect_uri_mismatch" Error
- **Cause**: Redirect URI not properly configured in Google Console
- **Solution**: Ensure `https://[your-supabase-project].supabase.co/auth/v1/callback` is added to Authorized Redirect URIs

#### 2. OAuth Flow Doesn't Start
- **Cause**: Missing environment variables or incorrect Supabase configuration
- **Solution**: Verify `.env` file and Supabase provider settings

#### 3. Authentication Doesn't Persist
- **Cause**: Supabase session handling issues
- **Solution**: Check `AuthContext.tsx` and ensure proper session management

#### 4. CORS Issues
- **Cause**: Incorrect authorized origins in Google Console
- **Solution**: Add your domain to Authorized JavaScript Origins

### Debug Steps
1. Check browser console for error messages
2. Verify environment variables are loaded
3. Test Supabase connection independently
4. Confirm Google Console configuration matches Supabase settings
5. Test with different browsers/incognito mode

## Security Considerations

### Production Setup
1. **Remove localhost URLs** from Google Console authorized origins
2. **Update redirect URLs** to production domains
3. **Enable HTTPS** for all redirect URLs
4. **Rotate client secrets** periodically
5. **Monitor OAuth usage** in Google Console

### Best Practices
- Never commit client secrets to version control
- Use environment variables for all sensitive configuration
- Implement proper error handling for failed OAuth attempts
- Monitor authentication logs for suspicious activity
- Keep OAuth libraries and dependencies updated

## Mobile Configuration (Future)

When adding mobile support, additional configuration will be needed:

### Google Console
Add mobile redirect URIs:
```
exp://localhost:19000/--/auth/callback
[your-app-scheme]://auth/callback
```

### Supabase
Add mobile redirect URLs:
```
exp://localhost:19000/--/auth/callback
[your-app-scheme]://auth/callback
```

### React Native
Install additional dependencies:
```bash
npx expo install expo-auth-session expo-crypto
```

## Support

For issues with:
- **Google OAuth**: Check [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Supabase Auth**: Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- **React Native**: Check [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)

## Changelog

### 2025-10-11
- Initial Google OAuth implementation
- Added comprehensive logging
- Configured for web platform testing
- Documented complete setup process