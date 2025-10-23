# How to Export Current Database Schema from Supabase

## Method 1: Via Supabase Dashboard (Easiest)

1. **Go to SQL Editor**:
   - Open [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your QuestLog project
   - Click **SQL Editor** in left sidebar

2. **Run this query to see all tables**:
```sql
-- List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

3. **Get detailed schema for each table**:
```sql
-- Get columns for a specific table (run for each table)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'YOUR_TABLE_NAME_HERE'
ORDER BY ordinal_position;
```

4. **Check constraints**:
```sql
-- Get constraints for tables
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;
```

5. **Copy results and share them**

## Method 2: Via Supabase CLI (Terminal)

Run this command from your project directory:

```powershell
cd "c:\Users\prof9\repos\quest-log\quest-log"
npx supabase db dump --schema public > docs/sql/current_schema_dump.sql
```

This will create a complete SQL dump of your current schema.

## Method 3: Simple Table List Query

Just run this in SQL Editor and copy the results:

```sql
-- Quick overview of what exists
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## What to Share

After running any of these methods, simply:
1. Copy the output
2. Paste it in the chat, or
3. Save to a file and share the file path

This helps verify what's currently in your database!
