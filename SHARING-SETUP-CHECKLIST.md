# File Sharing Setup Checklist

Use this checklist to ensure the file sharing feature is properly set up and working.

## ✅ Database Setup

### Step 1: Run Migration

- [ ] Open Supabase SQL Editor
- [ ] Copy contents of `add-share-tokens-table.sql`
- [ ] Paste and run in SQL Editor
- [ ] Verify no errors

### Step 2: Verify Table Creation

Run this query:
```sql
SELECT * FROM share_tokens LIMIT 1;
```

- [ ] Query runs without errors
- [ ] Table exists (may be empty, that's OK)

### Step 3: Check Indexes

Run this query:
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'share_tokens';
```

- [ ] `idx_share_tokens_token` index exists
- [ ] `idx_share_tokens_file_id` index exists

---

## ✅ Application Setup

### Step 1: Restart Development Server

- [ ] Stop your development server (Ctrl+C)
- [ ] Run `npm run dev` again
- [ ] Server starts without errors
- [ ] No TypeScript compilation errors

### Step 2: Check File Structure

Verify these files exist:

- [ ] `src/app/api/shared/[token]/route.ts`
- [ ] `src/app/shared/[token]/page.tsx`
- [ ] `add-share-tokens-table.sql`
- [ ] `FILE-SHARING-GUIDE.md`
- [ ] `SHARING-IMPLEMENTATION-SUMMARY.md`

---

## ✅ Functional Testing

### Test 1: Generate Share Link

- [ ] Login to the application
- [ ] Upload a test file (if needed)
- [ ] Click "Share" button on any file
- [ ] ShareModal opens successfully
- [ ] Select "Share Link" method
- [ ] Choose "Can View Only" permission
- [ ] Click "Generate Share Link"
- [ ] Share link is generated and displayed
- [ ] No errors in browser console
- [ ] Copy the share link

### Test 2: Access Share Link (Same User)

- [ ] While still logged in, paste the share link in a new tab
- [ ] Page loads successfully
- [ ] File information is displayed correctly
- [ ] Success message appears
- [ ] "Download File" button is visible
- [ ] "Go to Shared Files" button is visible

### Test 3: Access Share Link (Different User)

- [ ] Open an incognito/private browser window
- [ ] Navigate to your app
- [ ] Login as a **different** user
- [ ] Paste the share link in address bar
- [ ] Page loads successfully
- [ ] File information is displayed
- [ ] Success message appears: "Access granted! You can now view this file from your Shared Files page."
- [ ] No errors in browser console

### Test 4: Verify Shared Files Page

While logged in as the recipient user:

- [ ] Go to Dashboard
- [ ] Click "Shared Files" tab in sidebar
- [ ] The shared file appears in the list
- [ ] File shows correct name and size
- [ ] Shows "Shared" badge or indicator

### Test 5: Download Shared File

- [ ] Click on the shared file or "Download" button
- [ ] File downloads successfully
- [ ] Downloaded file can be opened
- [ ] Content is correct and not corrupted

### Test 6: QR Code Generation

- [ ] Click "Share" on a file
- [ ] Select "QR Code" method
- [ ] Choose any permission level
- [ ] Click "Generate Share Link"
- [ ] QR code image is displayed
- [ ] Click "Download QR Code"
- [ ] QR code PNG file is downloaded
- [ ] Open downloaded PNG - QR code is visible

---

## ✅ Database Verification

### Check Share Tokens

Run this query:
```sql
SELECT
  id,
  LEFT(token, 20) || '...' as token_preview,
  file_id,
  created_by,
  permission_level,
  is_active,
  access_count,
  created_at
FROM share_tokens
ORDER BY created_at DESC
LIMIT 5;
```

- [ ] Your generated share tokens appear
- [ ] `is_active` is `true`
- [ ] `access_count` increased after accessing
- [ ] `permission_level` is correct

### Check File Permissions

Run this query:
```sql
SELECT
  fp.id,
  f.name as file_name,
  u.name as recipient_name,
  fp.permission_type,
  fp.is_active,
  fp.granted_at
FROM file_permissions fp
JOIN files f ON f.id = fp.file_id
JOIN users u ON u.id = fp.user_id
WHERE fp.granted_at > NOW() - INTERVAL '1 hour'
ORDER BY fp.granted_at DESC;
```

- [ ] New permission was created when you accessed the share link
- [ ] `permission_type` matches the share link permission level
- [ ] `is_active` is `true`
- [ ] Correct recipient user ID

### Check Access Logs

Run this query:
```sql
SELECT
  al.action,
  f.name as file_name,
  u.name as user_name,
  al.timestamp,
  al.ip_address
FROM access_logs al
JOIN files f ON f.id = al.file_id
JOIN users u ON u.id = al.user_id
WHERE al.action IN ('share', 'view', 'download')
ORDER BY al.timestamp DESC
LIMIT 10;
```

- [ ] 'share' action logged when link was generated
- [ ] 'view' action logged when link was accessed
- [ ] 'download' action logged when file was downloaded (if you downloaded)
- [ ] Correct user IDs
- [ ] Timestamps are recent

---

## ✅ API Endpoint Testing

### Test Share API

Using your browser console or API client:

```javascript
// In browser console (while logged in)
const response = await fetch('/api/files/share', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-privy-user-id': 'your-privy-user-id' // Get from user context
  },
  body: JSON.stringify({
    fileId: 'your-file-uuid',
    permission: 'view'
  })
});
const data = await response.json();
console.log(data);
```

Expected response:
- [ ] `success: true`
- [ ] `shareToken` is a 64-character string
- [ ] `shareUrl` is a full URL
- [ ] `permission` matches what you sent

### Test Shared Access API

```javascript
// Replace TOKEN with actual token from above
const response = await fetch('/api/shared/TOKEN', {
  method: 'GET',
  headers: {
    'x-privy-user-id': 'your-privy-user-id'
  }
});
const data = await response.json();
console.log(data);
```

Expected response:
- [ ] `success: true`
- [ ] `file` object with id, name, size, type, owner
- [ ] `permission_level` is correct
- [ ] `message` says "File access granted successfully"

---

## ✅ Error Handling Testing

### Test Invalid Token

- [ ] Visit `/shared/invalid-token-here`
- [ ] Shows "Access Denied" message
- [ ] Error message: "Invalid or expired share link"
- [ ] "Go to Dashboard" button works

### Test Without Authentication

- [ ] Logout from the app
- [ ] Try to access a share link
- [ ] Redirects to Privy login
- [ ] After login, continues to shared file page

### Test Expired/Inactive Token

Run in database:
```sql
-- Get a token ID
SELECT id FROM share_tokens LIMIT 1;

-- Deactivate it
UPDATE share_tokens SET is_active = FALSE WHERE id = 'token-id-here';
```

- [ ] Try to access the deactivated share link
- [ ] Shows error: "Invalid or expired share link"
- [ ] Doesn't grant permission

---

## ✅ Security Testing

### Test File Ownership

- [ ] Try to share a file you don't own (via API)
- [ ] Should return error: "You do not have permission to share this file"

### Test Token Security

- [ ] Generated tokens are 64 characters long
- [ ] Tokens are random and unique
- [ ] Cannot guess other tokens

### Test Authentication

- [ ] Cannot access `/api/shared/[token]` without login
- [ ] Returns 401 Unauthorized if not authenticated

---

## ✅ UI/UX Testing

### ShareModal

- [ ] Opens smoothly
- [ ] Both "Share Link" and "QR Code" tabs work
- [ ] Permission level buttons are selectable
- [ ] Visual feedback when permission is selected
- [ ] "Generate Share Link" button shows loading state
- [ ] Copy button shows "Copied" confirmation
- [ ] QR code displays properly
- [ ] Modal can be closed with X button
- [ ] Modal can be closed with Cancel button

### Shared File Page

- [ ] Page loads quickly
- [ ] File icon matches file type
- [ ] File information is displayed clearly
- [ ] Success message is prominent
- [ ] Download button is visible
- [ ] "Go to Shared Files" button works
- [ ] Navigation back to dashboard works
- [ ] Responsive on mobile

### Dashboard - Shared Files Tab

- [ ] Tab is accessible from sidebar
- [ ] Shared files are displayed
- [ ] Shows file owner information
- [ ] Download works from this page
- [ ] Empty state shows when no shared files

---

## ✅ Browser Console Checks

### No Errors

- [ ] No red errors in console
- [ ] No TypeScript errors
- [ ] No network errors (except expected 401s when logged out)

### Expected Console Logs

You might see these (they're OK):
- API request logs
- Privy authentication logs
- React warnings (if any, should be minimal)

---

## ✅ Production Readiness

### Documentation

- [ ] Read `FILE-SHARING-GUIDE.md`
- [ ] Read `SHARING-IMPLEMENTATION-SUMMARY.md`
- [ ] Understand the API endpoints
- [ ] Know how to troubleshoot issues

### Environment Variables

- [ ] Supabase URL is set
- [ ] Supabase anon key is set
- [ ] Privy app ID is set
- [ ] All environment variables are in `.env.local`

### Database

- [ ] Migration has been run
- [ ] Tables exist
- [ ] Indexes are created
- [ ] No orphaned records

### Code Quality

- [ ] No TypeScript errors
- [ ] No ESLint warnings (or minimal)
- [ ] Code is properly formatted
- [ ] No console.log() debugging statements in production

---

## ✅ Optional Advanced Features

If you want to enable these features:

### Expiring Links

- [ ] Modify share endpoint to set `expires_at`
- [ ] Test that expired links return error
- [ ] Update UI to show expiry date

### Access Limits

- [ ] Modify share endpoint to set `max_access_count`
- [ ] Test that limit is enforced
- [ ] Show access count in UI

### Share Management

- [ ] Create page to view all share links
- [ ] Add ability to revoke links
- [ ] Show access statistics

---

## 🎉 Completion

Once all items are checked:

- [ ] All database queries work ✅
- [ ] All functional tests pass ✅
- [ ] All API endpoints work ✅
- [ ] No errors in console ✅
- [ ] Documentation is clear ✅

**Your file sharing feature is ready to use!**

---

## 📝 Notes

Use this space to note any issues or customizations:

```
Date: _____________

Issues found:


Customizations made:


Additional testing needed:
```

---

## 🆘 If Something Doesn't Work

1. **Check database connection**
   - Verify Supabase credentials
   - Test connection in Supabase dashboard

2. **Check authentication**
   - Verify Privy is working
   - Check user is logged in
   - Verify user ID is being passed

3. **Check browser console**
   - Look for red errors
   - Check network tab for failed requests
   - Verify API responses

4. **Check database**
   - Run SQL queries to verify data
   - Check table exists
   - Verify permissions

5. **Restart everything**
   - Stop dev server
   - Clear browser cache
   - Restart dev server
   - Hard refresh browser (Ctrl+Shift+R)

6. **Review documentation**
   - `FILE-SHARING-GUIDE.md` - Complete guide
   - Troubleshooting section
   - API reference

---

## 📧 Need Help?

- Review the error message carefully
- Check the troubleshooting section in `FILE-SHARING-GUIDE.md`
- Verify all migration steps were completed
- Check that all new files exist

Good luck! 🚀
