import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * Endpoint to check and update database schema
 * This can be called by a cron service at regular intervals
 * It's protected by a secret key to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
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

    // First, check if our tables exist
    const { data: existingTables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['loops', 'tasks']);

    if (tablesError) {
      return NextResponse.json(
        { error: 'Failed to check table existence', details: tablesError },
        { status: 500 },
      );
    }

    // If tables are missing or we have fewer than expected, run the setup
    if (!existingTables || existingTables.length < 2) {
      // Read SQL schema file
      const schemaPath = path.join(process.cwd(), 'lib', 'supabase-schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Execute SQL
      const { error } = await supabaseAdmin.rpc('exec_sql', { query: schema });

      if (error) {
        console.error('Database auto-setup error:', error);
        return NextResponse.json(
          { error: 'Failed to set up database schema', details: error },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Database schema updated successfully',
        action: 'setup',
      });
    }

    // Otherwise, everything is set up correctly
    return NextResponse.json({
      success: true,
      message: 'Database schema is up to date',
      action: 'none',
    });
  } catch (error) {
    console.error('Error in DB check cron:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
