-- Fix User Accounts - Debugging and Cleanup Script
-- Run this in Supabase SQL Editor to understand and fix login issues

-- ==================================================
-- STEP 1: View all current users and identify duplicates
-- ==================================================
SELECT
  id,
  email,
  name,
  role,
  privy_id,
  wallet_address,
  created_at
FROM users
ORDER BY email, created_at;

-- ==================================================
-- STEP 2: Find duplicate emails (if any)
-- ==================================================
SELECT
  email,
  COUNT(*) as count,
  STRING_AGG(DISTINCT role, ', ') as roles,
  STRING_AGG(id::text, ', ') as user_ids
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- ==================================================
-- STEP 3: View users without privy_id (not yet logged in via Privy)
-- ==================================================
SELECT
  email,
  name,
  role,
  department,
  privy_id,
  created_at
FROM users
WHERE privy_id IS NULL
ORDER BY created_at;

-- ==================================================
-- STEP 4: Clean up - DELETE ALL USERS (use with caution!)
-- Uncomment the lines below ONLY if you want to start fresh
-- ==================================================

-- WARNING: This will delete ALL users and their files!
-- DELETE FROM users;

-- ==================================================
-- STEP 5: Create fresh accounts with proper roles
-- Run this AFTER deleting if you want to start fresh
-- ==================================================

-- Note: With Privy, users will be created automatically on first login
-- So we only need to pre-create accounts if we want specific roles

-- Administrator account (will be created/updated on first Privy login)
INSERT INTO users (
  email,
  name,
  role,
  department,
  password_hash,
  privy_id,
  wallet_address
) VALUES (
  'pheonixnightmare2003@gmail.com',
  'Administrator',
  'administrator',
  'System Administration',
  NULL,
  NULL,
  NULL
) ON CONFLICT (email) DO UPDATE SET
  role = 'administrator',
  department = 'System Administration',
  name = 'Administrator',
  updated_at = NOW();

-- Lecturer account
INSERT INTO users (
  email,
  name,
  role,
  department,
  password_hash,
  privy_id,
  wallet_address
) VALUES (
  'tp067591@mail.apu.edu.my',
  'Dr. Sahun Lim',
  'lecturer',
  'Computer Science',
  NULL,
  NULL,
  NULL
) ON CONFLICT (email) DO UPDATE SET
  role = 'lecturer',
  department = 'Computer Science',
  name = 'Dr. Sahun Lim',
  updated_at = NOW();

-- Student account
INSERT INTO users (
  email,
  name,
  role,
  department,
  password_hash,
  privy_id,
  wallet_address
) VALUES (
  'justwint3r@gmail.com',
  'Wint3r',
  'student',
  'Computer Science',
  NULL,
  NULL,
  NULL
) ON CONFLICT (email) DO UPDATE SET
  role = 'student',
  department = 'Computer Science',
  name = 'Wint3r',
  updated_at = NOW();

-- ==================================================
-- STEP 6: Update existing user's role (if they already logged in)
-- ==================================================

-- Update justwint3r@gmail.com to student role
UPDATE users
SET
  role = 'student',
  department = 'Computer Science',
  name = 'Wint3r',
  updated_at = NOW()
WHERE email = 'justwint3r@gmail.com';

-- Update admin account
UPDATE users
SET
  role = 'administrator',
  department = 'System Administration',
  name = 'Administrator',
  updated_at = NOW()
WHERE email = 'pheonixnightmare2003@gmail.com';

-- Update lecturer account
UPDATE users
SET
  role = 'lecturer',
  department = 'Computer Science',
  name = 'Dr. Sahun Lim',
  updated_at = NOW()
WHERE email = 'tp067591@mail.apu.edu.my';

-- ==================================================
-- STEP 7: Verify the updates
-- ==================================================
SELECT
  email,
  name,
  role,
  department,
  privy_id IS NOT NULL as has_logged_in,
  created_at
FROM users
WHERE email IN (
  'pheonixnightmare2003@gmail.com',
  'tp067591@mail.apu.edu.my',
  'justwint3r@gmail.com'
)
ORDER BY role DESC;

-- ==================================================
-- STEP 8: View all files and their owners (to check data)
-- ==================================================
SELECT
  f.id,
  f.name as file_name,
  f.size,
  u.email as owner_email,
  u.name as owner_name,
  u.role as owner_role,
  f.created_at
FROM files f
JOIN users u ON u.id = f.owner_id
ORDER BY f.created_at DESC;

-- ==================================================
-- RECOMMENDED APPROACH
-- ==================================================

-- If you're seeing wrong accounts when logging in:
--
-- 1. Run STEP 1 to see all users
-- 2. Run STEP 2 to check for duplicates
-- 3. Run STEP 6 to update the roles of existing users
-- 4. Clear your browser cache and cookies
-- 5. Log out from Privy completely
-- 6. Log in again with each email
--
-- The sync-privy-user endpoint will:
-- - If user exists with that email → update their privy_id
-- - If user doesn't exist → create new user as 'student'
-- - You need to manually update roles afterwards using STEP 6
