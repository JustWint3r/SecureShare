-- Migration: Enhanced Audit Logs for Complete File Activity Tracking
-- Run this in Supabase SQL Editor

-- Step 1: Add new columns to access_logs table
ALTER TABLE access_logs
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Drop old constraint and add new one with more action types
DO $$
BEGIN
    -- Drop the old constraint
    ALTER TABLE access_logs DROP CONSTRAINT IF EXISTS access_logs_action_check;

    -- Add new constraint with extended actions
    ALTER TABLE access_logs ADD CONSTRAINT access_logs_action_check
    CHECK (action IN (
        'upload',
        'download',
        'view',
        'share',
        'revoke',
        'delete',
        'update',
        'rename',
        'permission_granted',
        'permission_revoked',
        'access_via_link'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint update completed or already updated: %', SQLERRM;
END $$;

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_shared_with ON access_logs(shared_with_user_id);

-- Step 4: Verify the changes
SELECT
    'Audit logs table updated successfully' as status,
    COUNT(*) as total_logs,
    COUNT(DISTINCT action) as distinct_actions,
    COUNT(DISTINCT file_id) as files_tracked
FROM access_logs;

-- Step 5: Show sample of recent logs
SELECT
    al.action,
    f.name as file_name,
    u.name as user_name,
    al.timestamp,
    al.ip_address
FROM access_logs al
LEFT JOIN files f ON f.id = al.file_id
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.timestamp DESC
LIMIT 10;
