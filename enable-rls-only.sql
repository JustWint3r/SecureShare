-- ========================================
-- Enable Row Level Security (RLS) on all tables
-- This script only enables RLS without creating policies
-- Run this if you've already created policies but RLS is not enabled
-- ========================================

-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on file_permissions table
ALTER TABLE file_permissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on access_logs table
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on share_tokens table
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_inquiries table (if it exists)
ALTER TABLE admin_inquiries ENABLE ROW LEVEL SECURITY;

-- Verification: Check RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('files', 'users', 'file_permissions', 'access_logs', 'share_tokens', 'admin_inquiries')
ORDER BY tablename;
