# File Sharing Feature Guide

## Overview

The file sharing feature allows users to securely share files with other users through shareable links or QR codes. When a user accesses a shared link, they automatically receive permission to view the file, and it appears in their "Shared Files" section.

## Features

### 1. Share Methods
- **Share Link**: Generate a unique URL that can be copied and shared
- **QR Code**: Generate a scannable QR code for easy mobile access

### 2. Permission Levels
- **Can View Only**: Recipients can only view and download the file
- **Can View + Comment**: Recipients can view and add comments (read permission)
- **Full Access**: Recipients can view, edit, and potentially reshare (write permission)

### 3. Security Features
- All share links use secure 64-character random tokens
- Access is automatically logged for audit purposes
- Files remain encrypted in storage
- Optional expiry dates for share links (configurable)
- Optional maximum access count limits (configurable)

## Database Schema

### share_tokens Table

```sql
CREATE TABLE share_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,                    -- 64-char hex token
  file_id UUID REFERENCES files(id),             -- The shared file
  created_by UUID REFERENCES users(id),          -- User who created the link
  permission_level TEXT NOT NULL,                -- 'view', 'comment', or 'full'
  expires_at TIMESTAMP WITH TIME ZONE,           -- Optional expiration
  is_active BOOLEAN DEFAULT TRUE,                -- Can be deactivated
  created_at TIMESTAMP WITH TIME ZONE,           -- When created
  access_count INTEGER DEFAULT 0,                -- How many times accessed
  max_access_count INTEGER                       -- Optional access limit
);
```

## Setup Instructions

### 1. Database Migration

If you already have an existing database, run the migration:

```bash
# In Supabase SQL Editor, run:
psql -f add-share-tokens-table.sql
```

Or directly in Supabase SQL Editor:

```sql
-- Copy and paste the contents of add-share-tokens-table.sql
```

### 2. Verify Installation

After running the migration, verify the table exists:

```sql
SELECT * FROM share_tokens LIMIT 1;
```

## How It Works

### User Journey

#### Sharing a File

1. User clicks "Share" button on their file
2. ShareModal opens with options:
   - Choose share method (Link or QR Code)
   - Select permission level (View, Comment, or Full)
3. User clicks "Generate Share Link"
4. System:
   - Creates a unique 64-character token
   - Saves to `share_tokens` table
   - Returns shareable URL
   - Optionally generates QR code
5. User copies link or downloads QR code
6. User shares with recipient

#### Accessing a Shared File

1. Recipient receives share link (e.g., `https://yourapp.com/shared/abc123...`)
2. Recipient clicks link
3. If not logged in:
   - Redirected to Privy login
   - After login, continues to shared file
4. If logged in:
   - System validates share token
   - Checks if token is active and not expired
   - Checks if access limit not reached
5. System automatically:
   - Grants appropriate permission in `file_permissions` table
   - Logs access in `access_logs` table
   - Increments `access_count` in `share_tokens`
6. User sees file details and success message
7. File now appears in recipient's "Shared Files" page
8. Recipient can download the file

### API Flow

```
User Action          → API Endpoint                   → Database Changes
─────────────────────────────────────────────────────────────────────────
Generate Share Link → POST /api/files/share          → INSERT share_tokens
                                                      → INSERT access_logs

Access Share Link   → GET /api/shared/[token]        → SELECT share_tokens
                                                      → SELECT files
                                                      → INSERT file_permissions
                                                      → INSERT access_logs
                                                      → UPDATE share_tokens
                                                         (access_count++)

View Shared Files   → GET /api/files?type=accessible → SELECT files
                                                         JOIN file_permissions

Download File       → GET /api/files/[id]/download   → SELECT files
                                                      → SELECT file_permissions
                                                      → Decrypt from storage
                                                      → INSERT access_logs
```

## API Endpoints

### POST /api/files/share

Generate a share link for a file.

**Request:**
```json
{
  "fileId": "uuid",
  "permission": "view" | "comment" | "full"
}
```

**Response:**
```json
{
  "success": true,
  "shareToken": "64-char-hex-token",
  "shareUrl": "https://yourapp.com/shared/64-char-hex-token",
  "permission": "view",
  "message": "Share link generated successfully"
}
```

### GET /api/shared/[token]

Access a shared file and grant permission.

**Response (Success):**
```json
{
  "success": true,
  "file": {
    "id": "uuid",
    "name": "document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "created_at": "2024-01-01T00:00:00Z",
    "owner": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "permission_level": "view",
  "message": "File access granted successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid or expired share link"
}
```

Possible error messages:
- `"Invalid or expired share link"` - Token not found or inactive
- `"Share link has expired"` - Token past expiration date
- `"Share link access limit reached"` - Max access count exceeded
- `"File not found"` - Referenced file doesn't exist
- `"Authentication required"` - User not logged in

## Component Structure

### Pages

1. **[/shared/[token]/page.tsx](src/app/shared/[token]/page.tsx)**
   - Handles shared file access
   - Shows file information
   - Provides download option
   - Displays success message
   - Redirects to dashboard

### Components

1. **[ShareModal.tsx](src/components/ShareModal.tsx)**
   - Share method selection (Link/QR)
   - Permission level selection
   - Link generation
   - QR code generation
   - Copy to clipboard functionality

2. **[Dashboard.tsx](src/components/Dashboard.tsx)**
   - Has "Shared Files" tab
   - Displays files shared with user
   - Fetches via `/api/files?type=accessible`

## Permission Mapping

| Permission Level | Database Permission | Capabilities                          |
|------------------|---------------------|---------------------------------------|
| `view`           | `READ`              | View and download file only           |
| `comment`        | `READ`              | View, download, and add comments      |
| `full`           | `WRITE`             | View, download, edit, and reshare     |

## Access Logging

Every share-related action is logged in the `access_logs` table:

- **Share action**: When a share link is generated
- **View action**: When someone accesses a shared link
- **Download action**: When someone downloads a shared file

Example log entry:
```json
{
  "file_id": "uuid",
  "user_id": "uuid",
  "action": "view",
  "timestamp": "2024-01-01T00:00:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "transaction_hash": null
}
```

## Security Considerations

### Token Generation
- Uses `crypto.randomBytes(32).toString('hex')` for 64-character tokens
- Cryptographically secure random generation
- Extremely low collision probability (2^256 possible tokens)

### Access Control
- Share tokens don't bypass authentication
- Users must be logged in to access shared files
- Permissions are properly checked at database level
- File ownership is validated before sharing

### Data Privacy
- Files remain encrypted in storage
- Decryption only happens during download
- Share tokens don't expose file content
- Access is tracked and auditable

## Advanced Features (Optional)

### Expiring Links

To create a share link that expires after 7 days:

```typescript
// In /api/files/share endpoint, modify:
const { error: shareError } = await supabaseAdmin
  .from('share_tokens')
  .insert({
    token: shareToken,
    file_id: fileId,
    created_by: user.id,
    permission_level: permission,
    is_active: true,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
```

### Limited Access Links

To create a share link that can only be accessed 10 times:

```typescript
// In /api/files/share endpoint, modify:
const { error: shareError } = await supabaseAdmin
  .from('share_tokens')
  .insert({
    token: shareToken,
    file_id: fileId,
    created_by: user.id,
    permission_level: permission,
    is_active: true,
    max_access_count: 10,
  });
```

### Revoking Share Links

To manually revoke a share link:

```sql
UPDATE share_tokens
SET is_active = FALSE
WHERE token = 'your-token-here';
```

Or create an API endpoint:

```typescript
// POST /api/files/share/revoke
export async function POST(request: NextRequest) {
  const { token } = await request.json();

  await supabaseAdmin
    .from('share_tokens')
    .update({ is_active: false })
    .eq('token', token);

  return NextResponse.json({ success: true });
}
```

## Testing the Feature

### Manual Testing Steps

1. **Test Share Link Generation**
   ```
   - Login as User A
   - Upload a file
   - Click "Share" button
   - Select "Share Link"
   - Choose "Can View Only"
   - Click "Generate Share Link"
   - Verify link is generated
   - Copy link
   ```

2. **Test Share Link Access**
   ```
   - Logout from User A
   - Login as User B
   - Paste the share link in browser
   - Verify file information is displayed
   - Check "Shared Files" tab in dashboard
   - Verify file appears there
   - Download the file
   - Verify download works
   ```

3. **Test QR Code**
   ```
   - Login as User A
   - Click "Share" on a file
   - Select "QR Code"
   - Generate QR code
   - Download QR code
   - Scan with mobile device
   - Verify it opens the correct link
   ```

4. **Test Permission Levels**
   ```
   - Share with "Can View Only" - verify user can only download
   - Share with "Full Access" - verify user gets write permission
   ```

### Database Verification

Check share tokens:
```sql
SELECT * FROM share_tokens ORDER BY created_at DESC LIMIT 10;
```

Check granted permissions:
```sql
SELECT
  fp.*,
  f.name as file_name,
  u.name as user_name
FROM file_permissions fp
JOIN files f ON f.id = fp.file_id
JOIN users u ON u.id = fp.user_id
WHERE fp.granted_by IN (SELECT created_by FROM share_tokens)
ORDER BY fp.granted_at DESC
LIMIT 10;
```

Check access logs:
```sql
SELECT
  al.*,
  f.name as file_name,
  u.name as user_name
FROM access_logs al
JOIN files f ON f.id = al.file_id
JOIN users u ON u.id = al.user_id
WHERE al.action IN ('share', 'view')
ORDER BY al.timestamp DESC
LIMIT 10;
```

## Troubleshooting

### Issue: "Invalid or expired share link"

**Causes:**
- Token doesn't exist in database
- Token `is_active` is FALSE
- Token has expired (`expires_at` < now)

**Solution:**
```sql
-- Check token status
SELECT * FROM share_tokens WHERE token = 'your-token';

-- Reactivate if needed
UPDATE share_tokens SET is_active = TRUE WHERE token = 'your-token';
```

### Issue: "Share link access limit reached"

**Cause:**
- `access_count` >= `max_access_count`

**Solution:**
```sql
-- Remove access limit
UPDATE share_tokens
SET max_access_count = NULL
WHERE token = 'your-token';

-- Or increase limit
UPDATE share_tokens
SET max_access_count = max_access_count + 10
WHERE token = 'your-token';
```

### Issue: File doesn't appear in "Shared Files"

**Causes:**
- Permission wasn't created
- Permission `is_active` is FALSE

**Solution:**
```sql
-- Check permissions
SELECT * FROM file_permissions
WHERE user_id = 'user-uuid'
AND file_id = 'file-uuid';

-- Reactivate if needed
UPDATE file_permissions
SET is_active = TRUE
WHERE user_id = 'user-uuid' AND file_id = 'file-uuid';
```

### Issue: Authentication errors in API

**Cause:**
- Privy user ID not being passed correctly

**Solution:**
- Check browser console for errors
- Verify `x-privy-user-id` header is being sent
- Check Privy authentication is working

## Future Enhancements

Potential features to add:

1. **Email Sharing**
   - Send share links via email directly from the app
   - Email notifications when files are shared

2. **Share Analytics**
   - Dashboard showing who accessed shared files
   - When files were accessed
   - Download statistics

3. **Password-Protected Links**
   - Add optional password field to share_tokens
   - Require password to access file

4. **Share Templates**
   - Save common share settings as templates
   - Quick share with predefined settings

5. **Bulk Sharing**
   - Share multiple files at once
   - Create a shared folder link

6. **Share Management Page**
   - View all active share links
   - Revoke links
   - Update permissions
   - Set expiry dates

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the database logs
- Check browser console for errors
- Verify all migrations have been run

## Files Changed

New files created:
- `src/app/api/shared/[token]/route.ts` - Shared file access API
- `src/app/shared/[token]/page.tsx` - Shared file view page
- `add-share-tokens-table.sql` - Database migration
- `FILE-SHARING-GUIDE.md` - This documentation

Modified files:
- `src/app/api/files/share/route.ts` - Updated to save tokens in database
- `src/components/ShareModal.tsx` - Updated to use new API response
- `src/types/index.ts` - Added ShareToken interface
- `src/lib/utils.ts` - Added getFileIconComponent function
- `database-setup.sql` - Added share_tokens table

## License

This feature is part of the SecureShare FYP project.
