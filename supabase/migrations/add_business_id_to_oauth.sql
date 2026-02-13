-- ============================================================================
-- Migration: Add business_id to OAuth Tables
-- Purpose: Enable multi-business OAuth connection support
-- Date: 2026-02-13
-- ============================================================================

-- =========================
-- 1. Add business_id to oauth_states table
-- =========================
ALTER TABLE public.oauth_states
  ADD COLUMN IF NOT EXISTS business_id UUID;

-- Add foreign key constraint to business_profiles
ALTER TABLE public.oauth_states
  ADD CONSTRAINT fk_oauth_states_business_id
  FOREIGN KEY (business_id)
  REFERENCES public.business_profiles(id)
  ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_business_id
  ON public.oauth_states(business_id);

-- =========================
-- 2. Add business_id to social_connections table
-- =========================
ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS business_id UUID;

-- Add foreign key constraint to business_profiles
ALTER TABLE public.social_connections
  ADD CONSTRAINT fk_social_connections_business_id
  FOREIGN KEY (business_id)
  REFERENCES public.business_profiles(id)
  ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_connections_business_id
  ON public.social_connections(business_id);

-- Add composite index for common query pattern (user + business + platform)
CREATE INDEX IF NOT EXISTS idx_social_connections_user_business_platform
  ON public.social_connections(user_id, business_id, platform);

-- =========================
-- 3. Update unique constraint
-- =========================
-- Drop old unique constraint (one connection per user per platform)
DROP INDEX IF EXISTS idx_social_connections_user_platform;

-- Create new unique constraint (one connection per user per business per platform)
-- This allows different businesses to have their own social connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_connections_user_business_platform_unique
  ON public.social_connections(user_id, business_id, platform)
  WHERE is_active = true;

-- =========================
-- 4. Add RLS policies for business-scoped access
-- =========================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own social connections" ON public.social_connections;
DROP POLICY IF EXISTS "Users can update own social connections" ON public.social_connections;

-- Policy: Users can view connections for their own businesses
CREATE POLICY "Users can view own business social connections"
  ON public.social_connections
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE business_profiles.id = social_connections.business_id
      AND business_profiles.user_id = auth.uid()
    )
  );

-- Policy: Users can update connections for their own businesses
CREATE POLICY "Users can update own business social connections"
  ON public.social_connections
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE business_profiles.id = social_connections.business_id
      AND business_profiles.user_id = auth.uid()
    )
  );

-- Policy: Users can insert connections for their own businesses
CREATE POLICY "Users can insert own business social connections"
  ON public.social_connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE business_profiles.id = social_connections.business_id
      AND business_profiles.user_id = auth.uid()
    )
  );

-- Policy: Users can delete connections for their own businesses
CREATE POLICY "Users can delete own business social connections"
  ON public.social_connections
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE business_profiles.id = social_connections.business_id
      AND business_profiles.user_id = auth.uid()
    )
  );

-- =========================
-- 5. Comments for documentation
-- =========================
COMMENT ON COLUMN public.oauth_states.business_id IS 'Business ID for multi-business OAuth support - REQUIRED for new connections';
COMMENT ON COLUMN public.social_connections.business_id IS 'Business ID for multi-business OAuth support - allows different businesses to have separate social connections';
COMMENT ON INDEX idx_social_connections_user_business_platform_unique IS 'Ensures one active connection per user per business per platform';

-- =========================
-- 6. Data backfill (IMPORTANT for existing connections)
-- =========================
-- For existing connections without business_id, associate with user's primary business
-- This prevents existing connections from being orphaned
UPDATE public.social_connections sc
SET business_id = (
  SELECT id
  FROM public.business_profiles bp
  WHERE bp.user_id = sc.user_id
  AND bp.is_primary = true
  LIMIT 1
)
WHERE sc.business_id IS NULL;

-- =========================
-- 7. Make business_id NOT NULL (after backfill)
-- =========================
-- After backfill, enforce business_id requirement for data integrity
ALTER TABLE public.social_connections
  ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE public.oauth_states
  ALTER COLUMN business_id SET NOT NULL;

-- Migration complete
-- Run this in your Supabase SQL Editor before deploying code changes
