import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Debug API route to test RLS authenticated inserts with Supabase
 */
export async function GET(req: NextRequest) {
  // Results and detailed logs for debugging
  const logs: string[] = [];
  let result = {
    success: false,
    error: null,
    data: null,
    logs: [] as string[],
  };

  try {
    logs.push('Starting debug RLS test');

    // Create server supabase client with cookie handling
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    logs.push('Created Supabase client');

    // Get the current user session with detailed error handling
    const sessionResponse = await supabase.auth.getSession();

    // Check if there's a session
    if (!sessionResponse.data.session) {
      logs.push('ERROR: No session found');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required - no session found',
          logs,
        },
        { status: 401 },
      );
    }

    // Check if the session has a user
    const session = sessionResponse.data.session;
    if (!session.user || !session.user.id) {
      logs.push('ERROR: Session exists but no user ID found');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication issue - no user ID in session',
          logs,
        },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    logs.push(`Found authenticated user: ${userId.slice(0, 8)}...`);

    // Create a test loopz entry
    const testId = uuidv4();
    const timestamp = new Date().toISOString();

    logs.push(`Attempting to insert test loopz with ID: ${testId}`);

    // Prepare test data - using camelCase fields to match TypeScript interfaces
    const loopzData = {
      id: testId,
      user_id: userId,
      title: 'Test RLS insert - schema matched',
      created_at: timestamp,
      updated_at: timestamp, // Added after schema update
      description: 'Testing insert with camelCase fields',
      progress: 0,
      totalSteps: 0, // CamelCase to match TS interfaces
      completedSteps: 0, // CamelCase to match TS interfaces
    };

    // Log the insert data (except for sensitive fields)
    logs.push(
      `Insert data: ${JSON.stringify({
        ...loopzData,
        user_id: `${userId.slice(0, 8)}...`, // Truncate for privacy
      })}`,
    );

    // Attempt to insert the test data
    const { data, error } = await supabase.from('loopz').insert(loopzData).select('*').single();

    if (error) {
      logs.push(`ERROR during insert: ${error.message}`);
      if (error.code) logs.push(`Error code: ${error.code}`);
      if (error.details) logs.push(`Error details: ${error.details}`);

      result = {
        success: false,
        error: error.message,
        data: null,
        logs,
      };
    } else {
      logs.push('Insert successful!');
      logs.push(`Inserted loopz with ID: ${data.id}`);

      result = {
        success: true,
        error: null,
        data: {
          id: data.id,
          title: data.title,
          user_id: `${data.user_id.slice(0, 8)}...`, // Truncate for privacy
        },
        logs,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logs.push(`EXCEPTION: ${errorMessage}`);

    if (error instanceof Error && error.stack) {
      logs.push(`Stack trace: ${error.stack}`);
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: null,
        logs,
      },
      { status: 500 },
    );
  }
}
