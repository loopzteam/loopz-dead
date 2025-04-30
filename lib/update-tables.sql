-- Rename loops table to loopz if it exists but loopz doesn't
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'loops') AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'loopz') THEN
        ALTER TABLE public.loops RENAME TO loopz;
        ALTER TABLE public.tasks RENAME COLUMN loop_id TO loopz_id;
    END IF;
END
$$;

-- Create or update loopz table with additional fields
CREATE TABLE IF NOT EXISTS public.loopz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentiment_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create or update tasks table with position instead of order
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loopz_id UUID NOT NULL REFERENCES public.loopz(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create microsteps table
CREATE TABLE IF NOT EXISTS public.microsteps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loopz_id UUID NOT NULL REFERENCES public.loopz(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  phase TEXT CHECK (phase IN ('reflection', 'clarification', 'taskifier', 'implementor', 'guide', 'breakdown')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Create policies for loopz
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

-- Create policies for tasks
CREATE POLICY "Users can view tasks in their loopz" 
  ON public.tasks FOR SELECT 
  USING ((SELECT user_id FROM public.loopz WHERE id = tasks.loopz_id) = auth.uid());

CREATE POLICY "Users can insert tasks in their loopz" 
  ON public.tasks FOR INSERT 
  WITH CHECK ((SELECT user_id FROM public.loopz WHERE id = loopz_id) = auth.uid());

CREATE POLICY "Users can update tasks in their loopz" 
  ON public.tasks FOR UPDATE
  USING ((SELECT user_id FROM public.loopz WHERE id = loopz_id) = auth.uid());

CREATE POLICY "Users can delete tasks in their loopz" 
  ON public.tasks FOR DELETE
  USING ((SELECT user_id FROM public.loopz WHERE id = loopz_id) = auth.uid());

-- Create policies for microsteps
CREATE POLICY "Users can view microsteps in their tasks" 
  ON public.microsteps FOR SELECT 
  USING ((SELECT user_id FROM public.loopz WHERE id = (SELECT loopz_id FROM public.tasks WHERE id = microsteps.task_id)) = auth.uid());

CREATE POLICY "Users can insert microsteps in their tasks" 
  ON public.microsteps FOR INSERT 
  WITH CHECK ((SELECT user_id FROM public.loopz WHERE id = (SELECT loopz_id FROM public.tasks WHERE id = task_id)) = auth.uid());

CREATE POLICY "Users can update microsteps in their tasks" 
  ON public.microsteps FOR UPDATE
  USING ((SELECT user_id FROM public.loopz WHERE id = (SELECT loopz_id FROM public.tasks WHERE id = task_id)) = auth.uid());

CREATE POLICY "Users can delete microsteps in their tasks" 
  ON public.microsteps FOR DELETE
  USING ((SELECT user_id FROM public.loopz WHERE id = (SELECT loopz_id FROM public.tasks WHERE id = task_id)) = auth.uid());

-- Create policies for messages
CREATE POLICY "Users can view messages in their loopz" 
  ON public.messages FOR SELECT 
  USING ((SELECT user_id FROM public.loopz WHERE id = messages.loopz_id) = auth.uid());

CREATE POLICY "Users can insert messages in their loopz" 
  ON public.messages FOR INSERT 
  WITH CHECK ((SELECT user_id FROM public.loopz WHERE id = loopz_id) = auth.uid());

CREATE POLICY "Users can update messages in their loopz" 
  ON public.messages FOR UPDATE
  USING ((SELECT user_id FROM public.loopz WHERE id = loopz_id) = auth.uid());

CREATE POLICY "Users can delete messages in their loopz" 
  ON public.messages FOR DELETE
  USING ((SELECT user_id FROM public.loopz WHERE id = loopz_id) = auth.uid());

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS tasks_loopz_id_idx ON public.tasks(loopz_id);
CREATE INDEX IF NOT EXISTS loopz_user_id_idx ON public.loopz(user_id);
CREATE INDEX IF NOT EXISTS microsteps_task_id_idx ON public.microsteps(task_id);
CREATE INDEX IF NOT EXISTS messages_loopz_id_idx ON public.messages(loopz_id);