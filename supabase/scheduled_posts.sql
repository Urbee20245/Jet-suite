-- ============================================================================
-- Scheduled Posts Table
-- Run this in Supabase SQL Editor to create the scheduled_posts table
-- ============================================================================

-- =========================
-- scheduled_posts table
-- Stores social media posts scheduled for future posting
-- =========================
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_text TEXT NOT NULL,
  hashtags TEXT,
  visual_suggestion TEXT,
  image_url TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posting', 'posted', 'failed', 'draft', 'cancelled')),
  posted_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching user's posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id
  ON public.scheduled_posts(user_id);

-- Index for querying by date range
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_date
  ON public.scheduled_posts(user_id, scheduled_date);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status
  ON public.scheduled_posts(user_id, status);

-- Composite index for common queries (user + date range + status)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_date_status
  ON public.scheduled_posts(user_id, scheduled_date, status);

-- =========================
-- Row Level Security (RLS)
-- =========================
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own posts
CREATE POLICY "Users can view own scheduled posts"
  ON public.scheduled_posts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own posts
CREATE POLICY "Users can create scheduled posts"
  ON public.scheduled_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own scheduled posts"
  ON public.scheduled_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete own scheduled posts"
  ON public.scheduled_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- =========================
-- Auto-update updated_at trigger
-- =========================
CREATE OR REPLACE FUNCTION public.update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scheduled_posts_updated_at ON public.scheduled_posts;
CREATE TRIGGER trigger_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scheduled_posts_updated_at();

-- =========================
-- Sample query to verify table
-- =========================
-- SELECT * FROM public.scheduled_posts WHERE user_id = 'YOUR-USER-UUID';
