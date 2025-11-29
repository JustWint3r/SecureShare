import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Client for browser/frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations with elevated permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database Schema SQL for reference
export const databaseSchema = `
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'administrator')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  ipfs_hash TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File permissions table
CREATE TABLE file_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'share')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Access logs table
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'view', 'share', 'revoke', 'delete')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  transaction_hash TEXT
);

-- Indexes for better performance
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_file_permissions_file_id ON file_permissions(file_id);
CREATE INDEX idx_file_permissions_user_id ON file_permissions(user_id);
CREATE INDEX idx_access_logs_file_id ON access_logs(file_id);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (except admins)
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'administrator');

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Files visibility based on ownership and permissions
CREATE POLICY files_select ON files
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM file_permissions 
      WHERE file_id = files.id 
      AND user_id = auth.uid() 
      AND is_active = TRUE
    )
  );

-- Users can insert their own files
CREATE POLICY files_insert_own ON files
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own files
CREATE POLICY files_update_own ON files
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own files
CREATE POLICY files_delete_own ON files
  FOR DELETE USING (owner_id = auth.uid());
`;

// Helper functions for common database operations
export const dbHelpers = {
  // Get user by email
  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new user
  async createUser(userData: {
    email: string;
    password_hash: string;
    name: string;
    role: string;
    department?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user files
  async getUserFiles(userId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get files accessible to user
  async getAccessibleFiles(userId: string) {
    const { data, error } = await supabase
      .from('files')
      .select(
        `
        *,
        file_permissions!inner(
          permission_type,
          is_active
        )
      `
      )
      .eq('file_permissions.user_id', userId)
      .eq('file_permissions.is_active', true);

    if (error) throw error;
    return data;
  },

  // Create file record
  async createFile(fileData: {
    name: string;
    size: number;
    type: string;
    ipfs_hash: string;
    encrypted_key: string;
    owner_id: string;
  }) {
    const { data, error } = await supabase
      .from('files')
      .insert(fileData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Log access event
  async logAccess(logData: {
    file_id: string;
    user_id: string;
    action: string;
    ip_address?: string;
    user_agent?: string;
    transaction_hash?: string;
  }) {
    const { data, error } = await supabase
      .from('access_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
