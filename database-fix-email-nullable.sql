-- Fix email column to allow NULL values for wallet-only users
-- Run this in Supabase SQL Editor

-- Make email column nullable to support wallet-only authentication
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add a constraint to ensure either email OR wallet_address is present
-- (This ensures we always have some way to identify the user)
ALTER TABLE users ADD CONSTRAINT users_email_or_wallet_check 
CHECK (email IS NOT NULL OR wallet_address IS NOT NULL);

-- Update any existing users with duplicate emails (if any)
-- This is just a safety measure
UPDATE users SET email = NULL WHERE email = '';

-- Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('email', 'wallet_address');

-- Show current constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users';





