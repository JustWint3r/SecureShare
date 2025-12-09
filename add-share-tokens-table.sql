-- Migration: Add share_tokens table for file sharing functionality
-- Run this in Supabase SQL Editor if you already have an existing database

-- Create share_tokens table
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'comment', 'full')),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_file_id ON share_tokens(file_id);

-- Verify the table was created
SELECT
  'share_tokens table created successfully' as status,
  COUNT(*) as row_count
FROM share_tokens;
