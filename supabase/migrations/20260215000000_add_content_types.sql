-- ============================================================================
-- CONTENT TYPE EXTENSION
-- Purpose: Add support for Articles and Press Releases in addition to Blog Posts
-- Created: February 2026
-- ============================================================================

-- Add content_type column to blog_publications table
-- This allows us to distinguish between blog posts, articles, and press releases
ALTER TABLE public.blog_publications
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'blog_post'
CHECK (content_type IN ('blog_post', 'article', 'press_release'));

-- Add article-specific fields
ALTER TABLE public.blog_publications
ADD COLUMN IF NOT EXISTS article_type VARCHAR(50), -- e.g., 'complete_guide', 'industry_analysis', 'case_study'
ADD COLUMN IF NOT EXISTS depth_level VARCHAR(20), -- e.g., 'comprehensive', 'standard'
ADD COLUMN IF NOT EXISTS executive_summary TEXT, -- 200-word overview for articles
ADD COLUMN IF NOT EXISTS key_takeaways JSONB, -- Array of key takeaway points
ADD COLUMN IF NOT EXISTS references JSONB, -- Array of reference objects with title, url, citation
ADD COLUMN IF NOT EXISTS estimated_read_time VARCHAR(20); -- e.g., "15 minutes"

-- Add press release-specific fields
ALTER TABLE public.blog_publications
ADD COLUMN IF NOT EXISTS news_type VARCHAR(50), -- e.g., 'expansion', 'launch', 'award'
ADD COLUMN IF NOT EXISTS dateline VARCHAR(100), -- AP Style dateline: "CITY, State Abbrev. (Date) --"
ADD COLUMN IF NOT EXISTS media_contact JSONB, -- Contact info: {name, email, phone, company}
ADD COLUMN IF NOT EXISTS boilerplate TEXT, -- Standard company description
ADD COLUMN IF NOT EXISTS is_media_ready BOOLEAN DEFAULT FALSE; -- Whether it's ready for media distribution

-- Add index on content_type for performance
CREATE INDEX IF NOT EXISTS idx_blog_publications_content_type
ON public.blog_publications(content_type);

-- Add combined index for filtering by user and content type
CREATE INDEX IF NOT EXISTS idx_blog_publications_user_content_type
ON public.blog_publications(user_id, content_type);

-- Add index for scheduled publishing with content type
CREATE INDEX IF NOT EXISTS idx_blog_publications_scheduled_content_type
ON public.blog_publications(scheduled_publish_at, status, content_type)
WHERE scheduled_publish_at IS NOT NULL;

-- Update table comment
COMMENT ON TABLE public.blog_publications IS 'Stores blog posts, articles, and press releases with scheduling and publishing information';

-- Add column comments
COMMENT ON COLUMN public.blog_publications.content_type IS 'Type of content: blog_post, article, or press_release';
COMMENT ON COLUMN public.blog_publications.article_type IS 'Specific article format (for articles only)';
COMMENT ON COLUMN public.blog_publications.depth_level IS 'Content depth: comprehensive or standard (for articles only)';
COMMENT ON COLUMN public.blog_publications.executive_summary IS '200-word overview (for articles only)';
COMMENT ON COLUMN public.blog_publications.key_takeaways IS 'Array of main takeaway points (for articles only)';
COMMENT ON COLUMN public.blog_publications.references IS 'Array of source citations (for articles only)';
COMMENT ON COLUMN public.blog_publications.estimated_read_time IS 'Estimated reading time (for articles only)';
COMMENT ON COLUMN public.blog_publications.news_type IS 'Type of announcement (for press releases only)';
COMMENT ON COLUMN public.blog_publications.dateline IS 'AP Style dateline (for press releases only)';
COMMENT ON COLUMN public.blog_publications.media_contact IS 'Media contact information (for press releases only)';
COMMENT ON COLUMN public.blog_publications.boilerplate IS 'Standard company description (for press releases only)';
COMMENT ON COLUMN public.blog_publications.is_media_ready IS 'Whether the press release is ready for distribution';

-- ============================================================================
-- CONTENT DRAFTS TABLE (if not already exists)
-- Purpose: Store draft content before publishing
-- ============================================================================

-- Check if content_drafts table exists, and create if needed
CREATE TABLE IF NOT EXISTS public.content_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User and business identification
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,

  -- Content type
  content_type VARCHAR(20) DEFAULT 'blog_post'
  CHECK (content_type IN ('blog_post', 'article', 'press_release')),

  -- Basic content
  title TEXT,
  content TEXT,
  excerpt TEXT,

  -- SEO fields
  slug TEXT,
  featured_image_url TEXT,
  meta_description TEXT,

  -- Common fields
  form_data JSONB, -- Store the complete form data for easy re-editing

  -- Article-specific fields
  article_type VARCHAR(50),
  depth_level VARCHAR(20),
  executive_summary TEXT,
  key_takeaways JSONB,
  references JSONB,

  -- Press release-specific fields
  news_type VARCHAR(50),
  dateline VARCHAR(100),
  media_contact JSONB,
  boilerplate TEXT,

  -- Draft metadata
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for content_drafts
CREATE INDEX IF NOT EXISTS idx_content_drafts_user_id
ON public.content_drafts(user_id);

CREATE INDEX IF NOT EXISTS idx_content_drafts_business_id
ON public.content_drafts(business_id);

CREATE INDEX IF NOT EXISTS idx_content_drafts_content_type
ON public.content_drafts(content_type);

CREATE INDEX IF NOT EXISTS idx_content_drafts_created_at
ON public.content_drafts(created_at DESC);

-- Comments for content_drafts
COMMENT ON TABLE public.content_drafts IS 'Stores draft content for blog posts, articles, and press releases';
COMMENT ON COLUMN public.content_drafts.content_type IS 'Type of content: blog_post, article, or press_release';
COMMENT ON COLUMN public.content_drafts.form_data IS 'Complete form data for re-editing the draft';

-- ============================================================================
-- Enable RLS (Row Level Security)
-- ============================================================================

-- Enable RLS on content_drafts
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own drafts
CREATE POLICY IF NOT EXISTS "Users can view own drafts"
ON public.content_drafts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own drafts
CREATE POLICY IF NOT EXISTS "Users can insert own drafts"
ON public.content_drafts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own drafts
CREATE POLICY IF NOT EXISTS "Users can update own drafts"
ON public.content_drafts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own drafts
CREATE POLICY IF NOT EXISTS "Users can delete own drafts"
ON public.content_drafts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Function to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for content_drafts
DROP TRIGGER IF EXISTS update_content_drafts_updated_at ON public.content_drafts;
CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETE
-- ============================================================================
