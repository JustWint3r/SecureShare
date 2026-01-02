// Create admin_inquiries table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createTable() {
  console.log('🔄 Creating admin_inquiries table...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Execute raw SQL using RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS admin_inquiries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          attachments TEXT[],
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'closed')),
          admin_response TEXT,
          responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
          responded_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_admin_inquiries_user_id ON admin_inquiries(user_id);
        CREATE INDEX IF NOT EXISTS idx_admin_inquiries_status ON admin_inquiries(status);
        CREATE INDEX IF NOT EXISTS idx_admin_inquiries_created_at ON admin_inquiries(created_at DESC);
      `
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('\n⚠️  Please create the table manually in Supabase SQL Editor');
      console.log('📋 Copy the SQL from: create-admin-inquiries-table.sql\n');
      return;
    }

    console.log('✅ Table created successfully!');

    // Test the table
    const { error: testError } = await supabase
      .from('admin_inquiries')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('⚠️  Table may not be accessible:', testError.message);
    } else {
      console.log('✅ Table is accessible and ready to use!');
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
    console.log('\n📝 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   1. Go to your Supabase project');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the content from: create-admin-inquiries-table.sql');
    console.log('   4. Run the query\n');
  }
}

createTable();
