-- Create admin_inquiries table for storing contact requests from students and lecturers
CREATE TABLE IF NOT EXISTS admin_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'closed')),
  admin_response TEXT,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_inquiries_user_id ON admin_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_inquiries_status ON admin_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_admin_inquiries_created_at ON admin_inquiries(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own inquiries
CREATE POLICY "Users can create their own inquiries"
  ON admin_inquiries
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can view their own inquiries
CREATE POLICY "Users can view their own inquiries"
  ON admin_inquiries
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Policy: Administrators can view all inquiries
CREATE POLICY "Administrators can view all inquiries"
  ON admin_inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- Policy: Administrators can update all inquiries
CREATE POLICY "Administrators can update inquiries"
  ON admin_inquiries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- Policy: Administrators can delete inquiries
CREATE POLICY "Administrators can delete inquiries"
  ON admin_inquiries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'administrator'
    )
  );

-- Add comment to table
COMMENT ON TABLE admin_inquiries IS 'Stores inquiries and contact requests sent by students and lecturers to administrators';
