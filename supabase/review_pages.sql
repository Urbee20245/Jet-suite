-- ============================================================================
-- JETTRUST REVIEW PAGES SYSTEM
-- Added: January 2026
-- Purpose: Enable public review collection pages and email review requests
-- ============================================================================

-- Create review_pages table for storing public review page settings
CREATE TABLE IF NOT EXISTS review_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,

  -- Page identification
  slug TEXT NOT NULL UNIQUE, -- URL slug: getjetsuite.com/r/{slug}

  -- Business details
  business_name TEXT NOT NULL,
  logo_url TEXT, -- Base64 or URL for logo
  hero_image_url TEXT, -- Base64 or URL for hero image (left side)

  -- Styling
  primary_color TEXT DEFAULT '#F59E0B', -- Primary brand color

  -- Review link
  google_review_url TEXT NOT NULL, -- Google Business review URL

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_review_pages_user_id ON review_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_review_pages_slug ON review_pages(slug);
CREATE INDEX IF NOT EXISTS idx_review_pages_business_id ON review_pages(business_id);

-- Create updated_at trigger for review_pages
CREATE OR REPLACE FUNCTION update_review_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_review_pages_updated_at ON review_pages;
CREATE TRIGGER update_review_pages_updated_at
  BEFORE UPDATE ON review_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_review_pages_updated_at();

-- RLS for review_pages
ALTER TABLE review_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own review pages
CREATE POLICY "Users can view own review pages"
  ON review_pages FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can view active review pages (for public access)
CREATE POLICY "Anyone can view active review pages"
  ON review_pages FOR SELECT
  USING (is_active = TRUE);

-- Policy: Users can insert their own review pages
CREATE POLICY "Users can insert own review pages"
  ON review_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own review pages
CREATE POLICY "Users can update own review pages"
  ON review_pages FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own review pages
CREATE POLICY "Users can delete own review pages"
  ON review_pages FOR DELETE
  USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role has full access to review_pages"
  ON review_pages FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- REVIEW PAGE ANALYTICS
-- ============================================================================

-- Create review_page_clicks table for tracking analytics
CREATE TABLE IF NOT EXISTS review_page_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_page_id UUID NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,
  rating_clicked INTEGER CHECK (rating_clicked >= 1 AND rating_clicked <= 5),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Optional: track referrer/source
  referrer TEXT,
  user_agent TEXT
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_review_page_clicks_page_id ON review_page_clicks(review_page_id);
CREATE INDEX IF NOT EXISTS idx_review_page_clicks_clicked_at ON review_page_clicks(clicked_at);

-- RLS for review_page_clicks
ALTER TABLE review_page_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert clicks (for public tracking)
CREATE POLICY "Anyone can insert review page clicks"
  ON review_page_clicks FOR INSERT
  WITH CHECK (TRUE);

-- Policy: Users can view clicks for their own review pages
CREATE POLICY "Users can view clicks for own review pages"
  ON review_page_clicks FOR SELECT
  USING (
    review_page_id IN (
      SELECT id FROM review_pages WHERE user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role has full access to review_page_clicks"
  ON review_page_clicks FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- REVIEW EMAIL REQUESTS
-- Purpose: Track emails sent for review collection (5 per day limit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_email_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_page_id UUID NOT NULL REFERENCES review_pages(id) ON DELETE CASCADE,

  -- Recipient info
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- Email status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,

  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_email_requests_user_id ON review_email_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_review_email_requests_created_at ON review_email_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_review_email_requests_status ON review_email_requests(status);

-- RLS for review_email_requests
ALTER TABLE review_email_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own email requests
CREATE POLICY "Users can view own review email requests"
  ON review_email_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own email requests
CREATE POLICY "Users can insert own review email requests"
  ON review_email_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role has full access to review_email_requests"
  ON review_email_requests FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTION: Count today's emails for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_today_email_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  email_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO email_count
  FROM review_email_requests
  WHERE user_id = p_user_id
    AND DATE(created_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC');

  RETURN email_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_today_email_count(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE review_pages IS 'Public review collection pages for businesses';
COMMENT ON COLUMN review_pages.slug IS 'URL slug for public access at getjetsuite.com/r/{slug}';
COMMENT ON COLUMN review_pages.logo_url IS 'Business logo - base64 or URL (max 5MB recommended)';
COMMENT ON COLUMN review_pages.hero_image_url IS 'Hero image for left side of page - base64 or URL (max 5MB)';

COMMENT ON TABLE review_page_clicks IS 'Analytics tracking for review page interactions';

COMMENT ON TABLE review_email_requests IS 'Tracks emails sent for review collection (5 per day limit enforced in app)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON review_pages TO authenticated;
GRANT SELECT, INSERT ON review_page_clicks TO authenticated;
GRANT SELECT, INSERT ON review_email_requests TO authenticated;
GRANT ALL ON review_pages TO service_role;
GRANT ALL ON review_page_clicks TO service_role;
GRANT ALL ON review_email_requests TO service_role;
