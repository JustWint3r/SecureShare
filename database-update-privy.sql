-- Update database schema to support Privy authentication
-- Run this in Supabase SQL Editor

-- Add Privy-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS privy_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index for Privy ID lookups
CREATE INDEX IF NOT EXISTS idx_users_privy_id ON users(privy_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Update existing users to allow NULL password_hash (for Privy users)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;




