-- ============================================================================
-- JetServices: SQL Migration for Supabase
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. SERVICE LISTINGS TABLE
-- Stores all services offered by a business
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Other',
  price TEXT,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'starting_at', 'hourly', 'custom', 'free')),
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user + business
CREATE INDEX IF NOT EXISTS idx_service_listings_user_business
  ON service_listings(user_id, business_id);

-- Index for active services
CREATE INDEX IF NOT EXISTS idx_service_listings_active
  ON service_listings(is_active) WHERE is_active = true;

-- RLS: Users can only see/modify their own services
ALTER TABLE service_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services"
  ON service_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
  ON service_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON service_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON service_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for API routes
CREATE POLICY "Service role full access to service_listings"
  ON service_listings FOR ALL
  USING (auth.role() = 'service_role');


-- 2. SERVICE IMAGES TABLE
-- Stores images associated with each service (uploaded or AI-generated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES service_listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast image lookups by service
CREATE INDEX IF NOT EXISTS idx_service_images_service
  ON service_images(service_id);

-- RLS: Images inherit access from parent service
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service images"
  ON service_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM service_listings
      WHERE service_listings.id = service_images.service_id
      AND service_listings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own service images"
  ON service_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_listings
      WHERE service_listings.id = service_images.service_id
      AND service_listings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own service images"
  ON service_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM service_listings
      WHERE service_listings.id = service_images.service_id
      AND service_listings.user_id = auth.uid()
    )
  );

-- Service role bypass for API routes
CREATE POLICY "Service role full access to service_images"
  ON service_images FOR ALL
  USING (auth.role() = 'service_role');


-- 3. SERVICE CALENDAR EVENTS TABLE
-- Stores calendar events/appointments tied to services
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES service_listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TEXT DEFAULT '09:00',
  end_time TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user + business + date range
CREATE INDEX IF NOT EXISTS idx_service_calendar_user_business
  ON service_calendar_events(user_id, business_id);

CREATE INDEX IF NOT EXISTS idx_service_calendar_date
  ON service_calendar_events(event_date);

-- RLS: Users can only see/modify their own events
ALTER TABLE service_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
  ON service_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events"
  ON service_calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON service_calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON service_calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for API routes
CREATE POLICY "Service role full access to service_calendar_events"
  ON service_calendar_events FOR ALL
  USING (auth.role() = 'service_role');


-- 4. AUTO-UPDATE updated_at TRIGGER
-- Automatically sets updated_at on row modification
-- ============================================================================

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to service_listings
DROP TRIGGER IF EXISTS update_service_listings_updated_at ON service_listings;
CREATE TRIGGER update_service_listings_updated_at
  BEFORE UPDATE ON service_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Attach to service_calendar_events
DROP TRIGGER IF EXISTS update_service_calendar_events_updated_at ON service_calendar_events;
CREATE TRIGGER update_service_calendar_events_updated_at
  BEFORE UPDATE ON service_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 5. VERIFY: Ensure user_credits table exists (used for image generation limits)
-- This table should already exist from JetProduct/JetImage setup.
-- If not, uncomment and run:
-- ============================================================================
-- CREATE TABLE IF NOT EXISTS user_credits (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   month_year TEXT NOT NULL,
--   credits_used INTEGER DEFAULT 0,
--   credits_limit INTEGER DEFAULT 60,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   UNIQUE(user_id, month_year)
-- );
--
-- ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Service role full access to user_credits" ON user_credits FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- DONE!
-- Tables created: service_listings, service_images, service_calendar_events
-- All tables have RLS enabled with user-scoped policies.
-- Service role has full bypass access for API route operations.
-- ============================================================================
