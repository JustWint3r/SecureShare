// Debug Login Issue
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

async function debugLogin() {
  console.log('🔍 Debugging login issue...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables not set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const email = 'student@university.edu';
  const password = 'test123';

  try {
    // 1. Check if user exists
    console.log('1. Checking if user exists...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError) {
      console.log('❌ User lookup error:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.name, '(' + user.email + ')');

    // 2. Check password hash
    console.log('\n2. Checking password hash...');
    const inputHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    const storedHash = user.password_hash;

    console.log('Input password:', password);
    console.log('Generated hash:', inputHash);
    console.log('Stored hash:   ', storedHash);
    console.log(
      'Hashes match: ',
      inputHash === storedHash ? '✅ YES' : '❌ NO'
    );

    // 3. Test the actual login API
    console.log('\n3. Testing login API...');
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    console.log('API Response:', result);
  } catch (error) {
    console.log('❌ Debug error:', error.message);
  }
}

debugLogin();






