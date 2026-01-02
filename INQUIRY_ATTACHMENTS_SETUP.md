# Inquiry Attachments Storage Setup Guide

This guide will help you set up file storage for inquiry attachments using Supabase Storage.

## Step 1: Run the SQL Setup Script

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup-inquiry-attachments-storage.sql`
4. Click "Run" to execute the script

This script will:
- Create a new storage bucket called `inquiry-attachments`
- Set up Row Level Security policies for the bucket
- Update the `admin_inquiries` table schema to use JSONB for attachments

## Step 2: Verify the Setup

After running the script, verify the following:

### Check Storage Bucket
1. Go to Storage in your Supabase Dashboard
2. You should see a bucket named `inquiry-attachments`
3. The bucket should be **private** (not public)
4. File size limit: 50MB
5. Allowed file types: Images, Videos, PDFs, Documents

### Check Policies
1. In the SQL Editor, run:
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%inquiry%';
```

You should see 4 policies:
- `Users can upload inquiry attachments` (INSERT)
- `Users can view their own inquiry attachments` (SELECT)
- `Administrators can view all inquiry attachments` (SELECT)
- `Administrators can delete inquiry attachments` (DELETE)

### Check Database Schema
1. In the SQL Editor, run:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_inquiries'
AND column_name = 'attachments';
```

You should see:
- Column: `attachments`
- Type: `jsonb`

## Step 3: Test the Implementation

### Test File Upload (as Student/Lecturer)
1. Log in as a student or lecturer account
2. Go to "Contact Admin" in the sidebar
3. Fill in the subject and message
4. Attach one or more files (images, videos, or documents)
5. Submit the inquiry
6. You should receive a success message

### Test File Viewing (as Administrator)
1. Log in as an administrator account
2. Go to "Inquiries" in the sidebar
3. Click "View" on an inquiry with attachments
4. You should see the attachments listed with:
   - File icon (Image/Video/Document)
   - File name
   - File size and MIME type
   - View/Download button
5. Click "View" or "Download" on an attachment:
   - **Images**: Opens in a preview modal
   - **Videos**: Opens in a preview modal with playback controls
   - **Other files**: Downloads directly

## File Storage Structure

Files are organized in Supabase Storage as:
```
inquiry-attachments/
  └── {user_id}/
      └── {inquiry_id}/
          └── {timestamp}_{sanitized_filename}
```

Example:
```
inquiry-attachments/
  └── 550e8400-e29b-41d4-a716-446655440000/
      └── 660e8400-e29b-41d4-a716-446655440001/
          └── 1704067200000_screenshot.png
          └── 1704067205000_video_demo.mp4
```

## Attachment Metadata Format

The `attachments` column in `admin_inquiries` table stores JSONB data:

```json
[
  {
    "fileName": "screenshot.png",
    "storagePath": "550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440001/1704067200000_screenshot.png",
    "fileSize": 245678,
    "mimeType": "image/png",
    "uploadedAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "fileName": "video_demo.mp4",
    "storagePath": "550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440001/1704067205000_video_demo.mp4",
    "fileSize": 5242880,
    "mimeType": "video/mp4",
    "uploadedAt": "2025-01-15T10:30:05.000Z"
  }
]
```

## Security Features

### Upload Security
- Only authenticated users can upload files
- Users can only upload to their own folder (user_id)
- Maximum file size: 50MB per file
- Allowed MIME types are restricted

### Access Security
- Files are stored in a **private bucket** (not publicly accessible)
- Signed URLs are generated with 1-hour expiration
- Users can only access their own inquiry attachments
- Administrators can access all inquiry attachments
- All access is logged in `access_logs` table

## Troubleshooting

### Error: "Bucket already exists"
If you see this error, the bucket was already created. You can skip the bucket creation part and only run the policies section.

### Error: "Policy already exists"
If policies already exist, you can skip creating them or drop existing ones first:
```sql
DROP POLICY IF EXISTS "Users can upload inquiry attachments" ON storage.objects;
-- Repeat for other policies
```

### Error: "Failed to upload file"
Check:
1. File size is under 50MB
2. File type is in the allowed list
3. User is authenticated
4. Storage bucket exists and is accessible

### Files not appearing
1. Check browser console for errors
2. Verify the inquiry has `attachments` data in the database
3. Check that signed URLs are being generated correctly
4. Verify RLS policies are enabled on the storage bucket

## API Endpoints

### Upload Files (Student/Lecturer)
- **Endpoint**: `POST /api/contact-admin`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `subject`: string
  - `message`: string
  - `file_0`, `file_1`, etc.: File objects

### Get Attachment URL (Administrator)
- **Endpoint**: `GET /api/admin/inquiries/attachments`
- **Query Parameters**:
  - `path`: Storage path of the file
- **Response**:
  ```json
  {
    "success": true,
    "signedUrl": "https://..."
  }
  ```

## File Size Limits

Current limits:
- **Per file**: 50MB
- **Total per inquiry**: No limit (but consider UX)
- **Recommended**: Keep total attachments under 100MB

To change the limit, update the SQL script:
```sql
file_size_limit, -- Change 52428800 (50MB) to desired value in bytes
```

## Supported File Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)

### Videos
- MP4 (.mp4)
- WebM (.webm)
- Ogg (.ogg)
- QuickTime (.mov)

### Documents
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)

To add more file types, update the `allowed_mime_types` array in the SQL script.
