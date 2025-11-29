-- Create Administrator and Lecturer accounts
-- Run this in Supabase SQL Editor

-- Insert Administrator account
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
  NULL, -- Will be set when they login with Privy
  NULL, -- Will be set when they login with Privy
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'administrator',
  department = 'System Administration',
  updated_at = NOW();

-- Insert Lecturer account  
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
  NULL, -- Will be set when they login with Privy
  NULL, -- Will be set when they login with Privy
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'lecturer',
  department = 'Computer Science',
  updated_at = NOW();

-- Verify the accounts were created
SELECT email, name, role, department, created_at 
FROM users 
WHERE email IN ('pheonixnightmare2003@gmail.com', 'tp067591@mail.apu.edu.my')
ORDER BY role DESC;





