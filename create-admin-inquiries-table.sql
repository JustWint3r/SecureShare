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

-- Add comment to table
COMMENT ON TABLE admin_inquiries IS 'Stores inquiries and contact requests sent by students and lecturers to administrators';
