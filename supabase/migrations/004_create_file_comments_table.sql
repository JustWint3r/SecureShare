-- Create file_comments table for storing comments on shared files
CREATE TABLE IF NOT EXISTS public.file_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_file_comments_file_id ON public.file_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_user_id ON public.file_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_created_at ON public.file_comments(created_at);

-- Enable Row Level Security
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read comments on files they have access to
CREATE POLICY "Users can read comments on accessible files"
ON public.file_comments
FOR SELECT
USING (
    -- User owns the file
    EXISTS (
        SELECT 1 FROM public.files
        WHERE files.id = file_comments.file_id
        AND files.owner_id = auth.uid()
    )
    OR
    -- User has been granted access to the file
    EXISTS (
        SELECT 1 FROM public.file_permissions
        WHERE file_permissions.file_id = file_comments.file_id
        AND file_permissions.user_id = auth.uid()
    )
    OR
    -- User has access via share token
    EXISTS (
        SELECT 1 FROM public.share_tokens
        JOIN public.file_permissions ON file_permissions.file_id = share_tokens.file_id
        WHERE share_tokens.file_id = file_comments.file_id
        AND file_permissions.user_id = auth.uid()
    )
);

-- Policy: Users can create comments on files they have comment/full permission
CREATE POLICY "Users can create comments with permission"
ON public.file_comments
FOR INSERT
WITH CHECK (
    -- User has comment or full permission on the file
    EXISTS (
        SELECT 1 FROM public.file_permissions
        WHERE file_permissions.file_id = file_comments.file_id
        AND file_permissions.user_id = auth.uid()
        AND file_permissions.permission_type IN ('comment', 'full')
    )
    OR
    -- User is the owner of the file
    EXISTS (
        SELECT 1 FROM public.files
        WHERE files.id = file_comments.file_id
        AND files.owner_id = auth.uid()
    )
);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.file_comments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.file_comments
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_comments_updated_at
    BEFORE UPDATE ON public.file_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_file_comments_updated_at();
