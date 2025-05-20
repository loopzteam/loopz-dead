import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Debug API route to list recent loops
 */
export async function GET(req: NextRequest) {
  try {
    // Create server supabase client
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 });
    }

    // Fetch the user's loops
    const { data: loops, error: loopsError } = await supabase
      .from('loopz')
      .select('id, title, description, created_at, "totalSteps", "completedSteps", progress')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (loopsError) {
      return NextResponse.json(
        { error: `Error fetching loops: ${loopsError.message}` },
        { status: 500 },
      );
    }

    // For each loop, get its tasks
    const loopsWithTasks = await Promise.all(
      loops.map(async (loop) => {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, is_completed, position')
          .eq('loopz_id', loop.id)
          .order('position', { ascending: true });

        if (tasksError) {
          console.error(`Error fetching tasks for loop ${loop.id}: ${tasksError.message}`);
          return { ...loop, tasks: [] };
        }

        return { ...loop, tasks: tasks || [] };
      }),
    );

    return NextResponse.json({
      loops: loopsWithTasks,
      count: loops.length,
    });
  } catch (error) {
    console.error('Error in debug-list-loops:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
