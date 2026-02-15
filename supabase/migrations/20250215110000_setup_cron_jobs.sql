-- ============================================================================
-- Setup Cron Jobs for Scheduled Publishing
-- Purpose: Configure pg_cron to automatically publish blog and social posts
-- Created: February 2025
-- ============================================================================

-- NOTE: This migration sets up cron jobs, but you MUST configure the service role key
-- in Supabase vault or as a secret before these jobs will work.
--
-- SETUP INSTRUCTIONS:
-- 1. In Supabase Dashboard, go to Project Settings > Vault
-- 2. Create a new secret: 'service_role_key' with your service role key
-- 3. Alternatively, ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment

-- =========================
-- 1. Unschedule existing jobs (if they exist)
-- This ensures we can safely re-run this migration
-- =========================
SELECT cron.unschedule('schedule-blog-publish') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'schedule-blog-publish'
);

SELECT cron.unschedule('schedule-social-publish') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'schedule-social-publish'
);

-- =========================
-- 2. Blog Post Scheduler - Runs every 5 minutes
-- Checks for scheduled blog posts and publishes them to WordPress/Squarespace/Wix
-- =========================
SELECT cron.schedule(
  'schedule-blog-publish',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/schedule-blog-publish',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- =========================
-- 3. Social Post Scheduler - Runs every minute
-- Checks for scheduled social media posts and publishes them to Facebook/Instagram/Twitter/LinkedIn/TikTok
-- =========================
SELECT cron.schedule(
  'schedule-social-publish',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url := 'https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/schedule-social-publish',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- =========================
-- 4. Comments and Documentation
-- =========================
COMMENT ON EXTENSION pg_cron IS 'Cron-based job scheduler for PostgreSQL';

-- =========================
-- 5. Verify cron jobs are scheduled
-- Run this query to see all scheduled jobs:
-- SELECT * FROM cron.job;
-- =========================

-- =========================
-- 6. View cron job run history
-- Run this query to see job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- =========================

-- =========================
-- IMPORTANT SETUP STEPS AFTER MIGRATION:
-- =========================
-- 1. Set service role key in PostgreSQL settings:
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
--
-- 2. Or use Supabase Vault to store the key securely:
--    - Go to Supabase Dashboard > Project Settings > Vault
--    - Create secret: service_role_key
--    - Update cron jobs to reference: vault.get_secret('service_role_key')
--
-- 3. Ensure CRON_SECRET environment variable is set in Edge Functions settings
--
-- 4. Verify cron jobs are running:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
