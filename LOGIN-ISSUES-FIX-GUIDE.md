# Login Issues Fix Guide

## Problem

You're experiencing login credential issues where logging in with one email shows a different account. This is happening because of how Privy authentication works.

## Understanding the Issue

### How Privy Authentication Works

1. **First-time login**: When you log in with an email through Privy, Privy creates a unique `privy_id` for you
2. **Account sync**: Your app syncs the Privy user to your database using `/api/auth/sync-privy-user`
3. **Account linking**: The system tries to match your email to existing accounts, or creates a new one

### Common Issues

- **Multiple Privy sessions**: If you logged in with the same email in different browsers/sessions, Privy might create different IDs
- **Wrong role assignment**: First-time logins default to 'student' role
- **Duplicate accounts**: Same email with different `privy_id` values
- **Cache issues**: Browser cache holding old session data

## Solution Steps

### Step 1: Check Current User Accounts

Run this in Supabase SQL Editor to see all your accounts:

```sql
SELECT
  id,
  email,
  name,
  role,
  privy_id,
  created_at
FROM users
ORDER BY email, created_at;
```

Look for:
- Duplicate emails
- Missing or NULL `privy_id` values
- Incorrect roles

### Step 2: Update User Roles

If users exist but have wrong roles, run this:

```sql
-- Update justwint3r@gmail.com to student
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
```

### Step 3: Clear Privy Cache

**Important**: Clear your Privy authentication cache:

1. **In browser console** (F12), run:
```javascript
localStorage.clear();
sessionStorage.clear();
```

2. **Clear browser cookies** for your app (localhost:3000 or your domain)

3. **Hard refresh**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Step 4: Log Out and Log Back In

1. Log out from your application completely
2. Close the browser tab
3. Open a new incognito/private window
4. Go to your app
5. Log in with the email you want to test

### Step 5: Verify the Login

After logging in, check the database again:

```sql
SELECT
  email,
  name,
  role,
  department,
  privy_id,
  created_at
FROM users
WHERE email = 'your-email@example.com';
```

The `privy_id` should now be populated.

## Nuclear Option: Start Fresh

If the issue persists, you can start completely fresh:

### ⚠️ WARNING: This will delete ALL users and files!

```sql
-- Delete all users and their data
DELETE FROM users;

-- Re-create the accounts (they'll be synced on first login)
INSERT INTO users (email, name, role, department)
VALUES
  ('pheonixnightmare2003@gmail.com', 'Administrator', 'administrator', 'System Administration'),
  ('tp067591@mail.apu.edu.my', 'Dr. Sahun Lim', 'lecturer', 'Computer Science'),
  ('justwint3r@gmail.com', 'Wint3r', 'student', 'Computer Science')
ON CONFLICT (email) DO NOTHING;
```

Then:
1. Clear browser cache and cookies
2. Log in with each email
3. The sync endpoint will link the Privy ID to the existing email

## Understanding Account Creation Flow

### When you log in for the FIRST time:

```
User enters email in Privy
    ↓
Privy authenticates and creates privy_id
    ↓
App calls /api/auth/sync-privy-user
    ↓
System checks: Does user exist with this email?
    ↓
YES → Update existing user with privy_id
NO  → Create new user as 'student' role
    ↓
User is logged in
```

### When you log in AGAIN:

```
User enters email in Privy
    ↓
Privy authenticates (same privy_id as before)
    ↓
App calls /api/auth/sync-privy-user
    ↓
System finds user by privy_id
    ↓
Updates user info if needed
    ↓
User is logged in (keeps existing role)
```

## Common Scenarios and Fixes

### Scenario 1: "I login with justwint3r@gmail.com but see a lecturer account"

**Cause**: Your email is linked to a user with 'lecturer' role in the database

**Fix**:
```sql
UPDATE users
SET role = 'student'
WHERE email = 'justwint3r@gmail.com';
```

### Scenario 2: "I have multiple accounts with the same email"

**Cause**: Database allows NULL emails, so you might have duplicates

**Fix**:
```sql
-- Find duplicates
SELECT email, COUNT(*) FROM users WHERE email = 'your@email.com' GROUP BY email;

-- Keep the one with privy_id, delete others
DELETE FROM users
WHERE email = 'your@email.com' AND privy_id IS NULL;
```

### Scenario 3: "The name/department is wrong"

**Fix**:
```sql
UPDATE users
SET
  name = 'Correct Name',
  department = 'Correct Department'
WHERE email = 'your@email.com';
```

### Scenario 4: "I can't login at all"

**Fixes**:
1. Check Privy is configured correctly in `.env.local`:
   ```
   NEXT_PUBLIC_PRIVY_APP_ID=cmg8y8p4f00r4lb0c7oxv7igg
   ```

2. Check network tab in browser console for errors

3. Verify Supabase connection is working

## Testing Different Roles

To test all three roles:

### 1. Login as Student
- Email: `justwint3r@gmail.com`
- Should see: Student dashboard, can upload/share files
- Role in DB should be: `student`

### 2. Login as Lecturer
- Email: `tp067591@mail.apu.edu.my`
- Should see: Lecturer features (if implemented)
- Role in DB should be: `lecturer`

### 3. Login as Administrator
- Email: `pheonixnightmare2003@gmail.com`
- Should see: Admin features (if implemented)
- Role in DB should be: `administrator`

## Debugging Steps

### 1. Check what email Privy is sending

In browser console after login:

```javascript
// If you have access to the Privy user object
console.log(privyUser.email);
console.log(privyUser.id); // This is the privy_id
```

### 2. Check what's in the database

```sql
-- See all users
SELECT * FROM users ORDER BY created_at DESC;

-- See what the current logged-in email maps to
SELECT * FROM users WHERE email = 'justwint3r@gmail.com';
```

### 3. Check the sync-privy-user API

In browser console while logged in:

```javascript
// Check the sync response
fetch('/api/auth/sync-privy-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privyId: 'your-privy-id',
    email: 'justwint3r@gmail.com'
  })
})
.then(r => r.json())
.then(console.log);
```

## Quick Fix Script

Run this SQL to ensure all accounts are set up correctly:

```sql
-- Step 1: Clear any duplicate or test accounts (CAREFUL!)
DELETE FROM users
WHERE email NOT IN (
  'pheonixnightmare2003@gmail.com',
  'tp067591@mail.apu.edu.my',
  'justwint3r@gmail.com'
);

-- Step 2: Ensure the three main accounts exist with correct roles
INSERT INTO users (email, name, role, department)
VALUES
  ('pheonixnightmare2003@gmail.com', 'Administrator', 'administrator', 'System Administration'),
  ('tp067591@mail.apu.edu.my', 'Dr. Sahun Lim', 'lecturer', 'Computer Science'),
  ('justwint3r@gmail.com', 'Wint3r', 'student', 'Computer Science')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Step 3: Verify
SELECT email, name, role, department FROM users
ORDER BY role DESC;
```

## After Fixing

1. **Clear browser cache**: `Ctrl+Shift+Delete` → Clear all
2. **Restart dev server**: Stop and run `npm run dev` again
3. **Use incognito**: Test in private/incognito window
4. **Check database**: Verify roles are correct after each login

## Still Having Issues?

### Check the logs

1. **Browser console**: Look for errors during login
2. **Server logs**: Check terminal where `npm run dev` is running
3. **Supabase logs**: Check Supabase dashboard → Logs

### Common error messages and fixes

- **"Authentication required"**: Clear cookies and login again
- **"Database error"**: Check Supabase credentials in `.env.local`
- **"Privy ID is required"**: Privy authentication failed, check Privy dashboard
- **"User not found"**: The sync didn't create the user, check database

## Prevention

To avoid this issue in the future:

1. **Always use the same browser/session** for testing
2. **Don't create users manually** in the database if they'll login via Privy
3. **Update roles AFTER first login**, not before
4. **Clear cache** when switching between test accounts

## Contact

If you're still stuck:
1. Run the diagnostic queries in `fix-user-accounts.sql`
2. Check the network tab in browser console
3. Verify all environment variables are correct
4. Make sure Privy app is configured correctly

The issue is almost always one of:
- Wrong role in database
- Cached Privy session
- Duplicate user accounts
- Privy not syncing correctly
