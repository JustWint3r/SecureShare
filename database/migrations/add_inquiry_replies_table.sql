-- Create inquiry_replies table for conversation threads
CREATE TABLE IF NOT EXISTS inquiry_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES admin_inquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry_id ON inquiry_replies(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_created_at ON inquiry_replies(created_at ASC);

-- Add comment to table
COMMENT ON TABLE inquiry_replies IS 'Stores conversation replies between users and administrators for inquiries';

-- Enable Row Level Security
ALTER TABLE inquiry_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create replies for their own inquiries
CREATE POLICY "Users can create replies for their own inquiries"
  ON inquiry_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_inquiries
      WHERE admin_inquiries.id = inquiry_id
      AND admin_inquiries.user_id::text = auth.uid()::text
    )
    OR user_id::text = auth.uid()::text
  );

-- Policy: Users can view replies for their own inquiries
CREATE POLICY "Users can view replies for their own inquiries"
  ON inquiry_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_inquiries
      WHERE admin_inquiries.id = inquiry_id
      AND admin_inquiries.user_id::text = auth.uid()::text
    )
    OR user_id::text = auth.uid()::text
  );

-- Policy: Administrators can view all replies
CREATE POLICY "Administrators can view all inquiry replies"
  ON inquiry_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- Policy: Administrators can create replies on any inquiry
CREATE POLICY "Administrators can create replies on any inquiry"
  ON inquiry_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );
