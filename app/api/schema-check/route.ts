import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Debug API route to check database schema
 */
export async function GET(req: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push('Starting schema check');

    // Create server supabase client
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Get the current user session for RLS
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          logs,
        },
        { status: 401 },
      );
    }

    logs.push(`Authenticated as user: ${session.user.id.slice(0, 8)}...`);

    // Check loopz table schema
    let loopzColumns: string[] = [];
    try {
      const { data: loopzInfo, error: loopzError } = await supabase.rpc('get_table_columns', {
        table_name: 'loopz',
      });

      if (loopzError) {
        logs.push(`Error getting loopz columns: ${loopzError.message}`);

        // Try a different approach - direct query
        const { data: directInfo, error: directError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'loopz');

        if (!directError && directInfo) {
          loopzColumns = directInfo.map((col) => col.column_name);
          logs.push(`Got loopz columns via direct query: ${loopzColumns.join(', ')}`);
        } else if (directError) {
          logs.push(`Direct query error: ${directError.message}`);
        }
      } else if (loopzInfo) {
        loopzColumns = loopzInfo.map((col: any) => col.column_name);
        logs.push(`Got loopz columns via RPC: ${loopzColumns.join(', ')}`);
      }
    } catch (e) {
      logs.push(`Exception during schema check: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Try a raw query to understand the loopz schema
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('loopz')
        .select('*')
        .limit(1);

      if (!tableError && tableData && tableData.length > 0) {
        const sampleRow = tableData[0];
        const fieldsFromSample = Object.keys(sampleRow);
        logs.push(`Fields from sample row: ${fieldsFromSample.join(', ')}`);
      } else if (tableError) {
        logs.push(`Error querying table: ${tableError.message}`);
      } else {
        logs.push('No data found in loopz table');
      }
    } catch (e) {
      logs.push(`Exception during table query: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Manual query to test schema
    try {
      const { data, error } = await supabase
        .from('loopz')
        .insert({
          title: 'Schema Test',
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logs.push(`Insert test error: ${error.message}`);
      } else {
        logs.push(`Insert test succeeded! Fields: ${Object.keys(data).join(', ')}`);
      }
    } catch (e) {
      logs.push(`Exception during insert test: ${e instanceof Error ? e.message : String(e)}`);
    }

    return NextResponse.json({
      success: true,
      loopzColumns,
      logs,
    });
  } catch (error) {
    logs.push(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs,
      },
      { status: 500 },
    );
  }
}

// Add an RPC function to get table columns
// Run this SQL in Supabase:
/*
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS SETOF information_schema.columns
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = get_table_columns.table_name;
$$;
*/
