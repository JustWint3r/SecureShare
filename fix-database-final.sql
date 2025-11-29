-- Final Database Fix Script
-- Run this in Supabase SQL Editor

-- Step 1: Make email nullable (ignore error if already done)
DO $$ 
BEGIN
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Email column is already nullable or error occurred: %', SQLERRM;
END $$;

-- Step 2: Add constraint if it doesn't exist (ignore error if already exists)
DO $$ 
BEGIN
    ALTER TABLE users ADD CONSTRAINT users_email_or_wallet_check 
    CHECK (email IS NOT NULL OR wallet_address IS NOT NULL);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint users_email_or_wallet_check already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- Step 3: Clean up any duplicate admin accounts (keep only one)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM users 
    WHERE email = 'pheonixnightmare2003@gmail.com'
)
DELETE FROM users 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 4: Clean up any duplicate lecturer accounts (keep only one)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM users 
    WHERE email = 'tp067591@mail.apu.edu.my'
)
DELETE FROM users 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 5: Ensure admin account exists with correct role
INSERT INTO users (
  email, name, role, department, password_hash, privy_id, wallet_address, created_at, updated_at
) VALUES (
  'pheonixnightmare2003@gmail.com', 'Administrator', 'administrator', 'System Administration', 
  NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'administrator',
  name = 'Administrator', 
  department = 'System Administration',
  updated_at = NOW();

-- Step 6: Ensure lecturer account exists with correct role
INSERT INTO users (
  email, name, role, department, password_hash, privy_id, wallet_address, created_at, updated_at
) VALUES (
  'tp067591@mail.apu.edu.my', 'Lecturer', 'lecturer', 'Computer Science', 
  NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'lecturer',
  name = 'Lecturer',
  department = 'Computer Science', 
  updated_at = NOW();

-- Step 7: Verify the setup
SELECT 
    'Database Setup Complete' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'administrator' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'lecturer' THEN 1 END) as lecturer_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM users;

-- Step 8: Show admin and lecturer accounts
SELECT 
    email, name, role, department, 
    privy_id IS NOT NULL as has_privy_id,
    wallet_address IS NOT NULL as has_wallet,
    created_at
FROM users 
WHERE email IN ('pheonixnightmare2003@gmail.com', 'tp067591@mail.apu.edu.my')
ORDER BY role DESC;

-- Step 9: Show constraint status
SELECT 
    constraint_name, 
    constraint_type,
    is_deferrable,
    initially_deferred
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
AND constraint_name = 'users_email_or_wallet_check';

