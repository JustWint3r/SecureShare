// Test Supabase Connection
// Run this with: node test-supabase.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Environment variables:');
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!supabaseUrl || !supabaseKey) {
    console.log(
      '❌ Please update your .env.local file with Supabase credentials'
    );
    return;
  }

  try {
    // Create client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection by fetching users
    console.log('🔗 Connecting to database...');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(5);

    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Connection successful!');
    console.log(`📊 Found ${data.length} users in database:`);

    data.forEach((user, index) => {
      console.log(
        `  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`
      );
    });

    console.log('\n🎉 Supabase setup is working correctly!');
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testConnection();






