-- ============================================================================
-- Social Connections & OAuth States Tables
-- Run this in Supabase SQL Editor to create required tables
-- ============================================================================

-- =========================
-- 1. oauth_states table
-- Temporary storage for OAuth CSRF state tokens during authorization flow
-- =========================
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick state lookups during OAuth callback
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);

-- Auto-cleanup expired states (optional: run via pg_cron or manual cleanup)
-- States expire after 10 minutes, this index helps identify them
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);

-- RLS: Service role only (API routes use service role key)
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes bypass RLS with service key)
-- No public policies needed - this table is only accessed server-side

-- =========================
-- 2. social_connections table
-- Persistent storage for user social media platform connections
-- =========================
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  platform_username TEXT,
  platform_page_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one active connection per user per platform
-- This prevents duplicate connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_connections_user_platform
  ON public.social_connections(user_id, platform)
  WHERE is_active = true;

-- Index for fetching user's connections
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id
  ON public.social_connections(user_id);

-- Index for filtering by active status
CREATE INDEX IF NOT EXISTS idx_social_connections_active
  ON public.social_connections(user_id, is_active);

-- RLS: Enable but allow service role full access
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can update own social connections" ON public.social_connections;

-- Policy: Users can read their own connections (for client-side access if needed)
CREATE POLICY "Users can view own social connections"
  ON public.social_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own connections (for disconnect)
CREATE POLICY "Users can update own social connections"
  ON public.social_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (insert/update/delete via API routes)
-- Note: Service role key automatically bypasses RLS

-- =========================
-- 3. Auto-update updated_at trigger
-- =========================
CREATE OR REPLACE FUNCTION public.update_social_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_connections_updated_at ON public.social_connections;
CREATE TRIGGER trigger_social_connections_updated_at
  BEFORE UPDATE ON public.social_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_social_connections_updated_at();

-- =========================
-- 4. Cleanup function for expired OAuth states
-- Call periodically or before inserting new states
-- =========================
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
