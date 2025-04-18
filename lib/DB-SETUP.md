# Database Setup Guide

Follow these steps to set up your Supabase database tables and security policies:

## Method 1: Using Supabase SQL Editor (Recommended)

1. Log in to your Supabase dashboard at [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click on "New Query"
5. Copy and paste the contents of `create-tables.sql` from this directory
6. Click "Run" or press Ctrl+Enter to execute the query
7. Verify that the tables have been created in the "Table Editor" section

## Testing the Setup

After setting up the database, you should be able to:

1. Create loops through your application
2. Add tasks to those loops
3. Mark tasks as completed

## Troubleshooting

### Issue: "Invalid references to auth.users"

If you see an error about references to `auth.users`, make sure that:
1. You're using the same Supabase project that your app is connected to
2. You're logged in with an admin account

### Issue: "Database Setup Error"

If you see a generic database setup error:
1. Check that your service role key is valid in `.env.local`
2. Try running the SQL manually in the Supabase SQL Editor

### Manual Table Check

To check if your tables exist and have the correct schema, run this query in the SQL Editor:

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('loops', 'tasks')
ORDER BY table_name, ordinal_position;
```

This will show you all columns in both tables and their data types. 