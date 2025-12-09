-- Check Audit Logs Setup and Troubleshooting Script
-- Run this in Supabase SQL Editor to diagnose issues

-- ==================================================
-- STEP 1: Check if access_logs table exists
-- ==================================================
SELECT
    'access_logs table exists' as status,
    COUNT(*) as row_count
FROM access_logs;

-- ==================================================
-- STEP 2: Check table structure
-- ==================================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'access_logs'
ORDER BY ordinal_position;

-- ==================================================
-- STEP 3: Check if new columns exist
-- ==================================================
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'access_logs'
            AND column_name = 'metadata'
        ) THEN 'YES'
        ELSE 'NO - RUN MIGRATION!'
    END as metadata_column_exists,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'access_logs'
            AND column_name = 'shared_with_user_id'
        ) THEN 'YES'
        ELSE 'NO - RUN MIGRATION!'
    END as shared_with_user_id_column_exists;

-- ==================================================
-- STEP 4: Check action constraint
-- ==================================================
SELECT
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'access_logs_action_check';

-- ==================================================
-- STEP 5: View all existing logs
-- ==================================================
SELECT
    al.id,
    al.action,
    f.name as file_name,
    u.name as user_name,
    al.timestamp,
    al.ip_address
FROM access_logs al
LEFT JOIN files f ON f.id = al.file_id
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.timestamp DESC
LIMIT 20;

-- ==================================================
-- STEP 6: Count logs by action type
-- ==================================================
SELECT
    action,
    COUNT(*) as count
FROM access_logs
GROUP BY action
ORDER BY count DESC;

-- ==================================================
-- STEP 7: Check if there are any files
-- ==================================================
SELECT
    'Total files' as info,
    COUNT(*) as count
FROM files;

-- ==================================================
-- STEP 8: Check if there are recent file uploads
-- ==================================================
SELECT
    id,
    name,
    owner_id,
    created_at
FROM files
ORDER BY created_at DESC
LIMIT 5;

-- ==================================================
-- DIAGNOSTIC SUMMARY
-- ==================================================
SELECT
    (SELECT COUNT(*) FROM access_logs) as total_audit_logs,
    (SELECT COUNT(*) FROM files) as total_files,
    (SELECT COUNT(*) FROM share_tokens) as total_share_tokens,
    (SELECT COUNT(DISTINCT file_id) FROM access_logs) as files_with_logs,
    (SELECT COUNT(DISTINCT user_id) FROM access_logs) as users_in_logs;
