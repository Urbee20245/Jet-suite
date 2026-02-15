-- Create admin_inbox table for storing incoming support emails
CREATE TABLE IF NOT EXISTS admin_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_inbox_received_at ON admin_inbox(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_inbox_read ON admin_inbox(read);

-- Enable Row Level Security
ALTER TABLE admin_inbox ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (for admin operations)
CREATE POLICY "Service role can manage admin_inbox" ON admin_inbox
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comment
COMMENT ON TABLE admin_inbox IS 'Stores incoming emails sent to support@getjetsuite.com for admin review';
