-- Loopz Schema Update
-- This script updates the database schema to match the project's ideal state
-- Execute in Supabase SQL Editor

-- Drop existing tables if needed and recreate them
-- Uncomment the DROP statements if you want to completely reset the schema
-- DROP TABLE IF EXISTS public.messages;
-- DROP TABLE IF EXISTS public.microsteps;
-- DROP TABLE IF EXISTS public.tasks;
-- DROP TABLE IF EXISTS public.loopz;

-- Create or update loopz table with the correct fields
CREATE TABLE IF NOT EXISTS public.loopz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sentiment_score FLOAT,
  progress FLOAT DEFAULT 0,
  totalSteps INTEGER DEFAULT 0,
  completedSteps INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns to loopz table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'description') THEN
    ALTER TABLE public.loopz ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'progress') THEN
    ALTER TABLE public.loopz ADD COLUMN progress FLOAT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'totalSteps') THEN
    ALTER TABLE public.loopz ADD COLUMN totalSteps INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.loopz'::regclass AND attname = 'completedSteps') THEN
    ALTER TABLE public.loopz ADD COLUMN completedSteps INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create or update tasks table with position instead of order
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

-- Add user_id to tasks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.tasks'::regclass AND attname = 'user_id') THEN
    ALTER TABLE public.tasks ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Update existing records to use the user_id from their parent loopz
    UPDATE public.tasks 
    SET user_id = (SELECT user_id FROM public.loopz WHERE loopz.id = tasks.loopz_id);
  END IF;
END $$;

-- Create or update microsteps table
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

-- Add user_id to microsteps if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.microsteps'::regclass AND attname = 'user_id') THEN
    ALTER TABLE public.microsteps ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Update existing records to use the user_id from their parent task
    UPDATE public.microsteps 
    SET user_id = (SELECT user_id FROM public.tasks WHERE tasks.id = microsteps.task_id);
  END IF;
END $$;

-- Create or update messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loopz_id UUID NOT NULL REFERENCES public.loopz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  phase TEXT CHECK (phase IN ('reflection', 'clarification', 'taskifier', 'implementor', 'guide', 'breakdown')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add user_id to messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.messages'::regclass AND attname = 'user_id') THEN
    ALTER TABLE public.messages ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Update existing records to use the user_id from their parent loopz
    UPDATE public.messages 
    SET user_id = (SELECT user_id FROM public.loopz WHERE loopz.id = messages.loopz_id);
  END IF;
END $$;

-- Set up RLS (Row Level Security)
ALTER TABLE public.loopz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsteps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Clear any existing policies
DROP POLICY IF EXISTS "Users can view their own loopz" ON public.loopz;
DROP POLICY IF EXISTS "Users can insert their own loopz" ON public.loopz;
DROP POLICY IF EXISTS "Users can update their own loopz" ON public.loopz;
DROP POLICY IF EXISTS "Users can delete their own loopz" ON public.loopz;

DROP POLICY IF EXISTS "Users can view tasks in their loopz" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their loopz" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their loopz" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their loopz" ON public.tasks;

DROP POLICY IF EXISTS "Users can view microsteps in their tasks" ON public.microsteps;
DROP POLICY IF EXISTS "Users can insert microsteps in their tasks" ON public.microsteps;
DROP POLICY IF EXISTS "Users can update microsteps in their tasks" ON public.microsteps;
DROP POLICY IF EXISTS "Users can delete microsteps in their tasks" ON public.microsteps;

DROP POLICY IF EXISTS "Users can view messages in their loopz" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their loopz" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their loopz" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in their loopz" ON public.messages;

-- Create policies for direct user_id ownership (simpler and more efficient)
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