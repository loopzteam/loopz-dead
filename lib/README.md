# Supabase Schema Setup

This directory contains the SQL schema for Loopz app database tables.

## Setting Up the Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase-schema.sql` into the query editor
5. Run the query

## Tables Structure

### Loops Table
This table stores the main loop information:
- `id`: Unique identifier for the loop
- `title`: The title of the loop
- `user_id`: ID of the user who owns the loop
- `created_at`: Timestamp when the loop was created
- `updated_at`: Timestamp when the loop was last updated

### Tasks Table
This table stores tasks associated with loops:
- `id`: Unique identifier for the task
- `loop_id`: The ID of the loop this task belongs to
- `content`: The task description
- `is_completed`: Boolean indicating if the task is completed
- `order`: Integer representing the task's position in the list
- `created_at`: Timestamp when the task was created

## Row Level Security (RLS)

The schema includes Row Level Security policies to ensure users can only:
- View their own loops
- Create loops for themselves
- Update and delete only their own loops
- Manage tasks only within loops they own

## Indexes

Indexes are created on:
- `loops.user_id` for faster user-specific queries
- `tasks.loop_id` for faster task lookup within loops 