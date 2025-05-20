const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const setupToken = process.env.SUPABASE_SETUP_TOKEN;

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
  try {
    console.log('Reading SQL schema update file...');
    const schemaFilePath = path.join(__dirname, 'update-tables.sql');
    const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');

    console.log('Executing SQL schema update via exec_sql RPC...');
    const { error } = await supabase.rpc('exec_sql', { query: schemaSql });

    if (error) {
      console.error('Error updating schema:', error);
      process.exit(1);
    }

    console.log('Schema updated successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('Starting schema update...');
  await updateSchema();
  console.log('Database update complete.');
}

// Run the main function
main();
