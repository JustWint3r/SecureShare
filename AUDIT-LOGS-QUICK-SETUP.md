# Audit Logs Quick Setup Guide

## Problem

You're seeing "Failed to fetch audit logs" because the database hasn't been updated with the new audit log columns.

## Quick Fix (3 Steps)

### Step 1: Run Database Migration

**Open Supabase SQL Editor** and run this:

```sql
-- Add new columns to access_logs table
ALTER TABLE access_logs
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update action types
ALTER TABLE access_logs DROP CONSTRAINT IF EXISTS access_logs_action_check;
ALTER TABLE access_logs ADD CONSTRAINT access_logs_action_check
CHECK (action IN (
    'upload', 'download', 'view', 'share', 'revoke', 'delete',
    'update', 'rename', 'permission_granted', 'permission_revoked',
    'access_via_link'
));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_shared_with ON access_logs(shared_with_user_id);
```

### Step 2: Verify Migration

Run this to check if it worked:

```sql
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'access_logs'
ORDER BY ordinal_position;
```

You should see `metadata` and `shared_with_user_id` columns.

### Step 3: Test by Uploading a File

1. Go to your app
2. Upload a new file
3. Go to "Audit Logs" page
4. You should see the upload entry!

## Detailed Diagnosis

If you still have issues, run this diagnostic script in Supabase SQL Editor:

**Copy and run:** [check-audit-logs-setup.sql](check-audit-logs-setup.sql)

This will show you:
- Whether the table exists
- If columns are present
- Current log count
- Recent activity

## Common Issues

### Issue 1: "Failed to fetch audit logs"

**Cause**: Database columns don't exist yet

**Fix**: Run Step 1 migration above

### Issue 2: "No audit logs found" (but no error)

**Cause**: Logs exist but you don't have permission to see them

**Explanation**:
- Students can only see logs for files they own or have access to
- Try uploading a new file and check again

### Issue 3: Constraint violation error

**Error**: `violates check constraint "access_logs_action_check"`

**Cause**: Old action types in constraint

**Fix**: Run Step 1 migration to update allowed actions

## What Should Work After Migration

✅ **Upload a file** → Creates "upload" log entry
✅ **Download a file** → Creates "download" log entry
✅ **Share a file** → Creates "share" log entry
✅ **Access via share link** → Creates "permission_granted" and "access_via_link" entries
✅ **View audit logs page** → Shows all your file activity
✅ **Click "View Audit Log" on a file** → Shows that file's history

## Quick Test Script

After migration, test with this:

```sql
-- Insert a test log (replace UUIDs with real ones from your database)
INSERT INTO access_logs (file_id, user_id, action)
SELECT
    f.id,
    u.id,
    'view'
FROM files f
CROSS JOIN users u
LIMIT 1;

-- Check if it worked
SELECT * FROM access_logs ORDER BY timestamp DESC LIMIT 1;
```

## Files Updated

The following files now have proper audit logging:

1. **[src/app/api/files/upload/route.ts](src/app/api/files/upload/route.ts)**
   - Logs every upload with IP and user agent

2. **[src/app/api/shared/[token]/route.ts](src/app/api/shared/[token]/route.ts)**
   - Logs permission grants
   - Logs access via share links
   - Tracks who shared with whom

3. **[src/app/api/files/share/route.ts](src/app/api/files/share/route.ts)**
   - Already had share logging

## Next Steps

After running the migration:

1. **Clear browser cache**: `localStorage.clear(); sessionStorage.clear();` in console
2. **Restart dev server**: `npm run dev`
3. **Upload a test file**
4. **Check "Audit Logs" page**
5. **Share the file with another account**
6. **Check logs again** - should see share entries

## Still Not Working?

1. Check browser console for errors
2. Check server logs where you ran `npm run dev`
3. Run the diagnostic script: [check-audit-logs-setup.sql](check-audit-logs-setup.sql)
4. Verify Supabase credentials in `.env.local`

## Summary

The audit log feature is fully implemented but needs the database migration to work. Just run the SQL in Step 1 above in your Supabase SQL Editor and it should start working immediately!
