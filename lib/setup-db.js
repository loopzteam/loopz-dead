#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * Script to set up the Supabase database schema directly
 * Usage: node lib/setup-db.js
 *
 * Make sure you have these environment variables in your .env.local file:
 * - NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key
 */

async function setupDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Required environment variables are missing');
    console.error(
      'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
    );
    process.exit(1);
  }

  try {
    console.log('Setting up database schema...');

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Read SQL schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Create the basic tables using direct SQL
    // This is done in steps to ensure it can handle if tables already exist
    console.log("Creating tables if they don't exist...");

    // First, try to check if the tables already exist
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['loops', 'tasks']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      // Continue anyway - we'll try to create the tables
    } else {
      console.log(`Found ${tablesData?.length || 0} existing tables`);
    }

    // Execute the SQL script directly
    try {
      // We'll manually execute small chunks of SQL that are more likely to succeed

      // 1. Create loops table
      console.log('Creating loops table...');
      await supabase.schema
        .createTable('loops', {
          id: {
            type: 'uuid',
            primaryKey: true,
            default: supabase.sql`gen_random_uuid()`,
          },
          title: { type: 'text', notNull: true },
          user_id: {
            type: 'uuid',
            notNull: true,
            references: 'auth.users.id',
            onDelete: 'cascade',
          },
          created_at: {
            type: 'timestamptz',
            notNull: true,
            default: supabase.sql`now()`,
          },
          updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: supabase.sql`now()`,
          },
        })
        .ifNotExists();

      // 2. Create tasks table
      console.log('Creating tasks table...');
      await supabase.schema
        .createTable('tasks', {
          id: {
            type: 'uuid',
            primaryKey: true,
            default: supabase.sql`gen_random_uuid()`,
          },
          loop_id: {
            type: 'uuid',
            notNull: true,
            references: 'loops.id',
            onDelete: 'cascade',
          },
          content: { type: 'text', notNull: true },
          is_completed: { type: 'boolean', notNull: true, default: false },
          order: { type: 'integer', notNull: true },
          created_at: {
            type: 'timestamptz',
            notNull: true,
            default: supabase.sql`now()`,
          },
        })
        .ifNotExists();

      // 3. Create indexes
      console.log('Creating indexes...');
      await supabase.schema.raw(`
        CREATE INDEX IF NOT EXISTS tasks_loop_id_idx ON public.tasks(loop_id);
        CREATE INDEX IF NOT EXISTS loops_user_id_idx ON public.loops(user_id);
      `);

      // 4. Set up RLS
      console.log('Setting up Row Level Security...');
      await supabase.schema.raw(`
        ALTER TABLE public.loops ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for loops
        DROP POLICY IF EXISTS "Users can view their own loops" ON public.loops;
        CREATE POLICY "Users can view their own loops" 
          ON public.loops FOR SELECT 
          USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own loops" ON public.loops;
        CREATE POLICY "Users can insert their own loops" 
          ON public.loops FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own loops" ON public.loops;
        CREATE POLICY "Users can update their own loops" 
          ON public.loops FOR UPDATE
          USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete their own loops" ON public.loops;
        CREATE POLICY "Users can delete their own loops" 
          ON public.loops FOR DELETE
          USING (auth.uid() = user_id);
        
        -- Create policies for tasks
        DROP POLICY IF EXISTS "Users can view tasks in their loops" ON public.tasks;
        CREATE POLICY "Users can view tasks in their loops" 
          ON public.tasks FOR SELECT 
          USING ((SELECT user_id FROM public.loops WHERE id = tasks.loop_id) = auth.uid());
        
        DROP POLICY IF EXISTS "Users can insert tasks in their loops" ON public.tasks;
        CREATE POLICY "Users can insert tasks in their loops" 
          ON public.tasks FOR INSERT 
          WITH CHECK ((SELECT user_id FROM public.loops WHERE id = loop_id) = auth.uid());
        
        DROP POLICY IF EXISTS "Users can update tasks in their loops" ON public.tasks;
        CREATE POLICY "Users can update tasks in their loops" 
          ON public.tasks FOR UPDATE
          USING ((SELECT user_id FROM public.loops WHERE id = loop_id) = auth.uid());
        
        DROP POLICY IF EXISTS "Users can delete tasks in their loops" ON public.tasks;
        CREATE POLICY "Users can delete tasks in their loops" 
          ON public.tasks FOR DELETE
          USING ((SELECT user_id FROM public.loops WHERE id = loop_id) = auth.uid());
      `);

      console.log('Success: Database schema set up successfully!');
    } catch (sqlError) {
      console.error('Error executing SQL:', sqlError);

      // If we get an error here, we'll try to create just the tables without policies
      console.log('\nRetrying with basic table creation only...');

      try {
        await supabase.schema.raw(`
          CREATE TABLE IF NOT EXISTS public.loops (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          
          CREATE TABLE IF NOT EXISTS public.tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            loop_id UUID NOT NULL REFERENCES public.loops(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            order INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        console.log('Basic tables created successfully!');
      } catch (basicError) {
        console.error('Error creating basic tables:', basicError);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
