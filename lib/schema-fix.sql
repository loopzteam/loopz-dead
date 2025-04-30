-- DEFINITIVE SCHEMA FIX
-- This script standardizes the database schema to match the codebase
-- Run this in Supabase SQL Editor to fix schema issues

-- First, check which tables exist
DO $$
DECLARE
  loops_exists BOOLEAN;
  loopz_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'loops') INTO loops_exists;
  SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'loopz') INTO loopz_exists;
  
  -- If loops exists but loopz doesn't, rename loops to loopz
  IF loops_exists AND NOT loopz_exists THEN
    RAISE NOTICE 'Renaming loops table to loopz';
    ALTER TABLE public.loops RENAME TO loopz;
    -- Also rename any foreign key columns
    ALTER TABLE public.tasks RENAME COLUMN loop_id TO loopz_id;
  END IF;
END $$;

-- Ensure the loopz table has all required fields
CREATE TABLE IF NOT EXISTS public.loopz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Add this field even if it doesn't exist
  progress FLOAT DEFAULT 0,
  totalSteps INTEGER DEFAULT 0, -- Using camelCase to match code
  completedSteps INTEGER DEFAULT 0 -- Using camelCase to match code
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Check and add updated_at if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'updated_at') THEN
    ALTER TABLE public.loopz ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  
  -- Convert snake_case to camelCase if needed
  IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'totalsteps') 
     AND NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'totalSteps') THEN
    ALTER TABLE public.loopz RENAME COLUMN totalsteps TO "totalSteps";
  END IF;
  
  IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'completedsteps') 
     AND NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'completedSteps') THEN
    ALTER TABLE public.loopz RENAME COLUMN completedsteps TO "completedSteps";
  END IF;
  
  -- If camelCase fields don't exist but snake_case do not, create them
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'totalSteps') 
     AND NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'totalsteps') THEN
    ALTER TABLE public.loopz ADD COLUMN "totalSteps" INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'completedSteps') 
     AND NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'completedsteps') THEN
    ALTER TABLE public.loopz ADD COLUMN "completedSteps" INTEGER DEFAULT 0;
  END IF;
  
  -- Add progress if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'progress') THEN
    ALTER TABLE public.loopz ADD COLUMN progress FLOAT DEFAULT 0;
  END IF;
  
  -- Add description if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'description') THEN
    ALTER TABLE public.loopz ADD COLUMN description TEXT;
  END IF;
END $$;

-- Ensure tasks table exists with all required fields
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loopz_id UUID NOT NULL REFERENCES public.loopz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to tasks if they don't exist
DO $$
BEGIN
  -- Check and add user_id if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.tasks'::regclass AND attname = 'user_id') THEN
    ALTER TABLE public.tasks ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Update existing records to use the user_id from their parent loopz
    UPDATE public.tasks 
    SET user_id = (SELECT user_id FROM public.loopz WHERE loopz.id = tasks.loopz_id);
  END IF;
  
  -- Check and add updated_at if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.tasks'::regclass AND attname = 'updated_at') THEN
    ALTER TABLE public.tasks ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  
  -- Rename content to title if needed
  IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.tasks'::regclass AND attname = 'content') 
     AND NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.tasks'::regclass AND attname = 'title') THEN
    ALTER TABLE public.tasks RENAME COLUMN content TO title;
  END IF;
  
  -- Rename order to position if needed
  IF EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.tasks'::regclass AND attname = 'order') 
     AND NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.tasks'::regclass AND attname = 'position') THEN
    ALTER TABLE public.tasks RENAME COLUMN "order" TO position;
  END IF;
END $$;

-- Ensure microsteps table exists with all required fields
CREATE TABLE IF NOT EXISTS public.microsteps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to microsteps if they don't exist
DO $$
BEGIN
  -- Check and add user_id if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.microsteps'::regclass AND attname = 'user_id') THEN
    ALTER TABLE public.microsteps ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Update existing records to use the user_id from their parent tasks
    UPDATE public.microsteps 
    SET user_id = (SELECT tasks.user_id FROM public.tasks WHERE tasks.id = microsteps.task_id);
  END IF;
  
  -- Check and add updated_at if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.microsteps'::regclass AND attname = 'updated_at') THEN
    ALTER TABLE public.microsteps ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Ensure messages table exists with all required fields
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loopz_id UUID NOT NULL REFERENCES public.loopz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  phase TEXT CHECK (phase IN ('reflection', 'clarification', 'taskifier', 'implementor', 'guide', 'breakdown')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to messages if they don't exist
DO $$
BEGIN
  -- Check and add user_id if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.messages'::regclass AND attname = 'user_id') THEN
    ALTER TABLE public.messages ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Update existing records to use the user_id from their parent loopz
    UPDATE public.messages 
    SET user_id = (SELECT user_id FROM public.loopz WHERE loopz.id = messages.loopz_id);
  END IF;
  
  -- Check and add updated_at if missing
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.messages'::regclass AND attname = 'updated_at') THEN
    ALTER TABLE public.messages ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Set up RLS (Row Level Security)
ALTER TABLE public.loopz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsteps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own loopz" ON public.loopz;
DROP POLICY IF EXISTS "Users can insert their own loopz" ON public.loopz;
DROP POLICY IF EXISTS "Users can update their own loopz" ON public.loopz;
DROP POLICY IF EXISTS "Users can delete their own loopz" ON public.loopz;

DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can view tasks in their loopz" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their loopz" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their loopz" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their loopz" ON public.tasks;

DROP POLICY IF EXISTS "Users can view their own microsteps" ON public.microsteps;
DROP POLICY IF EXISTS "Users can insert their own microsteps" ON public.microsteps;
DROP POLICY IF EXISTS "Users can update their own microsteps" ON public.microsteps;
DROP POLICY IF EXISTS "Users can delete their own microsteps" ON public.microsteps;

DROP POLICY IF EXISTS "Users can view microsteps in their tasks" ON public.microsteps;
DROP POLICY IF EXISTS "Users can insert microsteps in their tasks" ON public.microsteps;
DROP POLICY IF EXISTS "Users can update microsteps in their tasks" ON public.microsteps;
DROP POLICY IF EXISTS "Users can delete microsteps in their tasks" ON public.microsteps;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view messages in their loopz" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their loopz" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their loopz" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in their loopz" ON public.messages;

-- Create direct RLS policies (simpler and more efficient)
-- Loopz policies
CREATE POLICY "Users can view their own loopz" 
  ON public.loopz FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loopz" 
  ON public.loopz FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loopz" 
  ON public.loopz FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loopz" 
  ON public.loopz FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks" 
  ON public.tasks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Microsteps policies
CREATE POLICY "Users can view their own microsteps" 
  ON public.microsteps FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own microsteps" 
  ON public.microsteps FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own microsteps" 
  ON public.microsteps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own microsteps" 
  ON public.microsteps FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view their own messages" 
  ON public.messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" 
  ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS tasks_loopz_id_idx ON public.tasks(loopz_id);
CREATE INDEX IF NOT EXISTS loopz_user_id_idx ON public.loopz(user_id);
CREATE INDEX IF NOT EXISTS microsteps_task_id_idx ON public.microsteps(task_id);
CREATE INDEX IF NOT EXISTS messages_loopz_id_idx ON public.messages(loopz_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS microsteps_user_id_idx ON public.microsteps(user_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages(user_id);

-- Function to refresh the schema (if you have permission)
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;