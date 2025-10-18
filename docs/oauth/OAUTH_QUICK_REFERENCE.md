# OAuth Quick Reference

## Your Supabase Project
- **URL**: `https://qrksbnjfqxknzedncdde.supabase.co`
- **Redirect URI**: `https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback`

## Required Redirect URLs for OAuth Providers:
```
https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback
```
Use this EXACT URL in both Google Cloud Console and Facebook Developer Console.

## Steps Summary:
1. **Google**: Cloud Console → OAuth Client → Web App → Add Redirect URI
2. **Facebook**: Developer Console → Create App → Facebook Login → Add Redirect URI  
3. **Supabase**: Auth → Providers → Enable & Configure with Client ID/Secret
4. **Test**: Restart app → Try login buttons

## Test Commands:
```bash
# Restart Expo
npm start

# Check Supabase users
# Run in SQL Editor: SELECT * FROM auth.users;
```