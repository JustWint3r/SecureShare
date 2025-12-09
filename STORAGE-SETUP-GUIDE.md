# 📦 Supabase Storage Setup Guide

## ⚠️ Important: Use the Dashboard UI (Not SQL)

The SQL approach requires superuser permissions. Instead, follow these simple UI steps:

---

## 🔧 Step-by-Step Instructions

### **Step 1: Create the Storage Bucket**

1. Open your **Supabase Dashboard**
2. Click **"Storage"** in the left sidebar
3. Click the **"New bucket"** or **"Create a new bucket"** button
4. Fill in the form:
   - **Name:** `files`
   - **Public bucket:** Toggle **OFF** (keep it private ❌)
   - **Allowed MIME types:** Leave empty (allow all)
   - **File size limit:** Leave default or set to 500 MB
5. Click **"Create bucket"**

✅ You should now see a bucket named **"files"** in the list.

---

### **Step 2: Disable Row Level Security (RLS)**

**Why?** We're using Privy for authentication (not Supabase Auth), so we handle security in our API routes.

1. Click on the **"files"** bucket you just created
2. Click the **"Policies"** tab at the top
3. You'll see: **"Row Level Security is enabled for this bucket"**
4. Find the toggle switch or button to **disable RLS**
5. Confirm when prompted

✅ RLS should now be **OFF** for the bucket.

---

## 🧪 Test the Setup

After completing both steps:

1. **Refresh your app** in the browser
2. **Delete any old test files** (they won't have actual content stored)
3. **Upload a NEW file** (PDF, Word doc, Excel, etc.)
4. **Click Download** on the new file
5. **Verify** - The original file should download and open correctly! 🎉

---

## 🔍 Troubleshooting

### Error: "Failed to store encrypted file"

- **Cause:** Bucket doesn't exist or has wrong name
- **Fix:** Make sure bucket is named exactly `files` (lowercase)

### Error: "Failed to retrieve encrypted file"

- **Cause:** RLS is still enabled
- **Fix:** Go back to Policies tab and disable RLS

### Error: "Row Level Security policy violation"

- **Cause:** RLS policies are blocking access
- **Fix:** Disable ALL policies and turn RLS OFF completely

---

## 🏗️ What This Enables

### Upload Flow:

```
User uploads file.docx
    ↓
API receives file
    ↓
Encrypt with AES-256
    ↓
Store in: storage/files/encrypted-files/{user_id}/{file_id}
    ↓
Save metadata in database
```

### Download Flow:

```
User clicks download
    ↓
API verifies permissions
    ↓
Retrieve encrypted file from storage
    ↓
Decrypt using stored key
    ↓
Send original file.docx to browser
```

---

## 🔒 Security Notes

- ✅ Files are **encrypted at rest** (AES-256)
- ✅ Only file owner can upload/download (enforced in API)
- ✅ Encryption keys stored separately in database
- ✅ All access logged to audit trail
- ✅ No direct storage access (only through authenticated API)

---

## 📝 Summary

**What you need to do:**

1. ✅ Create bucket named `files` (Private)
2. ✅ Disable RLS on the bucket
3. ✅ Upload a new test file
4. ✅ Download it to verify it works!

**That's it!** No SQL queries needed. 🎉
















