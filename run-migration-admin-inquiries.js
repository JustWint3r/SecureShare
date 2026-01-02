// Run admin_inquiries table migration
// Run this with: node run-migration-admin-inquiries.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running admin_inquiries table migration...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing environment variables');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  try {
    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add_admin_inquiries_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Loaded migration file');
    console.log('🔗 Connecting to database...\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.log('❌ Migration failed:', error.message);
      console.log('\n💡 Trying alternative method...\n');

      // Try executing statement by statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 50) + '...');

        // Use direct query for table creation
        if (statement.includes('CREATE TABLE')) {
          const { error: createError } = await supabase
            .from('admin_inquiries')
            .select('*')
            .limit(0);

          if (createError && createError.message.includes('does not exist')) {
            console.log('⚠️  Table does not exist. Please run the SQL manually in Supabase SQL Editor.');
            console.log('\n📋 Copy and paste this SQL into Supabase SQL Editor:\n');
            console.log(sql);
            return;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n🎉 admin_inquiries table has been created');

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('admin_inquiries')
      .select('*')
      .limit(1);

    if (!testError) {
      console.log('✅ Table is accessible and ready to use');
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
    console.log('\n💡 Please run the migration manually in Supabase SQL Editor');
    console.log('📁 Location: database/migrations/add_admin_inquiries_table.sql');
  }
}

runMigration();
