-- Create loops table
CREATE TABLE IF NOT EXISTS public.loops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id UUID NOT NULL REFERENCES public.loops(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for loops
CREATE POLICY "Users can view their own loops" 
  ON public.loops FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loops" 
  ON public.loops FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loops" 
  ON public.loops FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loops" 
  ON public.loops FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for tasks
CREATE POLICY "Users can view tasks in their loops" 
  ON public.tasks FOR SELECT 
  USING ((SELECT user_id FROM public.loops WHERE id = tasks.loop_id) = auth.uid());

CREATE POLICY "Users can insert tasks in their loops" 
  ON public.tasks FOR INSERT 
  WITH CHECK ((SELECT user_id FROM public.loops WHERE id = loop_id) = auth.uid());

CREATE POLICY "Users can update tasks in their loops" 
  ON public.tasks FOR UPDATE
  USING ((SELECT user_id FROM public.loops WHERE id = loop_id) = auth.uid());

CREATE POLICY "Users can delete tasks in their loops" 
  ON public.tasks FOR DELETE
  USING ((SELECT user_id FROM public.loops WHERE id = loop_id) = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS tasks_loop_id_idx ON public.tasks(loop_id);
CREATE INDEX IF NOT EXISTS loops_user_id_idx ON public.loops(user_id); 