-- ========================================
-- Enable Row Level Security (RLS) on all tables
-- This addresses the security warnings from Supabase
-- ========================================

-- 1. Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own files
CREATE POLICY "Users can view their own files"
  ON files
  FOR SELECT
  USING (owner_id::text = auth.uid()::text);

-- Policy: Users can insert their own files
CREATE POLICY "Users can insert their own files"
  ON files
  FOR INSERT
  WITH CHECK (owner_id::text = auth.uid()::text);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
  ON files
  FOR UPDATE
  USING (owner_id::text = auth.uid()::text);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON files
  FOR DELETE
  USING (owner_id::text = auth.uid()::text);

-- Policy: Administrators can view all files
CREATE POLICY "Administrators can view all files"
  ON files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- ========================================
-- 2. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (id::text = auth.uid()::text);

-- Policy: Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (id::text = auth.uid()::text);

-- Policy: Administrators can view all users
CREATE POLICY "Administrators can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'administrator'
    )
  );

-- Policy: Administrators can update all users
CREATE POLICY "Administrators can update all users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'administrator'
    )
  );

-- Policy: Administrators can delete users
CREATE POLICY "Administrators can delete users"
  ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'administrator'
    )
  );

-- ========================================
-- 3. Enable RLS on file_permissions table
ALTER TABLE file_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view permissions for files they own
CREATE POLICY "Users can view permissions for their files"
  ON file_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_permissions.file_id
      AND files.owner_id::text = auth.uid()::text
    )
  );

-- Policy: Users can view permissions granted to them
CREATE POLICY "Users can view their granted permissions"
  ON file_permissions
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: Users can create permissions for files they own
CREATE POLICY "Users can create permissions for their files"
  ON file_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_permissions.file_id
      AND files.owner_id::text = auth.uid()::text
    )
  );

-- Policy: Users can delete permissions for files they own
CREATE POLICY "Users can delete permissions for their files"
  ON file_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = file_permissions.file_id
      AND files.owner_id::text = auth.uid()::text
    )
  );

-- ========================================
-- 4. Enable RLS on access_logs table
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own access logs
CREATE POLICY "Users can view their own access logs"
  ON access_logs
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: System can insert access logs (service role)
CREATE POLICY "System can insert access logs"
  ON access_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: Administrators can view all access logs
CREATE POLICY "Administrators can view all access logs"
  ON access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- ========================================
-- 5. Enable RLS on share_tokens table
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tokens for files they own
CREATE POLICY "Users can view tokens for their files"
  ON share_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = share_tokens.file_id
      AND files.owner_id::text = auth.uid()::text
    )
  );

-- Policy: Users can create tokens for files they own
CREATE POLICY "Users can create tokens for their files"
  ON share_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files
      WHERE files.id = share_tokens.file_id
      AND files.owner_id::text = auth.uid()::text
    )
  );

-- Policy: Public can view valid tokens (for sharing)
CREATE POLICY "Anyone can view valid tokens"
  ON share_tokens
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_access_count IS NULL OR access_count < max_access_count)
  );

-- ========================================
-- 6. Enable RLS on admin_inquiries table
ALTER TABLE admin_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own inquiries
CREATE POLICY "Users can create their own inquiries"
  ON admin_inquiries
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Policy: Users can view their own inquiries
CREATE POLICY "Users can view their own inquiries"
  ON admin_inquiries
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: Administrators can view all inquiries
CREATE POLICY "Administrators can view all inquiries"
  ON admin_inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- Policy: Administrators can update all inquiries
CREATE POLICY "Administrators can update inquiries"
  ON admin_inquiries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- Policy: Administrators can delete inquiries
CREATE POLICY "Administrators can delete inquiries"
  ON admin_inquiries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- ========================================
-- Verification: Check RLS is enabled on all tables
-- ========================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('files', 'users', 'file_permissions', 'access_logs', 'share_tokens', 'admin_inquiries')
ORDER BY tablename;
