# OAuth Setup Guide for QuestLog

## Google Sign-In Setup

### Step 1: Google Cloud Console Setup
1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/Select Project**:
   - Project name: `QuestLog`
   - Note the Project ID

3. **Enable Google+ API**:
   - Go to **APIs & Services** > **Library**
   - Search "Google+ API" and enable it
   - Also enable "Google Identity" if available

4. **Create OAuth Credentials**:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `QuestLog Web Client`
   
5. **Configure Authorized Redirect URIs**:
   ```
   https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback
   ```

6. **Android OAuth Client (for mobile)**:
   - Create another OAuth client with type **Android**
   - Package name: `com.questlog.app`
   - SHA-1 certificate fingerprint: (get from Expo/development)

7. **Save Your Credentials**:
   - Copy **Web Client ID**
   - Copy **Web Client Secret**
   - Copy **Android Client ID** (if created)

### Step 2: Supabase Google Configuration
1. **In Supabase Dashboard**:
   - Go to **Authentication** > **Providers**
   - Find **Google** and toggle it **ON**

2. **Enter Credentials**:
   - **Client ID**: Paste Web Client ID from Google Console
   - **Client Secret**: Paste Web Client Secret from Google Console
   - **Redirect URL**: `https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback`

3. **Click Save**

## Meta (Facebook) Sign-In Setup

### Step 1: Facebook Developer Setup
1. **Go to [Facebook Developers](https://developers.facebook.com/)**
2. **Create App**:
   - App Type: **Consumer**
   - App Name: `QuestLog`
   - Contact Email: Your email

3. **Add Facebook Login Product**:
   - In dashboard, click **Add Product**
   - Select **Facebook Login** > **Set Up**

4. **Configure OAuth Settings**:
   - Go to **Facebook Login** > **Settings**
   - **Valid OAuth Redirect URIs**:
     ```
     https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback
     ```

5. **Android Platform Setup**:
   - Go to **Settings** > **Basic**
   - Click **Add Platform** > **Android**
   - Package Name: `com.questlog.app`
   - Class Name: `com.questlog.app.MainActivity`

6. **Get App Credentials**:
   - Go to **Settings** > **Basic**
   - Copy **App ID**
   - Copy **App Secret** (click Show)

### Step 2: Supabase Meta Configuration
1. **In Supabase Dashboard**:
   - Go to **Authentication** > **Providers**
   - Find **Facebook** and toggle it **ON**

2. **Enter Credentials**:
   - **Client ID**: Your Facebook App ID
   - **Client Secret**: Your Facebook App Secret
   - **Redirect URL**: `https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback`

3. **Click Save**

## App Configuration Update

### Update app.json with Package Name
```json
{
  "expo": {
    "name": "QuestLog",
    "slug": "questlog",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#221c10"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.questlog.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#221c10"
      },
      "package": "com.questlog.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "questlog"
  }
}
```

## Testing Your Setup

### Step 1: Update Your App Environment
Your `.env` file is already configured with Supabase credentials.

### Step 2: Test Authentication Flow
1. **Restart your Expo app**:
   ```bash
   npm start
   ```

2. **Test the login buttons**:
   - Tap "Begin Your Adventure"
   - Tap "Sign in with Google" - should open browser
   - Complete Google sign-in
   - App should receive the user data

### Step 3: Verify in Supabase
1. Go to **Authentication** > **Users** in Supabase
2. You should see your test user appear after signing in

## Troubleshooting

### Common Issues:
1. **"Invalid Redirect URI"**:
   - Double-check the redirect URL in both Google/Facebook consoles
   - Must be: `https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback`

2. **"App Not Yet Live" (Facebook)**:
   - In Facebook Developer console, switch app to **Live** mode
   - Go to **App Review** > **Permissions and Features**

3. **OAuth Error in App**:
   - Check Supabase logs: **Logs** > **Auth**
   - Verify client IDs/secrets are correct

4. **Package Name Issues**:
   - Ensure `com.questlog.app` is used consistently
   - Update app.json with correct package name

### Quick Test Query:
Run this in Supabase SQL Editor to see authenticated users:
```sql
SELECT id, email, created_at, raw_app_meta_data->>'provider' as provider 
FROM auth.users;
```

## Next Steps After Setup:
1. ✅ Test both Google and Meta sign-in
2. ✅ Verify user creation in Supabase
3. ✅ Update login screen to handle auth responses
4. ✅ Create main app navigation for signed-in users

Your OAuth setup will be complete once both providers work! 🚀