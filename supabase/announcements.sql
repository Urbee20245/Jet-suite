-- Announcements Table
-- Stores admin announcements that display as pop-ups to users

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Announcement content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'update')) DEFAULT 'info',
  
  -- Display settings
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1, -- Higher number = higher priority
  
  -- Targeting
  target_audience TEXT CHECK (target_audience IN ('all', 'founder', 'standard')) DEFAULT 'all',
  
  -- Scheduling
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by TEXT, -- Admin email who created it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Announcement Views Table
-- Tracks which users have seen which announcements
CREATE TABLE IF NOT EXISTS user_announcement_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate views
  UNIQUE(user_id, announcement_id)
);

-- Indexes for performance
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX idx_user_views_user_id ON user_announcement_views(user_id);
CREATE INDEX idx_user_views_announcement_id ON user_announcement_views(announcement_id);

-- Updated trigger
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_views ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone authenticated can read active announcements
CREATE POLICY "Users can view active announcements"
  ON announcements FOR SELECT
  USING (
    is_active = true 
    AND start_date <= NOW() 
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Service role has full access
CREATE POLICY "Service role full access to announcements"
  ON announcements FOR ALL
  USING (auth.role() = 'service_role');

-- Users can record their own views
CREATE POLICY "Users can insert own views"
  ON user_announcement_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own views"
  ON user_announcement_views FOR SELECT
  USING (auth.uid() = user_id);

-- Service role full access to views
CREATE POLICY "Service role full access to views"
  ON user_announcement_views FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON announcements TO authenticated;
GRANT SELECT, INSERT ON user_announcement_views TO authenticated;
GRANT ALL ON announcements, user_announcement_views TO service_role;

-- Comments
COMMENT ON TABLE announcements IS 'Admin-created announcements displayed to users';
COMMENT ON TABLE user_announcement_views IS 'Tracks which users have viewed which announcements';