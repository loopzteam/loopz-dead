import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API route to test Supabase authentication and RLS
 */
export async function GET(req: NextRequest) {
  const logs: string[] = [];
  
  try {
    logs.push("Starting authentication test");
    
    // Create server supabase client
    const cookieStore = cookies();
    logs.push(`Cookie store created: ${cookieStore ? 'yes' : 'no'}`);
    
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });
    logs.push("Supabase client created");
    
    // Get session details
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logs.push(`Session error: ${sessionError.message}`);
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: sessionError.message,
        logs
      }, { status: 500 });
    }
    
    const session = sessionData.session;
    
    if (!session) {
      logs.push("No active session found");
      return NextResponse.json({
        success: true,
        authenticated: false,
        logs
      });
    }
    
    logs.push(`Session found for user: ${session.user.id.slice(0, 8)}...`);
    logs.push(`Email: ${session.user.email}`);
    logs.push(`Auth provider: ${session.user.app_metadata?.provider || 'unknown'}`);
    
    // Test RLS with a simple select query
    const { data: loopzData, error: loopzError } = await supabase
      .from('loopz')
      .select('id, title')
      .limit(5);
      
    if (loopzError) {
      logs.push(`RLS test failed: ${loopzError.message}`);
      return NextResponse.json({
        success: false,
        authenticated: true,
        error: loopzError.message,
        logs
      }, { status: 500 });
    }
    
    logs.push(`RLS test successful! Found ${loopzData?.length || 0} loopz records accessible to this user`);
    
    // Try a simple insert with minimal fields to test RLS insert policies
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('loopz')
        .insert({
          title: 'Auth Test',
          user_id: session.user.id
        })
        .select()
        .single();
        
      if (insertError) {
        logs.push(`Insert test failed: ${insertError.message}`);
        logs.push(`Error code: ${insertError.code}`);
        logs.push(`Error details: ${insertError.details || 'none'}`);
      } else {
        logs.push(`Insert test successful! Created loopz with ID: ${insertData.id}`);
      }
    } catch (insertException) {
      logs.push(`Insert exception: ${insertException instanceof Error ? insertException.message : String(insertException)}`);
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      logs
    });
    
  } catch (error) {
    logs.push(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      logs
    }, { status: 500 });
  }
}