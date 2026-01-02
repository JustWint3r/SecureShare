-- ========================================
-- Setup Supabase Storage for Inquiry Attachments
-- ========================================

-- 1. Create storage bucket for inquiry attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inquiry-attachments',
  'inquiry-attachments',
  false, -- private bucket, requires authentication
  52428800, -- 50MB max file size
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for inquiry-attachments bucket

-- Policy: Users can upload their own inquiry attachments
CREATE POLICY "Users can upload inquiry attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inquiry-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own inquiry attachments
CREATE POLICY "Users can view their own inquiry attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inquiry-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Administrators can view all inquiry attachments
CREATE POLICY "Administrators can view all inquiry attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inquiry-attachments' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role = 'administrator'
  )
);

-- Policy: Administrators can delete inquiry attachments
CREATE POLICY "Administrators can delete inquiry attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'inquiry-attachments' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role = 'administrator'
  )
);

-- 3. Update admin_inquiries table schema
-- Change attachments column from TEXT[] to JSONB to store file metadata
ALTER TABLE admin_inquiries
ALTER COLUMN attachments TYPE JSONB USING
  CASE
    WHEN attachments IS NULL THEN NULL
    ELSE to_jsonb(attachments)
  END;

-- Add comment explaining the new structure
COMMENT ON COLUMN admin_inquiries.attachments IS
'JSONB array of attachment objects with structure: [{
  "fileName": "original_file_name.jpg",
  "storagePath": "user_id/inquiry_id/unique_file_name.jpg",
  "fileSize": 12345,
  "mimeType": "image/jpeg",
  "uploadedAt": "2025-01-15T10:30:00Z"
}]';

-- ========================================
-- Verification
-- ========================================

-- Check bucket was created
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'inquiry-attachments';

-- Check storage policies
SELECT policyname, tablename, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%inquiry%';
