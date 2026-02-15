-- ============================================================================
-- Enable pg_cron Extension and Update Tables
-- Purpose: Enable pg_cron for scheduled jobs and add missing fields
-- Created: February 2025
-- ============================================================================

-- =========================
-- 1. Enable pg_cron extension
-- =========================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- =========================
-- 2. Update scheduled_posts table
-- Add retry_count field if missing
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'scheduled_posts'
    AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.scheduled_posts
    ADD COLUMN retry_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add last_retry_at field if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'scheduled_posts'
    AND column_name = 'last_retry_at'
  ) THEN
    ALTER TABLE public.scheduled_posts
    ADD COLUMN last_retry_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add business_id field if missing (for multi-business support)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'scheduled_posts'
    AND column_name = 'business_id'
  ) THEN
    ALTER TABLE public.scheduled_posts
    ADD COLUMN business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =========================
-- 3. Update blog_publications table
-- Add keyword optimization fields
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'blog_publications'
    AND column_name = 'optimized_keywords'
  ) THEN
    ALTER TABLE public.blog_publications
    ADD COLUMN optimized_keywords JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'blog_publications'
    AND column_name = 'optimized_tags'
  ) THEN
    ALTER TABLE public.blog_publications
    ADD COLUMN optimized_tags JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'blog_publications'
    AND column_name = 'auto_optimized'
  ) THEN
    ALTER TABLE public.blog_publications
    ADD COLUMN auto_optimized BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =========================
-- 4. Add Service Role Policy for scheduled_posts
-- (Required for cron jobs to update status)
-- =========================
DROP POLICY IF EXISTS "Service role has full access to scheduled_posts" ON public.scheduled_posts;

CREATE POLICY "Service role has full access to scheduled_posts"
  ON public.scheduled_posts
  FOR ALL
  USING (auth.role() = 'service_role');

-- =========================
-- 5. Add Service Role Policy for social_connections
-- (Required for edge functions to read tokens)
-- =========================
DROP POLICY IF EXISTS "Service role has full access to social_connections" ON public.social_connections;

CREATE POLICY "Service role has full access to social_connections"
  ON public.social_connections
  FOR ALL
  USING (auth.role() = 'service_role');

-- =========================
-- 6. Grant permissions
-- =========================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_posts TO authenticated;
GRANT ALL ON public.scheduled_posts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_connections TO authenticated;
GRANT ALL ON public.social_connections TO service_role;

-- Comments
COMMENT ON COLUMN public.scheduled_posts.retry_count IS 'Number of retry attempts for failed posts (max 3)';
COMMENT ON COLUMN public.scheduled_posts.last_retry_at IS 'Timestamp of last retry attempt';
COMMENT ON COLUMN public.blog_publications.optimized_keywords IS 'AI-generated SEO keywords (array of strings)';
COMMENT ON COLUMN public.blog_publications.optimized_tags IS 'AI-generated tags (array of strings)';
COMMENT ON COLUMN public.blog_publications.auto_optimized IS 'Whether the post was automatically optimized by AI';
