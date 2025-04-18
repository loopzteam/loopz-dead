#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Preparing Loopz database setup...');

// Generate SQL file from our template
try {
  const sqlPath = path.join(__dirname, '../setup.sql');
  const setupSql = fs.readFileSync(path.join(__dirname, '../lib/create-tables.sql'), 'utf8');
  
  // Write the SQL to a file the user can easily access
  fs.writeFileSync(sqlPath, setupSql);
  
  console.log('\n✅ SQL file ready at: ' + sqlPath);
  
  // Print instructions
  console.log('\nTo set up your database:');
  console.log('1. Go to https://supabase.com/dashboard and open your project');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Click "New Query"');
  console.log('4. Open the setup.sql file in the root of this project and copy its contents');
  console.log('5. Paste the SQL into the Supabase SQL Editor');
  console.log('6. Click "Run" to execute the query\n');
  
  // Try to automatically open the SQL file
  try {
    console.log('Opening SQL file...');
    
    if (process.platform === 'win32') {
      execSync(`start ${sqlPath}`);
    } else if (process.platform === 'darwin') {
      execSync(`open ${sqlPath}`);
    } else {
      execSync(`xdg-open ${sqlPath}`);
    }
  } catch (openError) {
    console.log('Could not automatically open the file. Please open it manually.');
  }
  
  console.log('\nOnce you\'ve run the SQL script, your app will be ready to use.');
  console.log('Run "npm run dev" to start the development server.');
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
} 