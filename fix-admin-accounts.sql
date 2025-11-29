-- Fix Admin/Lecturer Account Issues
-- Run this in Supabase SQL Editor

-- First, make email nullable (if not already done)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either email or wallet_address exists
ALTER TABLE users ADD CONSTRAINT users_email_or_wallet_check 
CHECK (email IS NOT NULL OR wallet_address IS NOT NULL);

-- Clean up any duplicate admin accounts and ensure proper setup
-- Delete any duplicate admin accounts that don't have privy_id (old manual inserts)
DELETE FROM users 
WHERE email = 'pheonixnightmare2003@gmail.com' 
AND privy_id IS NULL;

-- Delete any duplicate lecturer accounts that don't have privy_id
DELETE FROM users 
WHERE email = 'tp067591@mail.apu.edu.my' 
AND privy_id IS NULL;

-- Ensure admin account exists with correct role
INSERT INTO users (
  email, 
  name, 
  role, 
  department, 
  password_hash,
  privy_id,
  wallet_address,
  created_at,
  updated_at
) VALUES (
  'pheonixnightmare2003@gmail.com',
  'Administrator',
  'administrator',
  'System Administration',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'administrator',
  name = 'Administrator',
  department = 'System Administration',
  updated_at = NOW();

-- Ensure lecturer account exists with correct role
INSERT INTO users (
  email,
  name, 
  role,
  department,
  password_hash,
  privy_id,
  wallet_address,
  created_at,
  updated_at
) VALUES (
  'tp067591@mail.apu.edu.my',
  'Lecturer',
  'lecturer', 
  'Computer Science',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'lecturer',
  name = 'Lecturer',
  department = 'Computer Science',
  updated_at = NOW();

-- Verify the accounts
SELECT id, email, name, role, department, privy_id, wallet_address, created_at 
FROM users 
WHERE email IN ('pheonixnightmare2003@gmail.com', 'tp067591@mail.apu.edu.my')
ORDER BY role DESC;

-- Show all users for verification
SELECT id, email, name, role, privy_id IS NOT NULL as has_privy_id, wallet_address IS NOT NULL as has_wallet
FROM users 
ORDER BY role DESC, created_at DESC;








