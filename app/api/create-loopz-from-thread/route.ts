import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { SERVER_PROMPTS } from '../../lib/server-prompts';

// Initialize OpenAI client (server-side)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate environment is properly set up
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ Missing OPENAI_API_KEY environment variable');
}

// Helper functions for server side only
async function generateClarification(messages: any[]): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    // Ensure we have valid messages to send to OpenAI
    if (!Array.isArray(messages) || messages.length === 0) {
      console.warn('No messages provided to generateClarification, using fallback');
      return 'I understand your situation. Let me help you organize your thoughts.';
    }

    // Log for debugging
    console.log(`Sending ${messages.length} messages to OpenAI for clarification`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      temperature: 0.7,
      messages: [
        { role: 'system', content: SERVER_PROMPTS.clarification.systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      console.warn('OpenAI returned empty content, using fallback message');
      return 'I understand your situation. Let me help you organize your thoughts.';
    }

    return content;
  } catch (error) {
    // Detailed error logging
    console.error('Error generating clarification from OpenAI:', error);

    if (error instanceof Error) {
      // Rethrow with more context for better debugging
      throw new Error(`OpenAI API error in generateClarification: ${error.message}`);
    }

    throw error; // Let the API route handler catch and format this
  }
}

async function generateTasksFromThread(messages: any[]): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const DEFAULT_TASKS = [
    'Review your situation',
    'Identify key priorities',
    'Create a simple plan',
  ];

  try {
    // Ensure we have valid messages
    if (!Array.isArray(messages) || messages.length === 0) {
      console.warn('No messages provided to generateTasksFromThread, using fallback tasks');
      return DEFAULT_TASKS;
    }

    // Log for debugging
    console.log(`Sending ${messages.length} messages to OpenAI for task generation`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      temperature: 0.7,
      messages: [
        { role: 'system', content: SERVER_PROMPTS.taskification.systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      console.warn('OpenAI returned empty content for task generation, using fallback tasks');
      return DEFAULT_TASKS;
    }

    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);

      // Extract the tasks array, handling different possible formats
      const tasks = parsedResponse.tasks || parsedResponse || [];

      // Ensure we have at least some default tasks if parsing failed
      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.warn('No tasks found in OpenAI response, using fallback tasks');
        return DEFAULT_TASKS;
      }

      // Validate each task is a non-empty string
      const validTasks = tasks.filter((task) => typeof task === 'string' && task.trim().length > 0);

      if (validTasks.length === 0) {
        console.warn('No valid tasks found in OpenAI response, using fallback tasks');
        return DEFAULT_TASKS;
      }

      return validTasks;
    } catch (e) {
      console.error('Error parsing tasks JSON:', e);
      throw new Error(
        `Failed to parse OpenAI JSON response: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  } catch (error) {
    console.error('Error generating tasks from OpenAI:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      // If it's a parsing error we already created, just throw it up
      throw error;
    }

    // Otherwise add context and rethrow
    throw new Error(
      `OpenAI API error in generateTasksFromThread: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }

    // Create server supabase client with proper cookie handling
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Get the current user session with detailed error handling
    const sessionResponse = await supabase.auth.getSession();
    console.log(
      'Session response:',
      JSON.stringify({
        user: sessionResponse.data.session?.user?.id
          ? `exists (${sessionResponse.data.session.user.id.slice(0, 8)}...)`
          : 'missing',
        error: sessionResponse.error || 'none',
      }),
    );

    const session = sessionResponse.data.session;

    // Return error if not logged in
    if (!session || !session.user || !session.user.id) {
      console.error('No valid session found. Authentication required for this endpoint.');
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 });
    }

    // Log the authenticated user
    console.log(`Authenticated user: ${session.user.id.slice(0, 8)}...`);

    // Verify we have the necessary auth context for RLS policies
    try {
      // Test RLS by making a simple query
      const { data: testData, error: testError } = await supabase
        .from('loopz')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('RLS test query failed:', testError);
        return NextResponse.json(
          {
            error: 'Authentication validation failed',
            details: testError.message,
          },
          { status: 500 },
        );
      }

      console.log('RLS validation successful');
    } catch (authTestError) {
      console.error('Error testing authentication:', authTestError);
      return NextResponse.json(
        { error: 'Failed to validate authentication context' },
        { status: 500 },
      );
    }

    // Parse request body
    let messages, loopzId;
    // Important: Always use the authenticated user's ID from the session for RLS
    const userId = session.user.id;

    try {
      const body = await req.json();
      messages = body.messages;
      loopzId = body.loopzId;

      // Validate request body
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'Invalid request: messages must be an array' },
          { status: 400 },
        );
      }

      // No need to validate userId from request - we're using the session user
      console.log(`Using authenticated user ID: ${userId.slice(0, 8)}... for database operations`);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    console.log(
      `Processing request for user ${userId.slice(0, 8)}... with ${messages.length} messages`,
    );

    try {
      // Phase 1: Goal clarification
      const clarification = await generateClarification(messages);
      console.log('Successfully generated clarification response');

      // Phase 2: Generate tasks
      const tasks = await generateTasksFromThread([
        ...messages,
        { role: 'assistant', content: clarification, phase: 'clarification' },
      ]);
      console.log(`Successfully generated ${tasks.length} tasks`);

      // Begin database operations
      let loop: any;
      let createdTasks: any[] = [];

      // Determine loop title from clarification (first 50 chars or first sentence)
      let loopTitle = clarification.split('.')[0].trim();
      if (loopTitle.length > 50) {
        loopTitle = loopTitle.substring(0, 47) + '...';
      }

      // If no loopzId was provided, create a new loop
      if (!loopzId) {
        // Create a unique ID for the loop
        const loopId = uuidv4();
        console.log(`Creating new loop with ID: ${loopId} for user: ${userId.slice(0, 8)}...`);

        try {
          // First verify we have proper authenticated access to the Supabase tables
          console.log('Verifying Supabase authenticated access...');

          // Insert the loop - using standardized schema fields
          const timestamp = new Date().toISOString();
          const loopData = {
            id: loopId,
            user_id: userId, // Uses the session user ID to satisfy RLS
            title: loopTitle,
            created_at: timestamp,
            updated_at: timestamp, // Added after schema update
            description: clarification,
            progress: 0,
            totalSteps: tasks.length, // Using camelCase for consistency with TS interfaces
            completedSteps: 0, // Using camelCase for consistency with TS interfaces
          };

          // No need for schema checks since we've standardized the schema
          console.log('Using standardized schema fields - no additional validation needed');

          console.log(
            'Inserting loop:',
            JSON.stringify({
              id: loopData.id,
              user_id: `${loopData.user_id.slice(0, 8)}...`,
              title: loopData.title,
            }),
          );

          const { data: newLoop, error: loopError } = await supabase
            .from('loopz')
            .insert(loopData)
            .select('*')
            .single();

          if (loopError) {
            console.error('Loop creation failed:', loopError);
            throw new Error(`Failed to create loop: ${loopError.message}`);
          }

          loop = newLoop;
          console.log(`Loop created successfully: ${loop.id}`);

          // Generate task IDs upfront
          const taskIds = tasks.map(() => uuidv4());

          // Create tasks with standardized schema
          const tasksToInsert = tasks.map((taskTitle, index) => ({
            id: taskIds[index],
            loopz_id: loop.id,
            user_id: userId, // Direct RLS policy requires user_id
            title: taskTitle,
            is_completed: false,
            position: index,
            created_at: timestamp,
            updated_at: timestamp,
          }));

          console.log(`Inserting ${tasksToInsert.length} tasks for loop: ${loop.id}`);
          const { data: insertedTasks, error: tasksError } = await supabase
            .from('tasks')
            .insert(tasksToInsert)
            .select('*');

          if (tasksError) {
            console.error('Task creation failed:', tasksError);
            throw new Error(`Failed to create tasks: ${tasksError.message}`);
          }

          createdTasks = insertedTasks;
          console.log(`${createdTasks.length} tasks created successfully`);

          // Store the initial messages
          const messageIds = [...messages, {}].map(() => uuidv4());

          // Create messages with standardized schema
          const messagesToInsert = [
            ...messages,
            {
              role: 'assistant',
              content: clarification,
              phase: 'clarification',
              created_at: timestamp,
            },
          ].map((msg, index) => ({
            id: messageIds[index],
            loopz_id: loop.id,
            user_id: userId, // Direct RLS policy requires user_id
            role: msg.role,
            phase: msg.phase || 'reflection',
            content: msg.content,
            created_at: msg.created_at || timestamp,
            updated_at: timestamp,
          }));

          console.log(`Inserting ${messagesToInsert.length} messages for loop: ${loop.id}`);
          const { error: messagesError } = await supabase.from('messages').insert(messagesToInsert);

          if (messagesError) {
            console.error('Message creation failed:', messagesError);
            throw new Error(`Failed to store messages: ${messagesError.message}`);
          }

          console.log(`${messagesToInsert.length} messages stored successfully`);
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          return NextResponse.json(
            {
              error: dbError instanceof Error ? dbError.message : 'Database operation failed',
            },
            { status: 500 },
          );
        }
      } else {
        // For an existing loop, we might handle continuing a conversation differently
        // This would be implemented for multi-turn conversations in Phase 2
        // For now, we'll just respond with an error
        return NextResponse.json(
          { error: 'Continuing existing loops not implemented yet' },
          { status: 501 },
        );
      }

      // Prepare response with structured data and include detailed logs
      console.log('Successfully completed request, returning response');

      // Gather debugging info from the process
      const debugInfo = {
        success: true,
        loopId: loop.id,
        numTasks: createdTasks.length,
        clarificationLength: clarification.length,
        tasksIds: createdTasks.map((t) => t.id),
      };

      console.log('Debug info:', JSON.stringify(debugInfo));

      return NextResponse.json({
        loop,
        tasks: createdTasks,
        aiResponse: clarification,
        debug: debugInfo,
      });
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      return NextResponse.json(
        {
          error: 'AI processing failed',
          details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Unhandled error in create-loopz-from-thread:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        stack:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 },
    );
  }
}
