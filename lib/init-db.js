#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function initDatabase() {
  console.log('Initializing database with required tables...');
  
  // Get Supabase credentials from env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
  }
  
  // Initialize Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Read the SQL schema from file
    const schemaPath = path.join(__dirname, 'create-tables.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Break the SQL into statements
    const statements = sqlSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i] + ';';
      const statementType = sql.trim().substring(0, 12).toUpperCase();
      
      try {
        console.log(`Executing statement ${i+1}/${statements.length}: ${statementType}...`);
        const { error } = await supabase.rpc('pg_query', { query: sql });
        
        if (error) {
          console.log(`  Error: ${error.message}`);
          
          // Continue with the next statement
          if (sql.includes('IF NOT EXISTS') || sql.includes('POLICY')) {
            console.log('  Continuing since this might be an idempotent operation...');
          }
        } else {
          console.log('  Success');
        }
      } catch (stmtError) {
        console.error(`  Failed to execute statement: ${stmtError.message}`);
      }
    }
    
    console.log('\nDatabase initialization complete!');
    console.log('You can now use your app with the proper database schema.');
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Execute the function
initDatabase(); 