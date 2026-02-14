-- ============================================================================
-- BLOG PUBLISHING SYSTEM
-- Purpose: Enable users to publish AI-generated blog content to WordPress,
--          Squarespace, and Wix websites
-- Created: February 2025
-- ============================================================================

-- =========================
-- website_connections table
-- Stores WordPress/Squarespace/Wix credentials and OAuth tokens
-- =========================
CREATE TABLE IF NOT EXISTS public.website_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User and business identification
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,

  -- Platform identification
  platform TEXT NOT NULL CHECK (platform IN ('wordpress', 'squarespace', 'wix')),

  -- Website details
  website_url TEXT NOT NULL, -- The main website URL (e.g., https://myblog.com)
  site_name TEXT, -- Display name of the website

  -- WordPress: Application Password credentials
  -- Stored encrypted for WordPress Basic Auth
  wordpress_username TEXT, -- WordPress admin username
  wordpress_app_password TEXT, -- Encrypted WordPress Application Password

  -- OAuth tokens for Squarespace and Wix
  -- These are encrypted using AES-256-CBC
  access_token TEXT, -- Encrypted OAuth access token
  refresh_token TEXT, -- Encrypted OAuth refresh token
  token_expires_at TIMESTAMPTZ, -- When the access token expires

  -- Platform-specific metadata
  -- Examples: site_id, blog_id, default_category, etc.
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Connection status
  is_active BOOLEAN DEFAULT TRUE, -- Whether this connection is currently active
  last_verified_at TIMESTAMPTZ, -- Last time the connection was verified

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one active connection per platform per user/business
  -- Users can have multiple websites but only one active per platform
  UNIQUE(user_id, business_id, platform, website_url)
);

-- Indexes for website_connections
CREATE INDEX IF NOT EXISTS idx_website_connections_user_id
  ON public.website_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_website_connections_business_id
  ON public.website_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_website_connections_platform
  ON public.website_connections(user_id, platform, is_active);

-- Comments for website_connections
COMMENT ON TABLE public.website_connections IS 'Stores website credentials and OAuth tokens for WordPress, Squarespace, and Wix';
COMMENT ON COLUMN public.website_connections.wordpress_app_password IS 'Encrypted WordPress Application Password for Basic Auth';
COMMENT ON COLUMN public.website_connections.access_token IS 'Encrypted OAuth access token (Squarespace/Wix)';
COMMENT ON COLUMN public.website_connections.refresh_token IS 'Encrypted OAuth refresh token (Squarespace/Wix)';
COMMENT ON COLUMN public.website_connections.metadata IS 'Platform-specific data: site_id, blog_id, categories, etc.';

-- =========================
-- blog_publications table
-- Tracks blog posts, scheduling, and publish status
-- =========================
CREATE TABLE IF NOT EXISTS public.blog_publications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User and business identification
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,

  -- Link to website connection
  website_connection_id UUID NOT NULL REFERENCES public.website_connections(id) ON DELETE CASCADE,

  -- Link to content draft (if exists)
  -- This references the content_drafts table that stores AI-generated blog content
  draft_id UUID, -- Reference to content_drafts.id (optional, not enforced FK)

  -- Blog post content
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML or markdown content
  excerpt TEXT, -- Short summary/excerpt

  -- SEO and metadata
  slug TEXT, -- URL slug for the blog post
  featured_image_url TEXT, -- URL to the featured/hero image
  categories TEXT[], -- Array of category names or IDs
  tags TEXT[], -- Array of tags
  meta_description TEXT, -- SEO meta description

  -- Publishing settings
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')
  ),

  -- Scheduling
  scheduled_publish_at TIMESTAMPTZ, -- When to auto-publish (NULL = publish immediately)
  timezone TEXT DEFAULT 'America/New_York',

  -- Publishing results
  published_at TIMESTAMPTZ, -- When it was actually published
  platform_post_id TEXT, -- The ID/URL of the post on the platform (e.g., WordPress post ID)
  platform_post_url TEXT, -- Public URL of the published post

  -- Error handling
  error_message TEXT, -- Error message if publishing failed
  retry_count INTEGER DEFAULT 0, -- Number of retry attempts
  last_retry_at TIMESTAMPTZ, -- Last retry timestamp

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Platform-specific metadata

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for blog_publications
CREATE INDEX IF NOT EXISTS idx_blog_publications_user_id
  ON public.blog_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_publications_business_id
  ON public.blog_publications(business_id);
CREATE INDEX IF NOT EXISTS idx_blog_publications_website_connection
  ON public.blog_publications(website_connection_id);
CREATE INDEX IF NOT EXISTS idx_blog_publications_status
  ON public.blog_publications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_publications_scheduled
  ON public.blog_publications(scheduled_publish_at, status)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_blog_publications_draft_id
  ON public.blog_publications(draft_id)
  WHERE draft_id IS NOT NULL;

-- Comments for blog_publications
COMMENT ON TABLE public.blog_publications IS 'Tracks blog posts and their publishing status across WordPress, Squarespace, and Wix';
COMMENT ON COLUMN public.blog_publications.draft_id IS 'Optional reference to content_drafts table';
COMMENT ON COLUMN public.blog_publications.scheduled_publish_at IS 'When to auto-publish (NULL = immediate)';
COMMENT ON COLUMN public.blog_publications.platform_post_id IS 'Post ID from the platform (e.g., WordPress post ID: 123)';
COMMENT ON COLUMN public.blog_publications.platform_post_url IS 'Public URL of the published post';

-- =========================
-- Auto-update updated_at triggers
-- =========================

-- Trigger function for website_connections
CREATE OR REPLACE FUNCTION public.update_website_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_website_connections_updated_at ON public.website_connections;
CREATE TRIGGER trigger_website_connections_updated_at
  BEFORE UPDATE ON public.website_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_website_connections_updated_at();

-- Trigger function for blog_publications
CREATE OR REPLACE FUNCTION public.update_blog_publications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog_publications_updated_at ON public.blog_publications;
CREATE TRIGGER trigger_blog_publications_updated_at
  BEFORE UPDATE ON public.blog_publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_publications_updated_at();

-- =========================
-- Row Level Security (RLS)
-- =========================

-- Enable RLS on both tables
ALTER TABLE public.website_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_publications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own website connections" ON public.website_connections;
DROP POLICY IF EXISTS "Users can create website connections" ON public.website_connections;
DROP POLICY IF EXISTS "Users can update own website connections" ON public.website_connections;
DROP POLICY IF EXISTS "Users can delete own website connections" ON public.website_connections;
DROP POLICY IF EXISTS "Service role has full access to website_connections" ON public.website_connections;

DROP POLICY IF EXISTS "Users can view own blog publications" ON public.blog_publications;
DROP POLICY IF EXISTS "Users can create blog publications" ON public.blog_publications;
DROP POLICY IF EXISTS "Users can update own blog publications" ON public.blog_publications;
DROP POLICY IF EXISTS "Users can delete own blog publications" ON public.blog_publications;
DROP POLICY IF EXISTS "Service role has full access to blog_publications" ON public.blog_publications;

-- ===========================
-- RLS Policies: website_connections
-- ===========================

-- Policy: Users can view their own website connections
CREATE POLICY "Users can view own website connections"
  ON public.website_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own website connections
CREATE POLICY "Users can create website connections"
  ON public.website_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own website connections
CREATE POLICY "Users can update own website connections"
  ON public.website_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own website connections
CREATE POLICY "Users can delete own website connections"
  ON public.website_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role has full access (for Edge Functions)
CREATE POLICY "Service role has full access to website_connections"
  ON public.website_connections
  FOR ALL
  USING (auth.role() = 'service_role');

-- ===========================
-- RLS Policies: blog_publications
-- ===========================

-- Policy: Users can view their own blog publications
CREATE POLICY "Users can view own blog publications"
  ON public.blog_publications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own blog publications
CREATE POLICY "Users can create blog publications"
  ON public.blog_publications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own blog publications
CREATE POLICY "Users can update own blog publications"
  ON public.blog_publications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own blog publications
CREATE POLICY "Users can delete own blog publications"
  ON public.blog_publications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role has full access (for Edge Functions and cron jobs)
CREATE POLICY "Service role has full access to blog_publications"
  ON public.blog_publications
  FOR ALL
  USING (auth.role() = 'service_role');

-- =========================
-- Grant permissions
-- =========================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_connections TO authenticated;
GRANT ALL ON public.website_connections TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_publications TO authenticated;
GRANT ALL ON public.blog_publications TO service_role;

-- =========================
-- Verification queries
-- =========================
-- SELECT * FROM public.website_connections WHERE user_id = 'YOUR-USER-UUID';
-- SELECT * FROM public.blog_publications WHERE user_id = 'YOUR-USER-UUID';
