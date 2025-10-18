# Simplified Database Setup for QuestLog

## Quick Setup Instructions

### Step 1: Run the Fixed Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Create new query
3. Copy and paste contents from `docs/database_schema.sql` (the JWT line has been removed)
4. Click **Run** - it should work now!

### Step 2: Your Credentials Are Already Configured
✅ Your `.env` file is ready with your Supabase credentials

### Step 3: Test Database Connection
Try running this simple query in SQL Editor to verify everything works:
```sql
SELECT * FROM auth.users;
```

### Step 4: Add Sample Quests (Optional)
```sql
INSERT INTO public.quests (title, description, type, target_value, xp_reward) VALUES
('First Game', 'Add your first game to your library', 'achievement', 1, 100),
('Game Reviewer', 'Write your first game review', 'achievement', 1, 150),
('Weekly Player', 'Log games for 7 days in a row', 'weekly', 7, 500),
('Speed Runner', 'Complete 5 games in one week', 'weekly', 5, 300),
('Collector', 'Add 25 games to your library', 'achievement', 25, 1000);
```

### Step 5: Enable Authentication Providers
1. Go to **Authentication** > **Providers** in Supabase
2. **Enable Google**:
   - Client ID: (get from Google Console)
   - Client Secret: (get from Google Console) 
   - Redirect URL: `https://qrksbnjfqxknzedncdde.supabase.co/auth/v1/callback`

3. **Enable Facebook** (optional for now):
   - Similar setup with Facebook Developer Console

### Step 6: Restart Your App
```bash
# In QuestLogApp directory
npm start
```

## What's Ready Now:
- ✅ Supabase project configured
- ✅ Environment variables set
- ✅ Database schema ready to run
- ✅ Authentication service created
- ✅ Login screen with Google/Meta buttons

## Next: Test Authentication
Once the database schema is running, your login buttons should work with Google OAuth!