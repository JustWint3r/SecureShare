-- Create Supabase Storage bucket for encrypted files
-- INSTRUCTIONS: Don't run this SQL. Instead, create the bucket through the UI.

-- ============================================
-- STEP 1: Create Storage Bucket via UI
-- ============================================
-- 1. Go to Supabase Dashboard
-- 2. Click "Storage" in the left sidebar
-- 3. Click "Create a new bucket" button
-- 4. Bucket name: files
-- 5. Public: OFF (keep it private)
-- 6. Click "Create bucket"

-- ============================================
-- STEP 2: Disable RLS (Row Level Security)
-- ============================================
-- 1. Still in Storage > files bucket
-- 2. Click "Policies" tab
-- 3. You'll see "Row Level Security is enabled"
-- 4. Toggle it OFF (disable RLS)
-- 5. Confirm the action

-- That's it! No SQL queries needed.
-- Security is enforced at the API level using our custom auth middleware
-- Only authenticated users with valid Privy IDs can upload/download files

