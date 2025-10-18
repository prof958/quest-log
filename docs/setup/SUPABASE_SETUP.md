# Supabase Setup Guide for QuestLog

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in with GitHub (or create account)
3. Click "New Project"
4. Fill in:
   - **Organization**: Choose or create one
   - **Project Name**: `QuestLog`
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free

## Step 2: Get Project Credentials
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables
1. In the QuestLogApp folder, create `.env` file
2. Copy from `.env.example` and fill in your values:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

## Step 4: Set Up Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Create new query
3. Copy and paste contents from `database_schema.sql`
4. Click **Run** to create all tables and functions

## Step 5: Configure OAuth Providers

### For Google OAuth:
1. Go to **Authentication** > **Providers**
2. Enable **Google**
3. Add these redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `com.questlog.app://auth/callback` (for mobile)

### For Facebook/Meta OAuth:
1. Go to **Authentication** > **Providers**  
2. Enable **Facebook**
3. Add same redirect URLs as above

## Step 6: Test the Setup
1. Restart your Expo development server
2. Try the authentication buttons in your app
3. Check Supabase dashboard **Authentication** tab to see new users

## Step 7: Initial Data (Optional)
You can add some sample quests in the SQL editor:
```sql
INSERT INTO public.quests (title, description, type, target_value, xp_reward) VALUES
('First Game', 'Add your first game to your library', 'achievement', 1, 100),
('Game Reviewer', 'Write your first game review', 'achievement', 1, 150),
('Weekly Player', 'Log games for 7 days in a row', 'weekly', 7, 500);
```

## Troubleshooting
- **Environment variables not working**: Restart Expo server after creating .env
- **OAuth not working**: Check redirect URLs match exactly
- **Database errors**: Ensure schema was created successfully
- **API errors**: Verify URL and keys are correct

## Security Notes
- Never commit your `.env` file to Git
- The `.env.example` file is safe to commit
- Keep your database password secure
- Use Row Level Security policies (already included in schema)