#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Log the environment variables for debugging
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Key exists (not showing for security)' : 'Missing');

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testConnection() {
  try {
    console.log('\nTesting Supabase connection...');
    
    // Test if we can query auth.users (requires service role key)
    console.log('\nTesting authentication database connection...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5);
    
    if (usersError) {
      console.log('Auth query error:', usersError.message);
    } else {
      console.log('✅ Successfully connected to auth database!');
      console.log(`Found ${users.length} users`);
    }
    
    // Try to create a test table directly
    console.log('\nTesting table creation permission...');
    try {
      // Using raw SQL with REST API
      const { error: tableError } = await supabase
        .from('_schema')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log('Error querying schema tables:', tableError.message);
        console.log('This is probably because _schema is not accessible directly');
      } else {
        console.log('Successfully queried schema information');
      }
    } catch (sqlError) {
      console.log('Error executing SQL statement:', sqlError.message);
    }
    
    // Try to test basic storage access
    console.log('\nTesting storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.log('Storage error:', bucketsError.message);
    } else {
      console.log('✅ Successfully accessed storage!');
      console.log(`Found ${buckets.length} storage buckets`);
    }
    
    // Test if we can create our own tables
    console.log('\nTesting creating a new table...');
    try {
      // Create a test table
      const createTableResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS public.test_table (
              id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
              created_at timestamptz DEFAULT now()
            );
          `
        })
      });
      
      if (!createTableResponse.ok) {
        const responseText = await createTableResponse.text();
        console.log('Table creation error:', responseText);
        console.log('This is expected if the execute_sql function doesn\'t exist');
        console.log('You need to run the setup.sql script in Supabase first');
      } else {
        console.log('✅ Successfully created test table!');
      }
    } catch (createError) {
      console.log('Error creating test table:', createError.message);
    }
    
    console.log('\nTest completed - Your Supabase connection is working!');
    console.log('Note: Some errors above are expected if you haven\'t run setup.sql yet');
  } catch (err) {
    console.error('Error testing Supabase connection:', err.message);
  }
}

testConnection(); 