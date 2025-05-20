import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// This is a protected route that should only be called with proper authorization
export async function POST(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SUPABASE_SETUP_TOKEN;

    if (!expectedToken) {
      return NextResponse.json({ error: 'SUPABASE_SETUP_TOKEN not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Supabase admin client (requires service_role key)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Read SQL schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { query: schema });

    if (error) {
      console.error('Database setup error:', error);
      return NextResponse.json(
        { error: 'Failed to set up database schema', details: error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema set up successfully',
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
